-- 视频元数据主表
CREATE TABLE IF NOT EXISTS videos (
    id               TEXT PRIMARY KEY,          -- <drive>-<fileID> 拼接的稳定 ID
    drive_id         TEXT NOT NULL,
    file_id          TEXT NOT NULL,
    parent_id        TEXT,
    title            TEXT NOT NULL,
    author           TEXT,
    tags             TEXT,                      -- JSON array
    duration_seconds INTEGER DEFAULT 0,
    size_bytes       INTEGER DEFAULT 0,
    ext              TEXT,
    quality          TEXT,                      -- HD / SD
    thumbnail_url    TEXT,
    preview_file_id  TEXT,                      -- 回写网盘后的 teaser file id
    preview_local    TEXT,                      -- 本地 teaser 路径（兜底）
    preview_status   TEXT DEFAULT 'pending',    -- pending / ready / failed
    views            INTEGER DEFAULT 0,
    favorites        INTEGER DEFAULT 0,
    comments         INTEGER DEFAULT 0,
    likes            INTEGER DEFAULT 0,
    dislikes         INTEGER DEFAULT 0,
    category         TEXT,
    badges           TEXT,                      -- JSON array
    description      TEXT,
    published_at     INTEGER NOT NULL,          -- unix ms
    created_at       INTEGER NOT NULL,
    updated_at       INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_videos_drive ON videos(drive_id, file_id);
CREATE INDEX IF NOT EXISTS idx_videos_pub   ON videos(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_videos_views ON videos(views DESC);

-- 网盘账户
CREATE TABLE IF NOT EXISTS drives (
    id            TEXT PRIMARY KEY,
    kind          TEXT NOT NULL,                -- quark / p115 / wopan
    name          TEXT NOT NULL,
    root_id       TEXT NOT NULL DEFAULT '0',
    scan_root_id  TEXT,                          -- 扫描起点（默认 root_id）
    credentials   TEXT,                          -- JSON: cookie / refresh_token 等
    status        TEXT DEFAULT 'disconnected',   -- disconnected / ok / error
    last_error    TEXT,
    created_at    INTEGER NOT NULL,
    updated_at    INTEGER NOT NULL
);

-- 扫描任务状态
CREATE TABLE IF NOT EXISTS scans (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    drive_id    TEXT NOT NULL,
    started_at  INTEGER NOT NULL,
    finished_at INTEGER,
    scanned     INTEGER DEFAULT 0,
    added       INTEGER DEFAULT 0,
    error       TEXT
);

-- 管理后台 session（简单 token 存储）
CREATE TABLE IF NOT EXISTS admin_sessions (
    token      TEXT PRIMARY KEY,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL
);

-- 全局 key-value 设置（preview 开关等）
CREATE TABLE IF NOT EXISTS settings (
    key        TEXT PRIMARY KEY,
    value      TEXT NOT NULL,
    updated_at INTEGER NOT NULL
);
