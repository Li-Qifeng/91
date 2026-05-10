package scanner

import (
	"context"
	"fmt"
	"log"
	"path"
	"strings"
	"time"

	"github.com/video-site/backend/internal/catalog"
	"github.com/video-site/backend/internal/drives"
)

type Scanner struct {
	Catalog *catalog.Catalog
	Drive   drives.Drive
	Exts    map[string]bool
	MaxDepth int
	// 回调：新视频被加入后触发 teaser 生成
	OnNewVideo func(v *catalog.Video)
}

func New(cat *catalog.Catalog, drv drives.Drive, exts []string, maxDepth int, onNew func(v *catalog.Video)) *Scanner {
	m := make(map[string]bool, len(exts))
	for _, e := range exts {
		m[strings.ToLower(e)] = true
	}
	if maxDepth == 0 {
		maxDepth = 5
	}
	return &Scanner{
		Catalog:    cat,
		Drive:      drv,
		Exts:       m,
		MaxDepth:   maxDepth,
		OnNewVideo: onNew,
	}
}

type Stats struct {
	Scanned int
	Added   int
}

// Run 从 Drive.RootID 开始扫描
func (s *Scanner) Run(ctx context.Context, startDirID string) (Stats, error) {
	if startDirID == "" {
		startDirID = s.Drive.RootID()
	}
	stats := Stats{}
	if err := s.walk(ctx, startDirID, "", 0, &stats); err != nil {
		return stats, err
	}
	return stats, nil
}

func (s *Scanner) walk(ctx context.Context, dirID, dirName string, depth int, stats *Stats) error {
	if depth >= s.MaxDepth {
		return nil
	}
	if err := ctx.Err(); err != nil {
		return err
	}

	entries, err := s.Drive.List(ctx, dirID)
	if err != nil {
		return fmt.Errorf("list %s: %w", dirID, err)
	}

	for _, e := range entries {
		if e.IsDir {
			// 跳过 previews 目录，避免扫到自己生成的 teaser
			if strings.EqualFold(e.Name, "previews") {
				continue
			}
			if err := s.walk(ctx, e.ID, e.Name, depth+1, stats); err != nil {
				log.Printf("[scanner] walk %s error: %v", e.Name, err)
			}
			continue
		}

		stats.Scanned++
		ext := strings.ToLower(path.Ext(e.Name))
		if !s.Exts[ext] {
			continue
		}

		id := s.Drive.Kind() + "-" + s.Drive.ID() + "-" + e.ID
		existing, _ := s.Catalog.GetVideo(ctx, id)
		if existing != nil {
			// 已存在但 category 空缺时，顺便补 category
			if existing.Category == "" && dirName != "" {
				_ = s.Catalog.UpdateVideoMeta(ctx, id, catalog.VideoMetaPatch{Category: dirName})
			}
			continue
		}

		parsed := Parse(e.Name)
		if parsed.Title == "" {
			parsed.Title = strings.TrimSuffix(e.Name, ext)
		}

		now := time.Now()
		v := &catalog.Video{
			ID:              id,
			DriveID:         s.Drive.ID(),
			FileID:          e.ID,
			ParentID:        e.ParentID,
			Title:           parsed.Title,
			Author:          parsed.Author,
			Tags:            parsed.Tags,
			Ext:             strings.TrimPrefix(ext, "."),
			Quality:         "HD",
			Size:            e.Size,
			PreviewStatus:   "pending",
			Category:        dirName,
			PublishedAt:     orDefault(e.ModTime, now),
			CreatedAt:       now,
			UpdatedAt:       now,
		}
		if err := s.Catalog.UpsertVideo(ctx, v); err != nil {
			log.Printf("[scanner] upsert %s error: %v", v.Title, err)
			continue
		}
		stats.Added++
		if s.OnNewVideo != nil {
			s.OnNewVideo(v)
		}
	}
	return nil
}

func orDefault(t time.Time, d time.Time) time.Time {
	if t.IsZero() {
		return d
	}
	return t
}
