package catalog

import (
	"context"
	"database/sql"
	_ "embed"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	_ "modernc.org/sqlite"
)

//go:embed schema.sql
var schemaSQL string

type Catalog struct {
	db *sql.DB
}

func Open(path string) (*Catalog, error) {
	db, err := sql.Open("sqlite", path+"?_pragma=journal_mode(WAL)&_pragma=busy_timeout(5000)")
	if err != nil {
		return nil, err
	}
	if _, err := db.Exec(schemaSQL); err != nil {
		db.Close()
		return nil, fmt.Errorf("apply schema: %w", err)
	}
	return &Catalog{db: db}, nil
}

func (c *Catalog) Close() error { return c.db.Close() }

// ---------- Video ----------

type Video struct {
	ID              string    `json:"id"`
	DriveID         string    `json:"driveId"`
	FileID          string    `json:"fileId"`
	ParentID        string    `json:"parentId"`
	Title           string    `json:"title"`
	Author          string    `json:"author"`
	Tags            []string  `json:"tags"`
	DurationSeconds int       `json:"durationSeconds"`
	Size            int64     `json:"size"`
	Ext             string    `json:"ext"`
	Quality         string    `json:"quality"`
	ThumbnailURL    string    `json:"thumbnailUrl"`
	PreviewFileID   string    `json:"previewFileId"`
	PreviewLocal    string    `json:"previewLocal"`
	PreviewStatus   string    `json:"previewStatus"`
	Views           int       `json:"views"`
	Favorites       int       `json:"favorites"`
	Comments        int       `json:"comments"`
	Likes           int       `json:"likes"`
	Dislikes        int       `json:"dislikes"`
	Category        string    `json:"category"`
	Badges          []string  `json:"badges"`
	Description     string    `json:"description"`
	PublishedAt     time.Time `json:"publishedAt"`
	CreatedAt       time.Time `json:"createdAt"`
	UpdatedAt       time.Time `json:"updatedAt"`
}

func (c *Catalog) UpsertVideo(ctx context.Context, v *Video) error {
	tagsJSON, _ := json.Marshal(v.Tags)
	badgesJSON, _ := json.Marshal(v.Badges)
	now := time.Now().UnixMilli()
	if v.CreatedAt.IsZero() {
		v.CreatedAt = time.UnixMilli(now)
	}
	v.UpdatedAt = time.UnixMilli(now)

	_, err := c.db.ExecContext(ctx, `
INSERT INTO videos (
  id, drive_id, file_id, parent_id, title, author, tags,
  duration_seconds, size_bytes, ext, quality, thumbnail_url,
  preview_file_id, preview_local, preview_status,
  views, favorites, comments, likes, dislikes,
  category, badges, description, published_at, created_at, updated_at
) VALUES (
  ?, ?, ?, ?, ?, ?, ?,
  ?, ?, ?, ?, ?,
  ?, ?, ?,
  ?, ?, ?, ?, ?,
  ?, ?, ?, ?, ?, ?
)
ON CONFLICT(id) DO UPDATE SET
  title           = excluded.title,
  author          = excluded.author,
  tags            = excluded.tags,
  duration_seconds= excluded.duration_seconds,
  size_bytes      = excluded.size_bytes,
  ext             = excluded.ext,
  quality         = excluded.quality,
  thumbnail_url   = excluded.thumbnail_url,
  category        = excluded.category,
  badges          = excluded.badges,
  description     = excluded.description,
  updated_at      = excluded.updated_at
`,
		v.ID, v.DriveID, v.FileID, v.ParentID, v.Title, v.Author, string(tagsJSON),
		v.DurationSeconds, v.Size, v.Ext, v.Quality, v.ThumbnailURL,
		v.PreviewFileID, v.PreviewLocal, nullableStatus(v.PreviewStatus),
		v.Views, v.Favorites, v.Comments, v.Likes, v.Dislikes,
		v.Category, string(badgesJSON), v.Description,
		v.PublishedAt.UnixMilli(), v.CreatedAt.UnixMilli(), v.UpdatedAt.UnixMilli(),
	)
	return err
}

func nullableStatus(s string) string {
	if s == "" {
		return "pending"
	}
	return s
}

func (c *Catalog) UpdatePreview(ctx context.Context, id, previewFileID, previewLocal, status string) error {
	_, err := c.db.ExecContext(ctx,
		`UPDATE videos SET preview_file_id = ?, preview_local = ?, preview_status = ?, updated_at = ? WHERE id = ?`,
		previewFileID, previewLocal, status, time.Now().UnixMilli(), id)
	return err
}

// IncrementLike 原子 +1，返回最新点赞数
func (c *Catalog) IncrementLike(ctx context.Context, id string) (int, error) {
	tx, err := c.db.BeginTx(ctx, nil)
	if err != nil {
		return 0, err
	}
	defer tx.Rollback()
	if _, err := tx.ExecContext(ctx,
		`UPDATE videos SET likes = likes + 1, updated_at = ? WHERE id = ?`,
		time.Now().UnixMilli(), id); err != nil {
		return 0, err
	}
	var likes int
	if err := tx.QueryRowContext(ctx, `SELECT likes FROM videos WHERE id = ?`, id).Scan(&likes); err != nil {
		return 0, err
	}
	if err := tx.Commit(); err != nil {
		return 0, err
	}
	return likes, nil
}

// VideoMetaPatch 轻量更新视频元数据（仅非零值字段会被写入）
type VideoMetaPatch struct {
	ThumbnailURL    string
	DurationSeconds int
	Category        string
}

func (c *Catalog) UpdateVideoMeta(ctx context.Context, id string, p VideoMetaPatch) error {
	parts := []string{}
	args := []any{}
	if p.ThumbnailURL != "" {
		parts = append(parts, "thumbnail_url = ?")
		args = append(args, p.ThumbnailURL)
	}
	if p.DurationSeconds > 0 {
		parts = append(parts, "duration_seconds = ?")
		args = append(args, p.DurationSeconds)
	}
	if p.Category != "" {
		parts = append(parts, "category = ?")
		args = append(args, p.Category)
	}
	if len(parts) == 0 {
		return nil
	}
	parts = append(parts, "updated_at = ?")
	args = append(args, time.Now().UnixMilli())
	args = append(args, id)
	q := `UPDATE videos SET ` + strings.Join(parts, ", ") + ` WHERE id = ?`
	_, err := c.db.ExecContext(ctx, q, args...)
	return err
}

// ListCategories 聚合所有 category，按视频数降序
type CategoryStat struct {
	Category string
	Count    int
}

func (c *Catalog) ListCategories(ctx context.Context) ([]CategoryStat, error) {
	rows, err := c.db.QueryContext(ctx,
		`SELECT COALESCE(category, '') AS c, COUNT(*) AS cnt
		 FROM videos
		 WHERE category IS NOT NULL AND category != ''
		 GROUP BY c
		 ORDER BY cnt DESC, c ASC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []CategoryStat
	for rows.Next() {
		var s CategoryStat
		if err := rows.Scan(&s.Category, &s.Count); err != nil {
			return nil, err
		}
		out = append(out, s)
	}
	return out, nil
}

// ListVideosByPreviewStatus 按预览状态列出全部视频，通常用于启动补扫
func (c *Catalog) ListVideosByPreviewStatus(ctx context.Context, driveID, status string, limit int) ([]*Video, error) {
	if limit <= 0 {
		limit = 10000
	}
	rows, err := c.db.QueryContext(ctx,
		`SELECT `+allVideoCols+` FROM videos WHERE drive_id = ? AND preview_status = ? ORDER BY created_at ASC LIMIT ?`,
		driveID, status, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []*Video
	for rows.Next() {
		v, err := scanVideo(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, v)
	}
	return out, nil
}

func (c *Catalog) GetVideo(ctx context.Context, id string) (*Video, error) {
	row := c.db.QueryRowContext(ctx, `SELECT `+allVideoCols+` FROM videos WHERE id = ?`, id)
	return scanVideo(row)
}

type ListParams struct {
	Keyword  string
	Tag      string
	Category string
	Sort     string // latest | hot | week | long
	Page     int
	PageSize int
}

func (c *Catalog) ListVideos(ctx context.Context, p ListParams) ([]*Video, int, error) {	if p.PageSize <= 0 {
		p.PageSize = 24
	}
	if p.Page <= 0 {
		p.Page = 1
	}

	var where []string
	var args []any
	if p.Keyword != "" {
		where = append(where, "(title LIKE ? OR author LIKE ?)")
		like := "%" + p.Keyword + "%"
		args = append(args, like, like)
	}
	if p.Tag != "" {
		where = append(where, "tags LIKE ?")
		args = append(args, "%\""+p.Tag+"\"%")
	}
	if p.Category != "" && p.Category != "all" {
		where = append(where, "category = ?")
		args = append(args, p.Category)
	}

	whereSQL := ""
	if len(where) > 0 {
		whereSQL = " WHERE " + strings.Join(where, " AND ")
	}

	orderBy := " ORDER BY published_at DESC"
	switch p.Sort {
	case "hot":
		// 热度 = 点赞数，点赞相同按最新
		orderBy = " ORDER BY likes DESC, published_at DESC"
	case "week":
		orderBy = " ORDER BY likes DESC"
	case "long":
		orderBy = " ORDER BY duration_seconds DESC"
	}

	// count
	var total int
	if err := c.db.QueryRowContext(ctx, "SELECT COUNT(*) FROM videos"+whereSQL, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	// list
	offset := (p.Page - 1) * p.PageSize
	rows, err := c.db.QueryContext(ctx,
		"SELECT "+allVideoCols+" FROM videos"+whereSQL+orderBy+" LIMIT ? OFFSET ?",
		append(args, p.PageSize, offset)...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var out []*Video
	for rows.Next() {
		v, err := scanVideo(rows)
		if err != nil {
			return nil, 0, err
		}
		out = append(out, v)
	}
	return out, total, nil
}

// ---------- Drive ----------

type Drive struct {
	ID          string            `json:"id"`
	Kind        string            `json:"kind"`
	Name        string            `json:"name"`
	RootID      string            `json:"rootId"`
	ScanRootID  string            `json:"scanRootId"`
	Credentials map[string]string `json:"credentials,omitempty"`
	Status      string            `json:"status"`
	LastError   string            `json:"lastError,omitempty"`
	CreatedAt   time.Time         `json:"createdAt"`
	UpdatedAt   time.Time         `json:"updatedAt"`
}

func (c *Catalog) UpsertDrive(ctx context.Context, d *Drive) error {
	cred, _ := json.Marshal(d.Credentials)
	now := time.Now().UnixMilli()
	if d.CreatedAt.IsZero() {
		d.CreatedAt = time.UnixMilli(now)
	}
	d.UpdatedAt = time.UnixMilli(now)
	_, err := c.db.ExecContext(ctx, `
INSERT INTO drives (id, kind, name, root_id, scan_root_id, credentials, status, last_error, created_at, updated_at)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
ON CONFLICT(id) DO UPDATE SET
  kind         = excluded.kind,
  name         = excluded.name,
  root_id      = excluded.root_id,
  scan_root_id = excluded.scan_root_id,
  credentials  = excluded.credentials,
  status       = excluded.status,
  last_error   = excluded.last_error,
  updated_at   = excluded.updated_at
`, d.ID, d.Kind, d.Name, d.RootID, d.ScanRootID, string(cred), d.Status, d.LastError,
		d.CreatedAt.UnixMilli(), d.UpdatedAt.UnixMilli())
	return err
}

func (c *Catalog) ListDrives(ctx context.Context) ([]*Drive, error) {
	rows, err := c.db.QueryContext(ctx, `SELECT id, kind, name, root_id, COALESCE(scan_root_id, ''), COALESCE(credentials, '{}'), status, COALESCE(last_error, ''), created_at, updated_at FROM drives ORDER BY created_at ASC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []*Drive
	for rows.Next() {
		d := &Drive{}
		var credsStr string
		var createdAt, updatedAt int64
		if err := rows.Scan(&d.ID, &d.Kind, &d.Name, &d.RootID, &d.ScanRootID, &credsStr, &d.Status, &d.LastError, &createdAt, &updatedAt); err != nil {
			return nil, err
		}
		_ = json.Unmarshal([]byte(credsStr), &d.Credentials)
		d.CreatedAt = time.UnixMilli(createdAt)
		d.UpdatedAt = time.UnixMilli(updatedAt)
		out = append(out, d)
	}
	return out, nil
}

func (c *Catalog) GetDrive(ctx context.Context, id string) (*Drive, error) {
	row := c.db.QueryRowContext(ctx, `SELECT id, kind, name, root_id, COALESCE(scan_root_id, ''), COALESCE(credentials, '{}'), status, COALESCE(last_error, ''), created_at, updated_at FROM drives WHERE id = ?`, id)
	d := &Drive{}
	var credsStr string
	var createdAt, updatedAt int64
	if err := row.Scan(&d.ID, &d.Kind, &d.Name, &d.RootID, &d.ScanRootID, &credsStr, &d.Status, &d.LastError, &createdAt, &updatedAt); err != nil {
		return nil, err
	}
	_ = json.Unmarshal([]byte(credsStr), &d.Credentials)
	d.CreatedAt = time.UnixMilli(createdAt)
	d.UpdatedAt = time.UnixMilli(updatedAt)
	return d, nil
}

func (c *Catalog) DeleteDrive(ctx context.Context, id string) error {
	_, err := c.db.ExecContext(ctx, `DELETE FROM drives WHERE id = ?`, id)
	return err
}

// ---------- Admin session ----------

func (c *Catalog) CreateSession(ctx context.Context, token string, ttl time.Duration) error {
	now := time.Now()
	_, err := c.db.ExecContext(ctx,
		`INSERT INTO admin_sessions (token, created_at, expires_at) VALUES (?, ?, ?)`,
		token, now.UnixMilli(), now.Add(ttl).UnixMilli())
	return err
}

func (c *Catalog) ValidateSession(ctx context.Context, token string) (bool, error) {
	var expires int64
	err := c.db.QueryRowContext(ctx, `SELECT expires_at FROM admin_sessions WHERE token = ?`, token).Scan(&expires)
	if err == sql.ErrNoRows {
		return false, nil
	}
	if err != nil {
		return false, err
	}
	return time.Now().UnixMilli() < expires, nil
}

func (c *Catalog) DeleteSession(ctx context.Context, token string) error {
	_, err := c.db.ExecContext(ctx, `DELETE FROM admin_sessions WHERE token = ?`, token)
	return err
}

// ---------- Settings ----------

func (c *Catalog) GetSetting(ctx context.Context, key, defaultValue string) (string, error) {
	var v string
	err := c.db.QueryRowContext(ctx, `SELECT value FROM settings WHERE key = ?`, key).Scan(&v)
	if err == sql.ErrNoRows {
		return defaultValue, nil
	}
	if err != nil {
		return "", err
	}
	return v, nil
}

func (c *Catalog) SetSetting(ctx context.Context, key, value string) error {
	_, err := c.db.ExecContext(ctx, `
INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)
ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
`, key, value, time.Now().UnixMilli())
	return err
}

// ---------- helpers ----------

const allVideoCols = `
id, drive_id, file_id, COALESCE(parent_id, ''), title, COALESCE(author, ''), COALESCE(tags, '[]'),
duration_seconds, size_bytes, COALESCE(ext, ''), COALESCE(quality, ''), COALESCE(thumbnail_url, ''),
COALESCE(preview_file_id, ''), COALESCE(preview_local, ''), COALESCE(preview_status, 'pending'),
views, favorites, comments, likes, dislikes,
COALESCE(category, ''), COALESCE(badges, '[]'), COALESCE(description, ''),
published_at, created_at, updated_at
`

type rowScanner interface {
	Scan(dest ...any) error
}

func scanVideo(row rowScanner) (*Video, error) {
	v := &Video{}
	var tagsJSON, badgesJSON string
	var publishedAt, createdAt, updatedAt int64
	err := row.Scan(
		&v.ID, &v.DriveID, &v.FileID, &v.ParentID, &v.Title, &v.Author, &tagsJSON,
		&v.DurationSeconds, &v.Size, &v.Ext, &v.Quality, &v.ThumbnailURL,
		&v.PreviewFileID, &v.PreviewLocal, &v.PreviewStatus,
		&v.Views, &v.Favorites, &v.Comments, &v.Likes, &v.Dislikes,
		&v.Category, &badgesJSON, &v.Description,
		&publishedAt, &createdAt, &updatedAt,
	)
	if err != nil {
		return nil, err
	}
	_ = json.Unmarshal([]byte(tagsJSON), &v.Tags)
	_ = json.Unmarshal([]byte(badgesJSON), &v.Badges)
	v.PublishedAt = time.UnixMilli(publishedAt)
	v.CreatedAt = time.UnixMilli(createdAt)
	v.UpdatedAt = time.UnixMilli(updatedAt)
	return v, nil
}
