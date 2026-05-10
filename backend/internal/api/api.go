package api

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/go-chi/chi/v5"

	"github.com/video-site/backend/internal/auth"
	"github.com/video-site/backend/internal/catalog"
	"github.com/video-site/backend/internal/proxy"
)

type Server struct {
	Catalog  *catalog.Catalog
	Proxy    *proxy.Proxy
	LocalDir string
}

// VideoDTO 是返回给前端的视频对象，字段名跟前端 VideoItem 对齐
type VideoDTO struct {
	ID              string   `json:"id"`
	Href            string   `json:"href"`
	Title           string   `json:"title"`
	Thumbnail       string   `json:"thumbnail"`
	PreviewSrc      string   `json:"previewSrc"`
	PreviewDuration int      `json:"previewDuration"`
	PreviewStrategy string   `json:"previewStrategy"`
	Duration        string   `json:"duration"`
	Badges          []string `json:"badges"`
	Quality         string   `json:"quality,omitempty"`
	Author          string   `json:"author"`
	Views           int      `json:"views"`
	Favorites       int      `json:"favorites"`
	Comments        int      `json:"comments"`
	Likes           int      `json:"likes"`
	Dislikes        int      `json:"dislikes"`
	PublishedAt     string   `json:"publishedAt"`
	Tags            []string `json:"tags,omitempty"`
	Category        string   `json:"category,omitempty"`
}

type VideoDetailDTO struct {
	VideoDTO
	VideoSrc        string        `json:"videoSrc"`
	Poster          string        `json:"poster"`
	Description     string        `json:"description"`
	EmbedURL        string        `json:"embedUrl"`
	Points          int           `json:"points,omitempty"`
	AuthorProfile   AuthorProfile `json:"authorProfile"`
	RelatedVideos   []VideoDTO    `json:"relatedVideos"`
	CommentsList    []Comment     `json:"commentsList"`
}

type AuthorProfile struct {
	ID    string   `json:"id"`
	Name  string   `json:"name"`
	Href  string   `json:"href"`
	Badges []string `json:"badges"`
}

type Comment struct {
	ID        string `json:"id"`
	Author    string `json:"author"`
	Body      string `json:"body"`
	CreatedAt string `json:"createdAt"`
	Likes     int    `json:"likes,omitempty"`
}

// RegisterRoutes 挂载前台 REST 路由。前台接口需要登录态。
func (s *Server) RegisterRoutes(r chi.Router, a *auth.Authenticator) {
	r.Group(func(r chi.Router) {
		r.Use(a.Required)
		r.Get("/api/home", s.handleHome)
		r.Get("/api/list", s.handleList)
		r.Get("/api/video/{id}", s.handleVideoDetail)
		r.Post("/api/video/{id}/like", s.handleLike)
		r.Get("/api/tags", s.handleTags)

		// 代理路由同样需要鉴权，防止绕过
		r.Get("/p/stream/{driveID}/{fileID}", s.handleStream)
		r.Get("/p/preview/{videoID}", s.handlePreview)
		r.Get("/p/thumb/{videoID}", s.handleThumb)
	})
}

func (s *Server) handleHome(w http.ResponseWriter, r *http.Request) {
	items, _, err := s.Catalog.ListVideos(r.Context(), catalog.ListParams{
		Sort: "hot", Page: 1, PageSize: 24,
	})
	if err != nil {
		writeErr(w, http.StatusInternalServerError, err)
		return
	}
	writeJSON(w, http.StatusOK, mapVideos(items))
}

func (s *Server) handleList(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	page, _ := strconv.Atoi(q.Get("page"))
	size, _ := strconv.Atoi(q.Get("size"))
	if size <= 0 {
		size = 24
	}
	params := catalog.ListParams{
		Keyword:  q.Get("q"),
		Tag:      q.Get("tag"),
		Category: q.Get("cat"),
		Sort:     q.Get("sort"),
		Page:     page,
		PageSize: size,
	}
	items, total, err := s.Catalog.ListVideos(r.Context(), params)
	if err != nil {
		writeErr(w, http.StatusInternalServerError, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"items": mapVideos(items),
		"total": total,
		"page":  params.Page,
		"size":  params.PageSize,
	})
}

func (s *Server) handleVideoDetail(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	v, err := s.Catalog.GetVideo(r.Context(), id)
	if err != nil {
		writeErr(w, http.StatusNotFound, err)
		return
	}
	related, _, _ := s.Catalog.ListVideos(r.Context(), catalog.ListParams{
		Sort: "hot", Page: 1, PageSize: 8,
	})

	detail := VideoDetailDTO{
		VideoDTO:    mapVideo(v),
		VideoSrc:    fmt.Sprintf("/p/stream/%s/%s", v.DriveID, v.FileID),
		Poster:      v.ThumbnailURL,
		Description: v.Description,
		EmbedURL: fmt.Sprintf(`<iframe src="/embed/%s" width="640" height="360" frameborder="0" allowfullscreen></iframe>`, v.ID),
		AuthorProfile: AuthorProfile{
			ID:    "author-" + v.Author,
			Name:  v.Author,
			Href:  "/author/" + v.Author,
			Badges: []string{},
		},
		RelatedVideos: filterVideos(mapVideos(related), v.ID),
		CommentsList:  []Comment{},
	}
	writeJSON(w, http.StatusOK, detail)
}

func (s *Server) handleTags(w http.ResponseWriter, r *http.Request) {
	cats, err := s.Catalog.ListCategories(r.Context())
	if err != nil {
		writeErr(w, http.StatusInternalServerError, err)
		return
	}
	type tag struct {
		ID    string `json:"id"`
		Label string `json:"label"`
		Count int    `json:"count"`
	}
	out := make([]tag, 0, len(cats))
	for _, c := range cats {
		out = append(out, tag{ID: c.Category, Label: c.Category, Count: c.Count})
	}
	writeJSON(w, http.StatusOK, out)
}

func (s *Server) handleLike(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	likes, err := s.Catalog.IncrementLike(r.Context(), id)
	if err != nil {
		writeErr(w, http.StatusInternalServerError, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"likes": likes})
}

func (s *Server) handleStream(w http.ResponseWriter, r *http.Request) {
	driveID := chi.URLParam(r, "driveID")
	fileID := chi.URLParam(r, "fileID")
	s.Proxy.ServeStream(w, r, driveID, fileID)
}

func (s *Server) handlePreview(w http.ResponseWriter, r *http.Request) {
	videoID := chi.URLParam(r, "videoID")
	v, err := s.Catalog.GetVideo(r.Context(), videoID)
	if err != nil {
		http.NotFound(w, r)
		return
	}
	if v.PreviewStatus != "ready" {
		http.Error(w, "preview not ready", http.StatusNotFound)
		return
	}
	if v.PreviewFileID != "" {
		s.Proxy.ServeStream(w, r, v.DriveID, v.PreviewFileID)
		return
	}
	if v.PreviewLocal != "" {
		if !strings.HasPrefix(filepath.Clean(v.PreviewLocal), filepath.Clean(s.LocalDir)) {
			http.Error(w, "invalid local path", http.StatusForbidden)
			return
		}
		s.Proxy.ServeLocal(w, r, v.PreviewLocal)
		return
	}
	http.NotFound(w, r)
}

func (s *Server) handleThumb(w http.ResponseWriter, r *http.Request) {
	videoID := chi.URLParam(r, "videoID")
	// 直接读本地 thumbs 目录中 <videoID>.jpg
	path := filepath.Join(s.LocalDir, "thumbs", videoID+".jpg")
	clean := filepath.Clean(path)
	if !strings.HasPrefix(clean, filepath.Clean(s.LocalDir)) {
		http.Error(w, "invalid path", http.StatusForbidden)
		return
	}
	if _, err := os.Stat(clean); err != nil {
		http.NotFound(w, r)
		return
	}
	s.Proxy.ServeLocal(w, r, clean)
}

// ---------- helpers ----------

func mapVideo(v *catalog.Video) VideoDTO {
	badges := v.Badges
	if badges == nil {
		badges = []string{}
	}
	tags := v.Tags
	if tags == nil {
		tags = []string{}
	}
	return VideoDTO{
		ID:              v.ID,
		Href:            "/video/" + v.ID,
		Title:           v.Title,
		Thumbnail:       v.ThumbnailURL,
		PreviewSrc:      "/p/preview/" + v.ID,
		PreviewDuration: 10,
		PreviewStrategy: "teaser-file",
		Duration:        formatDuration(v.DurationSeconds),
		Badges:          badges,
		Quality:         v.Quality,
		Author:          v.Author,
		Views:           v.Views,
		Favorites:       v.Favorites,
		Comments:        v.Comments,
		Likes:           v.Likes,
		Dislikes:        v.Dislikes,
		PublishedAt:     v.PublishedAt.Format("2006-01-02"),
		Tags:            tags,
		Category:        v.Category,
	}
}

func mapVideos(vs []*catalog.Video) []VideoDTO {
	out := make([]VideoDTO, 0, len(vs))
	for _, v := range vs {
		out = append(out, mapVideo(v))
	}
	return out
}

func filterVideos(vs []VideoDTO, exclude string) []VideoDTO {
	out := make([]VideoDTO, 0, len(vs))
	for _, v := range vs {
		if v.ID != exclude {
			out = append(out, v)
		}
	}
	return out
}

func formatDuration(sec int) string {
	if sec <= 0 {
		return "00:00"
	}
	m := sec / 60
	s := sec % 60
	return fmt.Sprintf("%02d:%02d", m, s)
}

func writeJSON(w http.ResponseWriter, code int, body any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(code)
	_ = json.NewEncoder(w).Encode(body)
}

func writeErr(w http.ResponseWriter, code int, err error) {
	writeJSON(w, code, map[string]string{"error": err.Error()})
}
