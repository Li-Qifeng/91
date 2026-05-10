# 视频聚合站

把夸克 / 115 / 联通沃盘作为存储后端的视频聚合前台。按 `video-site-implementation-plan.md` 的设计实现。

- 前端：React 18 + Vite + TypeScript
- 后端：Go 1.23，SQLite（纯 Go 驱动，无 CGO），ffmpeg 生成 teaser 和封面
- 三家网盘接入：夸克自研 + 115driver SDK + wopan-sdk-go SDK

## 快速开始

### 环境要求

- Node.js 18+ 和 npm
- Go 1.23+
- ffmpeg 和 ffprobe（用于生成预览 teaser 和抽封面）

Windows 用户可以把 Go 和 ffmpeg 解压到 `%USERPROFILE%\tools\`，然后把 `\tools\go\bin` 和 `\tools\ffmpeg\bin` 加到 PATH 即可，不需要管理员权限。

### 运行

```bash
# 前端
npm install
npm run dev              # 监听 http://127.0.0.1:5173

# 后端（另开终端）
cd backend
go run ./cmd/server      # 监听 :8080，依赖已 vendor 入库，无需 go mod tidy
```

首次启动后端会自动生成：

- `backend/config.yaml`（从 `config.example.yaml` 复制）
- `backend/data/video-site.db`（SQLite）
- `backend/data/previews/`（teaser 和封面本地目录）

Vite dev server 已配置把 `/api`、`/p`、`/admin/api` 反代到 `:8080`。浏览器访问 `http://127.0.0.1:5173/` 进入前台，`/admin` 进入管理后台（默认 `admin` / `admin123`，请在 `config.yaml` 里改）。

## 目录

```
.
├─ src/                       React 前端
├─ backend/                   Go 后端（单体服务）
│  └─ vendor/                 Go 依赖全量源码，入库，支持完全离线构建
├─ vendor-refs/               可选的阅读资料，.gitignore 忽略
│  └─ OpenList-4.2.1/         OpenList 完整源码，网盘协议对接参考
├─ video-site-implementation-plan.md    完整的设计和实现记录
└─ README.md
```

### 依赖管理

所有 Go 依赖都已通过 `go mod vendor` 打包进 `backend/vendor/` 并入库。别人 clone 仓库后，**无需联网**，直接 `go run ./cmd/server` 就能编译运行。

升级依赖的流程：

```bash
cd backend
go get github.com/SheltonZhu/115driver@<新版本>
go mod tidy
go mod vendor        # 把新依赖同步到 vendor 目录
git add vendor/      # 入库
```

### `vendor-refs/` 要不要在意？

不需要。它只存 OpenList 源码作协议参考，删除或保留都不影响项目编译。

## 加一个网盘

1. 登录 `/admin` → 网盘管理 → 新建
2. 选类型（夸克 / 115 / 沃盘），填名称 + 凭证
3. 保存后会自动触发一次扫描
4. 在 `/admin/videos` 里看扫到了多少视频
5. 侧栏底部 **Teaser 生成** 开关开着，就会按配置给每个视频生成封面和 10 秒 teaser

三家盘的凭证字段：

| 类型 | 凭证字段 | 获取方式 |
|---|---|---|
| 夸克 | `cookie` | pan.quark.cn 登录后 F12 拷 Cookie |
| 115 | `cookie` | 115.com 登录后拷 Cookie（`UID=...; CID=...; SEID=...; KID=...`） |
| 沃盘 | `access_token`、`refresh_token`、可选 `family_id` | 第一版只能手动粘贴 token；后续会加扫码/短信登录 |

## Teaser 和封面生成策略

- 封面：根据视频时长从 20% 或 30% 位置抽一帧 jpg
- Teaser：3 段拼接（`20% / 50% / 80%` 位置各 3 秒，带 0.2s fade-in/out），总长约 9 秒，目标体积 500 KB - 1.5 MB
- 短视频 (< 30s) 自动降级为单段
- 首次失败的任务标 `preview_status = failed`，不再自动重试；管理后台可手动重生
- 详见 plan 15.12 节

## 部署到 Linux

```bash
# 本机交叉编译
cd backend
GOOS=linux GOARCH=amd64 go build -o video-server ./cmd/server

# 目标服务器
sudo apt install ffmpeg
scp video-server user@host:/opt/video-site/
# 配 systemd + nginx 反代到 /、/api、/p、/admin
```

完整部署方式见 plan 15.10 节。

## 贡献

任何代码改动请保持和 `video-site-implementation-plan.md` 同步；重要的设计决策追加到第 14 节（实现备注）或第 15 节（后端）。
