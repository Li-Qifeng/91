package drives

import (
	"context"
	"errors"
	"io"
	"net/http"
	"time"
)

// Drive 是三家网盘统一抽象。上层不区分盘，只区分 Kind。
type Drive interface {
	// Kind 返回驱动代号："quark" / "p115" / "wopan"
	Kind() string

	// ID 返回该盘在 catalog 中的唯一标识
	ID() string

	// Init 完成登录态校验；登录态由 Authenticator 另行获取后注入
	Init(ctx context.Context) error

	// List 列指定目录下的直接子项
	List(ctx context.Context, dirID string) ([]Entry, error)

	// Stat 拿到单个文件的元数据
	Stat(ctx context.Context, fileID string) (*Entry, error)

	// StreamURL 返回一次性直链 + 必须的请求头
	// 代理层据此回源，透传 Range
	StreamURL(ctx context.Context, fileID string) (*StreamLink, error)

	// Upload 把本地流写入指定目录，返回新文件 fileID
	// 用于 scanner 把 teaser 写回网盘
	Upload(ctx context.Context, parentID, name string, r io.Reader, size int64) (string, error)

	// EnsureDir 保证指定路径存在（相对根目录），返回最终目录 fileID
	// 例如传 "/previews" 会保证根下有一个 previews 目录
	EnsureDir(ctx context.Context, pathFromRoot string) (string, error)

	// RootID 返回根目录 fileID
	RootID() string
}

type Entry struct {
	ID       string
	Name     string
	Size     int64
	IsDir    bool
	ParentID string
	MimeType string
	ModTime  time.Time

	// 部分网盘额外信息
	Category int // 1=视频 (quark)
}

type StreamLink struct {
	URL     string
	Headers http.Header
	Expires time.Time
}

// ErrNotSupported 代表某家盘不支持某操作
var ErrNotSupported = errors.New("operation not supported by this drive")
