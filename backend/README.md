# backend

视频聚合站的 Go 后端。提供三件事：

1. 三家网盘统一抽象（夸克 / 115 / 联通沃盘）
2. 视频元数据目录（SQLite）+ 扫描 + teaser 预生成
3. REST API（前台）+ 管理后台 + 直链代理

## 目录

```
cmd/server/main.go          入口
internal/
  config/                   YAML 配置
  catalog/                  SQLite 元数据
  drives/
    iface.go                Drive 接口
    quark/                  夸克（自己实现，参考 OpenList quark_uc）
    p115/                   115（壳子 + SheltonZhu/115driver）
    wopan/                  联通沃盘（壳子 + OpenListTeam/wopan-sdk-go）
  scanner/                  扫目录 → 落库
  preview/                  ffmpeg 抽 10s teaser
  proxy/                    /p/stream/*、/p/preview/* 代理
  auth/                     管理员 session
  api/                      REST 路由
config.example.yaml         配置模板
```

## 开发环境（Windows）

本仓库假设工具都装在用户目录，不需要管理员权限。

```
C:\Users\<you>\tools\
  go\bin\go.exe             Go 1.23+
  ffmpeg\bin\ffmpeg.exe     任意 ≥ 4.x 版本
```

并加到 `PATH`。

### 第一次启动

```powershell
cd F:\VideoProject\backend
go mod tidy
go run ./cmd/server
```

首次启动会在当前目录创建：

- `config.yaml`（从 `config.example.yaml` 复制）
- `data/video-site.db`
- `data/previews/`

默认监听 `:8080`，默认管理员 `admin / admin123`（务必在 `config.yaml` 里改）。

### 连接前端

`vite.config.ts` 已经把 `/api`、`/p`、`/admin` 代理到 `8080`。

```
npm run dev         前端 5173
go run ./cmd/server 后端 8080
```

## 添加一个盘

1. 登录管理后台：`POST /admin/api/login` body `{"username":"admin","password":"admin123"}`
2. 新建盘：`POST /admin/api/drives`
   ```json
   {
     "id":   "my-quark",
     "kind": "quark",
     "name": "我的夸克盘",
     "rootId": "0",
     "scanRootId": "0",
     "credentials": {
       "cookie": "粘贴浏览器 F12 复制的 pan.quark.cn Cookie"
     }
   }
   ```
3. 手动触发扫描：`POST /admin/api/drives/my-quark/rescan`

三家盘的凭证字段：

| kind   | credentials 字段                                              |
|--------|---------------------------------------------------------------|
| quark  | `cookie`                                                      |
| p115   | `cookie`（形如 `UID=...; CID=...; SEID=...; KID=...`）         |
| wopan  | `access_token`、`refresh_token`，可选 `family_id`              |

## 文件名约定

扫描器按以下顺序解析文件名：

1. `[tag1,tag2] 标题 - 作者.mp4`
2. `[tag1,tag2] 标题.mp4`
3. `标题 - 作者.mp4`
4. `标题.mp4`

标签分隔符支持 `, ， 、` 和空格。解析结果可在管理后台覆盖。

## Teaser 生成

scanner 扫到新视频会把 `(driveID, videoID)` 丢进 worker 队列，调用：

```
ffmpeg -ss 10 -headers "UA/Cookie/Referer" -i <直链> \
       -t 10 -an -vf scale=480:-2 -c:v libx264 -preset veryfast -crf 28 \
       -movflags +faststart -y <local>.mp4
```

优先把 teaser 上传回网盘的 `previews/` 目录；失败时保留本地 `data/previews/<videoID>.mp4` 作为兜底。

前端卡片的 `previewSrc` 统一指向 `/p/preview/<videoID>`，后端自动选择网盘代理或本地文件。

## 部署到 Linux

```bash
# 交叉编译
GOOS=linux GOARCH=amd64 go build -o video-server ./cmd/server

# 目标机
sudo apt install ffmpeg
scp video-server user@host:/opt/video-site/
ssh user@host
cd /opt/video-site
cp config.example.yaml config.yaml
# 改密码、监听地址
./video-server
```

配 systemd + nginx 反代到 `/` 和 `/api`、`/p`、`/admin`。
