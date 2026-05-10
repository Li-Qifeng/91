# 视频聚合站首页实现方案

## 1. 项目目标

本项目目标是实现一个类似高密度视频聚合站的首页体验，重点借鉴其页面结构、视频浏览效率、搜索入口和鼠标悬停自动预览交互。

- 顶部工具条
- 主导航
- 二级用户导航
- 搜索框
- 热门标签
- 视频网格
- 鼠标悬停自动预览
- 分页和页脚

第一版优先完成首页，不做完整登录、上传、支付、会员、评论和后台管理。

## 2. 设计方向

整体风格建议保留原参考站的高密度媒体目录感，但升级成更现代、干净、合规的视频浏览平台。

视觉关键词：

- 高密度
- 直接
- 媒体站
- 暗色导航
- 橙黄色强调色
- 紧凑视频卡片
- 快速预览

推荐色彩：

```css
:root {
  --color-page: #f4f4f2;
  --color-topbar: #232323;
  --color-nav: #111111;
  --color-card: #151515;
  --color-card-border: #030303;
  --color-accent: #ff8800;
  --color-text: #202020;
  --color-text-invert: #ffffff;
  --color-muted: #8a8a8a;
  --color-line: #dddddd;
}
```

### 2.1 参考站细节取样

本轮取样覆盖了首页、列表页和详情页三类模板。只记录结构、样式和交互，不复用原站内容、素材和品牌。

关键观察：

- 首页是“导航 + 横幅 + 搜索 + 热门标签 + 今日内容”的入口页，当前页约 `24` 个视频卡片。
- 列表页是更纯粹的视频目录页，当前页约 `42` 个视频卡片，有分页、视图切换和更强的浏览密度。
- 详情页是“播放器主列 + 右侧推荐列”的结构，右侧推荐卡片也复用同一套 hover 预览能力。
- 视频卡片不是大卡片，而是紧凑信息块：封面、徽标、时长、单行标题、作者、观看量、收藏数、评论数、点赞/点踩。
- 视觉系统主要由深色导航、黑色卡片、橙色强调色、白色文字和灰色辅助信息组成。
- 自动预览是站内所有视频卡片的基础能力，不只是首页特效。
- 原站同时存在两种预览机制：独立 `mp4` teaser 预览，以及旧式多张缩略图轮播。
- 页面使用懒加载、返回顶部按钮、分页组件、Video.js 播放器和右侧推荐列。

## 3. 页面结构

页面从上到下分为以下区域。

### 3.1 顶部工具条

高度约 `30px`。

内容：

- 左侧语言切换
- 右侧注册
- 右侧登录

样式：

- 背景 `#232323`
- 字体 `12px`
- 链接默认灰色
- hover 变白
- 保持固定高度，不做复杂装饰

### 3.2 主导航栏

高度约 `56-64px`。

内容：

- 左侧 Logo
- 右侧主栏目
- 移动端汉堡菜单

推荐栏目：

- 上传
- 视频
- 频道
- 排行榜
- 会员
- 创作者

样式：

- 背景黑色或深灰
- 当前栏目使用浅色背景或橙色下划线
- 字体 `14-16px`
- 移动端折叠菜单

### 3.3 二级菜单

二级菜单放用户相关入口。

推荐入口：

- 我的视频
- 我的收藏
- 我关注的用户
- 我关注的视频
- 我的留言
- 历史记录

样式：

- 背景沿用深色
- 链接使用橙色
- hover 变白
- 横向排列
- 小屏横向滚动

### 3.4 横幅推荐区

参考站这里是广告位。实际实现时建议改成合规内容：

- 精选频道
- 推荐合集
- 今日专题
- 活动入口

布局：

- 桌面端 3-6 个横幅
- 移动端横向滑动
- 横幅高度控制在 `72-120px`

不要让横幅压过主体内容。它应该提供商业站/门户站的密度感，但不能成为页面主体。

### 3.5 搜索区

搜索区是用户进入内容的核心入口。

结构：

- 关键词输入框
- 搜索类型选择
- 搜索按钮
- 热门标签列表

搜索类型：

- 搜索视频
- 搜索用户
- 视频 ID
- 日期

交互：

- 输入关键词后点击搜索按钮
- 回车提交
- 热门标签点击后填入关键词并筛选

### 3.6 内容标题条

用于区分当前内容模块。

示例标题：

- 今日排行
- 最新视频
- 热门推荐
- 本周精选

样式：

- 橙色背景
- 白色文字
- 高度约 `40px`
- 字体 `16px`
- 可居中，也可左对齐

### 3.7 视频网格

这是首页主体。

推荐栅格：

- 宽屏：5 列
- 桌面：4 列
- 平板：3 列
- 手机：2 列
- 极窄屏：1 列

每页数量：

- 第一版建议 24 个视频卡片

参考站差异：

- 首页适合 `24` 个卡片，强调入口和热词。
- 列表页适合 `36-48` 个卡片，强调连续浏览。
- 详情页侧栏适合 `6-10` 个推荐卡片，强调回流。

### 3.8 列表页结构

列表页用于承载分类、排行、搜索结果和标签结果。

页面结构：

- 顶部工具条
- 主导航
- 二级分类菜单
- 横幅推荐区
- 搜索区
- 当前分类标题
- 视图/排序工具条
- 视频网格
- 分页
- 页脚

推荐工具条：

- 最新
- 最热
- 本周
- 最长
- 高清
- 精选
- 基础视图
- 详细视图

列表页和首页共用同一个 `VideoCard`，但可以允许更高密度布局。

### 3.9 详情页结构

详情页用于播放单个视频，并把用户导向推荐内容。

页面结构：

- 顶部工具条
- 主导航
- 二级分类菜单
- 搜索区
- 主内容双列布局
- 左侧播放器
- 左侧操作区
- 左侧视频信息区
- 左侧评论区
- 右侧推荐视频
- 页脚

左侧主列建议宽度：

- 桌面端占 `8/12`
- 移动端占 `100%`

右侧推荐列建议宽度：

- 桌面端占 `4/12`
- 移动端下沉到播放器下面

详情页组件：

- 播放器区域：封面、视频源、播放控件、广告/推荐插槽可选。
- 操作区：观看量、评论数、收藏数、点赞、点踩、收藏按钮。
- 信息区：发布时间、作者、描述、标签、分享/嵌入链接。
- 评论区：评论列表、分页、登录提示。
- 推荐列：复用 `VideoCard`，保留 hover 预览。

参考站详情页细节：

- 标题不是大号 hero，而是橙色横条标题，放在播放器上方。
- 播放器使用 `16:9` 容器，外层有轻微内边距，桌面端宽度占主列 `100%`。
- 播放器下方第一排是统计信息：时长、观看量、评论数、收藏数、积分/热度。
- 播放器下方第二排是操作按钮：点赞、点踩、收藏、写评论、下载提示、移除/举报入口。
- 统计值使用橙色强调，标签使用灰色或白色，信息排布很紧凑。
- 信息面板用橙色横条分区，包含发布时间、作者、作者状态、关注按钮、作者数据、描述。
- 描述区支持长文本折叠/展开，避免详情页被描述撑得过长。
- 嵌入链接使用只读 textarea，点击后可全选。
- 评论区是独立分区，有标题条、列表容器和分页加载。
- 右侧栏标题为推荐/热门视频，下面先是可选广告/推荐位，再是紧凑视频卡片列表。
- 右侧推荐卡片比首页更窄，元信息会换行显示，仍保留 hover 预览。

详情页布局建议：

```txt
VideoDetailPage
  AppShell
    SearchPanel
    DetailLayout
      MainColumn
        DetailTitleBar
        VideoPlayer
        VideoStats
        VideoActions
        VideoInfoPanel
        EmbedLinkBox
        CommentPanel
      SideColumn
        RecommendedRail
```

详情页桌面布局：

- 页面容器最大宽度 `1140-1200px`。
- 主列宽度 `66%` 左右。
- 侧栏宽度 `30-34%`。
- 主列和侧栏间距 `20-24px`。
- 播放器、信息面板、评论面板垂直堆叠。
- 侧栏卡片保持紧凑，不要做成大图瀑布流。

详情页移动布局：

- 主列和侧栏改为单列。
- 播放器固定 `16:9`，宽度 `100%`。
- 标题条允许两行，但不遮挡播放器。
- 统计信息改为两行或横向滚动。
- 操作按钮改为图标按钮网格。
- 推荐列下沉到评论区前或评论区后，第一版建议放在评论区前，提高回流。

详情页交互：

- 播放器支持播放、暂停、进度、音量、全屏。
- 点赞/点踩有选中态，第一版可以只做本地状态。
- 收藏按钮有未收藏、已收藏、需要登录三种状态。
- 写评论按钮滚动到评论区。
- 嵌入链接点击后自动选中。
- 推荐卡片 hover 后播放预览，离开后停止。

## 4. 视频卡片设计

### 4.1 数据结构

```ts
export type VideoItem = {
  id: string;
  href: string;
  title: string;
  thumbnail: string;
  previewSrc: string;
  previewDuration: number;
  previewStrategy: "teaser-file" | "sprite-frames";
  duration: string;
  badges: string[];
  quality?: "SD" | "HD";
  sourceLabel?: string;
  author: string;
  views: number;
  favorites?: number;
  comments?: number;
  likes?: number;
  dislikes?: number;
  publishedAt: string;
  rating?: number;
};

export type VideoDetail = VideoItem & {
  videoSrc: string;
  poster: string;
  description: string;
  embedUrl: string;
  points?: number;
  authorProfile: {
    id: string;
    name: string;
    href: string;
    badges: string[];
    signupAge?: string;
    level?: number;
    points?: number;
    videoCount?: number;
    followers?: number;
    following?: number;
    isFollowing?: boolean;
  };
  relatedVideos: VideoItem[];
  commentsList: CommentItem[];
};

export type CommentItem = {
  id: string;
  author: string;
  body: string;
  createdAt: string;
  likes?: number;
};
```

### 4.2 卡片组成

每张视频卡片包含：

- 封面图
- 自动预览视频层
- 左上角徽标，例如 `HD`、`原创`、`精选`
- 右下角时长
- 标题
- 作者
- 播放量
- 收藏数
- 评论数
- 发布时间
- 点赞率或收藏按钮

### 4.3 视觉规格

```css
.video-card {
  background: var(--color-card);
  border: 1px solid var(--color-card-border);
  border-radius: 4px;
  padding: 8px;
  color: var(--color-text-invert);
}

.thumb-frame {
  position: relative;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background: #000;
}

.video-title {
  display: block;
  margin-top: 6px;
  font-size: 15px;
  line-height: 1.35;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.video-meta {
  margin-top: 4px;
  font-size: 12px;
  color: var(--color-muted);
}
```

## 5. 自动预览实现

### 5.1 原理

参考站的自动预览逻辑是：

1. 视频封面容器上有 `playvthumb_视频ID` 形式的 id。
2. 鼠标移入时从 id 中解析视频 ID。
3. 动态创建 `<video>`。
4. 将预览视频覆盖到封面图上。
5. 视频可以播放后淡入。
6. 鼠标移出后删除 `<video>` 和加载条。

补充说明：

- 参考站前端不是根据完整视频时长实时裁剪预览片段。
- 它在 hover 时直接请求一条独立的预览资源：`https://vthumb.killcovid2021.com/thumb/{videoId}.mp4`。
- 已抽查多个预览文件，时长均为固定 `10 秒`。
- 前端代码里没有“从第几秒开始截取”的参数，所以更像是后端预先生成好的 teaser clip。
- 仅从前端代码无法百分百确认这 `10 秒` 对应完整视频的开头、中段还是后台挑选片段。

我们实现时不建议照搬原脚本，而是用 React 状态和更稳的资源管理来做。

### 5.2 预览资源生成策略

推荐采用“独立 teaser 文件”的方式，而不是 hover 时裁剪完整视频。

资源规则：

- 每个视频生成一个独立预览文件。
- 预览文件命名为 `{videoId}.mp4` 或 `{videoId}.webm`。
- 默认预览时长 `10 秒`。
- 预览文件体积目标 `300KB-1.5MB`。
- 卡片数据只存 `previewSrc`，前端不关心它来自视频哪一段。

生成策略：

- 短视频：可以取开头后 `1-2 秒` 开始的 `10 秒`，避免黑屏和片头。
- 中长视频：可以取 `20%-35%` 位置附近的 `10 秒`。
- 很长视频：可以从多个候选片段中选画面变化较大的 `10 秒`。
- 如果后端还没有智能选段能力，第一版统一取 `min(2s, duration * 0.1)` 作为起点即可。

后端产物：

```txt
/media/videos/{videoId}.mp4
/media/thumbs/{videoId}.jpg
/media/previews/{videoId}.mp4
```

前端播放：

- hover 时只加载 `/media/previews/{videoId}.mp4`。
- 不直接加载完整视频。
- 不依赖完整视频的 `currentTime`。

### 5.3 状态设计

```ts
type PreviewState = "idle" | "intent" | "loading" | "playing" | "error";
```

状态含义：

- `idle`：默认状态，只显示封面
- `intent`：鼠标刚进入，等待 hover 延迟
- `loading`：开始加载预览视频
- `playing`：预览视频已经播放
- `error`：预览加载失败

### 5.4 交互规则

鼠标端：

- `pointerenter` 后等待 `300ms`
- 如果鼠标仍在卡片上，创建视频
- 视频 `canplay` 后淡入
- `pointerleave` 后立即停止并清理

键盘端：

- 卡片获得焦点时可以触发预览
- 卡片失焦时停止预览

移动端：

- 不使用 hover
- 点击封面后开始预览
- 再次点击或滑出视口时停止

### 5.5 React 组件伪代码

```tsx
import { useEffect, useRef, useState } from "react";

type VideoItem = {
  id: string;
  href: string;
  title: string;
  thumbnail: string;
  previewSrc: string;
  previewDuration: number;
  previewStrategy: "teaser-file" | "sprite-frames";
  duration: string;
  badges: string[];
  quality?: "SD" | "HD";
  sourceLabel?: string;
  author: string;
  views: number;
  favorites?: number;
  comments?: number;
  likes?: number;
  dislikes?: number;
  publishedAt: string;
  rating?: number;
};

type PreviewState = "idle" | "intent" | "loading" | "playing" | "error";

export function VideoCard({ video }: { video: VideoItem }) {
  const [previewState, setPreviewState] = useState<PreviewState>("idle");
  const [shouldRenderPreview, setShouldRenderPreview] = useState(false);
  const hoverTimerRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  function startPreviewIntent() {
    setPreviewState("intent");

    hoverTimerRef.current = window.setTimeout(() => {
      setShouldRenderPreview(true);
      setPreviewState("loading");
    }, 300);
  }

  function stopPreview() {
    if (hoverTimerRef.current) {
      window.clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }

    const videoEl = videoRef.current;

    if (videoEl) {
      videoEl.pause();
      videoEl.removeAttribute("src");
      videoEl.load();
    }

    setShouldRenderPreview(false);
    setPreviewState("idle");
  }

  useEffect(() => {
    return () => {
      stopPreview();
    };
  }, []);

  return (
    <article
      className="video-card"
      tabIndex={0}
      onPointerEnter={startPreviewIntent}
      onPointerLeave={stopPreview}
      onFocus={startPreviewIntent}
      onBlur={stopPreview}
    >
      <div className="thumb-frame">
        <img
          className="thumb-image"
          src={video.thumbnail}
          alt=""
          loading="lazy"
        />

        {shouldRenderPreview && (
          <video
            ref={videoRef}
            className={`preview-video ${
              previewState === "playing" ? "is-visible" : ""
            }`}
            src={video.previewSrc}
            muted
            autoPlay
            loop
            playsInline
            preload="metadata"
            onCanPlay={() => setPreviewState("playing")}
            onError={() => setPreviewState("error")}
          />
        )}

        {previewState === "loading" && <span className="preview-loader" />}

        <span className="duration">{video.duration}</span>

        <div className="badge-row">
          {video.badges.map((badge) => (
            <span className="video-badge" key={badge}>
              {badge}
            </span>
          ))}
        </div>
      </div>

      <h3 className="video-title">{video.title}</h3>

      <div className="video-meta">
        <span>{video.author}</span>
        <span>{video.views.toLocaleString()} 次观看</span>
        {typeof video.favorites === "number" && (
          <span>{video.favorites.toLocaleString()} 收藏</span>
        )}
        {typeof video.comments === "number" && (
          <span>{video.comments.toLocaleString()} 评论</span>
        )}
        <span>{video.publishedAt}</span>
      </div>
    </article>
  );
}
```

### 5.6 自动预览 CSS

```css
.thumb-image,
.preview-video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumb-image {
  z-index: 1;
}

.preview-video {
  z-index: 2;
  opacity: 0;
  transition: opacity 180ms ease;
}

.preview-video.is-visible {
  opacity: 1;
}

.duration {
  position: absolute;
  right: 6px;
  bottom: 6px;
  z-index: 3;
  padding: 2px 5px;
  border-radius: 3px;
  background: rgba(0, 0, 0, 0.72);
  color: #fff;
  font-size: 12px;
  line-height: 1.2;
}

.badge-row {
  position: absolute;
  top: 6px;
  left: 6px;
  z-index: 3;
  display: flex;
  gap: 4px;
}

.video-badge {
  padding: 2px 5px;
  border-radius: 3px;
  background: var(--color-accent);
  color: #000;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.2;
}

.preview-loader {
  position: absolute;
  left: 0;
  bottom: 0;
  z-index: 4;
  height: 3px;
  background: var(--color-accent);
  animation: preview-progress 1.8s ease forwards;
}

@keyframes preview-progress {
  from {
    width: 0;
  }

  to {
    width: 100%;
  }
}
```

## 6. 性能策略

自动预览最容易造成性能问题，必须控制资源。

### 6.1 加载策略

- 默认只加载封面图。
- 预览视频不要提前加载完整文件。
- hover 后再设置或渲染 `video`。
- 使用 `preload="metadata"`。
- 如果我们自己生成预览片段，建议控制在 `8-10s`，默认对齐为 `10 秒`，这样更接近参考站的体感。
- 视频体积尽量控制在 `300KB-1.5MB`。

### 6.2 播放数量控制

建议在全局维护一个当前播放项：

```ts
type PreviewController = {
  activeVideoId: string | null;
  setActiveVideoId: (id: string | null) => void;
};
```

规则：

- 同一时间只允许一个卡片播放预览。
- 新卡片开始预览时，通知旧卡片停止。
- 快速移动鼠标时不重复创建多个视频。

### 6.3 视口控制

使用 `IntersectionObserver`：

- 卡片进入视口附近才允许预览。
- 离开视口后停止播放。
- 不在视口附近的卡片不挂载预览视频。

### 6.4 清理规则

鼠标离开时：

```ts
video.pause();
video.removeAttribute("src");
video.load();
```

然后再卸载 video 节点。

这样可以让浏览器释放网络和解码资源。

## 7. 响应式布局

```css
.video-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

@media (min-width: 1440px) {
  .video-grid {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
}

@media (max-width: 1024px) {
  .video-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .video-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .video-card {
    padding: 6px;
  }

  .video-title {
    font-size: 13px;
  }

  .video-meta span:nth-child(n + 2) {
    display: none;
  }
}

@media (max-width: 380px) {
  .video-grid {
    grid-template-columns: 1fr;
  }
}
```

## 8. 技术栈

推荐使用：

- React
- Vite
- TypeScript
- CSS Modules 或普通 CSS
- lucide-react
- 本地 mock 数据

第一版可以不接真实后端，但数据模型要按真实接口设计，避免后续接入时重写组件。

建议前端先模拟三类页面：

- 首页：热词、今日排行、24 个视频卡片。
- 列表页：分类/搜索结果、排序工具条、36-48 个视频卡片。
- 详情页：播放器壳、操作区、信息区、评论占位、右侧推荐列。

## 9. 推荐目录结构

```txt
src/
  pages/
    HomePage.tsx
    ListingPage.tsx
    VideoDetailPage.tsx
  components/
    AppShell.tsx
    TopBar.tsx
    MainNav.tsx
    SubNav.tsx
    PromoStrip.tsx
    SearchPanel.tsx
    TagCloud.tsx
    SectionHeader.tsx
    SortToolbar.tsx
    VideoGrid.tsx
    VideoCard.tsx
    PreviewVideo.tsx
    VideoPlayer.tsx
    VideoActions.tsx
    VideoInfoPanel.tsx
    RecommendedRail.tsx
    CommentPanel.tsx
    Pagination.tsx
    BackToTop.tsx
    Footer.tsx
  data/
    videos.ts
    tags.ts
    categories.ts
  styles/
    tokens.css
    base.css
    layout.css
    navigation.css
    search.css
    video-card.css
    video-detail.css
  App.tsx
  main.tsx
```

## 10. 组件职责

### AppShell

负责页面整体布局。

包含：

- TopBar
- MainNav
- SubNav
- 主内容区域
- Footer

### SearchPanel

负责搜索表单状态。

功能：

- 输入关键词
- 选择搜索类型
- 点击搜索
- 回车搜索

第一版可以只在本地过滤 mock 数据。

### TagCloud

负责热门标签。

功能：

- 展示标签
- 点击标签后触发搜索或过滤
- 移动端横向滚动

### VideoGrid

负责接收视频数组并渲染卡片。

功能：

- 响应式网格
- 空状态
- 加载状态
- 首页、列表页、详情页侧栏都复用

### VideoCard

负责单个视频卡片。

功能：

- 展示封面、标题、元信息
- hover 自动预览
- 资源清理
- 键盘 focus 预览
- 移动端点击预览
- 元信息紧凑展示
- 徽标、时长、质量标签叠加

### ListingPage

负责分类页、排行页、搜索结果页。

功能：

- 读取当前分类或搜索参数
- 展示排序工具条
- 展示高密度视频网格
- 管理分页状态

### VideoDetailPage

负责视频详情页。

功能：

- 组织 `8/4` 双列布局
- 展示橙色标题条
- 展示 `16:9` 播放器壳
- 展示视频统计和操作按钮
- 展示作者、描述、嵌入链接等视频信息
- 展示评论占位和分页容器
- 展示右侧推荐列
- 移动端改为单列布局

### VideoPlayer

负责详情页播放器区域。

功能：

- 保持 `16:9` 容器比例
- 展示 poster
- 支持本地 mock 播放源
- 保留播放、暂停、进度、音量、全屏控件
- 预留前贴片或推荐插槽，但第一版不接广告

### VideoActions

负责详情页播放器下方的统计和动作区。

功能：

- 展示时长、观看量、评论数、收藏数、热度/积分
- 展示点赞和点踩按钮
- 展示收藏按钮
- 展示写评论按钮
- 展示下载/权限提示
- 第一版只做本地状态，不发真实请求

### VideoInfoPanel

负责视频信息区。

功能：

- 展示发布时间
- 展示作者和作者徽标
- 展示关注按钮
- 展示作者数据
- 展示描述折叠/展开
- 展示嵌入链接只读文本框

### RecommendedRail

负责详情页右侧推荐列。

功能：

- 展示推荐列标题
- 展示可选推荐横幅位
- 复用紧凑版 `VideoCard`
- 桌面端作为右侧栏
- 移动端下沉到主内容下方

### PreviewVideo

负责 hover 预览的底层播放节点。

功能：

- 只在需要时挂载 `<video>`
- `canplay` 后通知卡片切换状态
- 离开时暂停、清空 `src` 并卸载
- 支持统一的全局播放锁

## 11. 第一版功能范围

第一版完成：

- 首页 UI
- 列表页 UI
- 详情页静态骨架
- 顶部工具条
- 主导航
- 二级菜单
- 横幅推荐区
- 搜索框
- 热门标签
- 内容模块标题
- 视频网格
- 视频卡片
- hover 自动预览
- 排序工具条
- 分页样式
- 播放器外壳
- 视频详情标题条
- 视频统计和操作区
- 视频信息面板
- 嵌入链接框
- 评论占位区
- 详情页右侧推荐列
- 返回顶部按钮
- 移动端适配

第一版暂不做：

- 真实登录
- 真实注册
- 真实上传
- 会员支付
- 评论
- 私信
- 后台管理
- 真实视频播放鉴权
- 真实评论提交
- 真实接口

## 12. 后续扩展

第二阶段：

- 真实播放器接入
- 详情页真实数据
- 评论区真实分页
- 收藏功能
- 点赞/点踩接口

第三阶段：

- 接入真实 API
- 用户系统
- 上传流程
- 搜索分页
- 标签页

第四阶段：

- 播放历史
- 个性化推荐
- 创作者主页
- 性能监控
- 图片和视频 CDN 优化

## 13. 验收标准

页面验收：

- 首屏能看到导航、搜索和视频内容。
- 桌面端视频网格至少 4 列。
- 列表页能显示高密度目录、排序工具条和分页。
- 详情页能显示播放器壳、操作区、信息区和右侧推荐列。
- 详情页播放器保持 `16:9`，不会因标题、统计或广告位导致布局跳动。
- 详情页标题条、信息面板标题、评论标题使用一致的橙色分区样式。
- 详情页统计区能展示时长、观看量、评论数、收藏数和热度/积分。
- 详情页操作区有点赞、点踩、收藏、写评论等可点击状态。
- 详情页作者信息、描述折叠、嵌入链接和评论占位都能在移动端正常堆叠。
- 详情页右侧推荐列在桌面端保留 hover 预览，在移动端下沉显示。
- 视频卡片标题单行省略，不撑破布局。
- 鼠标悬停卡片后可以自动播放静音预览。
- 鼠标移开后预览停止并释放资源。
- 移动端布局不溢出。
- 搜索和标签有可见交互反馈。
- 页面没有成人内容依赖，使用合规占位素材。

性能验收：

- 默认不加载所有预览视频。
- hover 才加载当前卡片预览。
- 同一时间不播放多个预览视频。
- 快速划过多个卡片不会堆积 video 节点。
- 页面滚动保持流畅。

## 14. 实现备注

本节记录第一版代码实现时相对本 plan 的偏离点和补充决定，作为后续迭代的参考。所有条目都列出了当前实现、偏离原因和回归 plan 的方法。

### 14.1 偏离 plan 的实现决定

#### 14.1.1 移动端预览交互改为直接跳转详情

- plan 5.4 节写：移动端点击封面开始预览，再次点击停止或滑出视口停止。
- 当前实现：移动端不走 hover 预览，点击卡片直接跳转详情页。
- 原因：真实设备上"先预览再跳转"容易误判，用户习惯点一下就进详情。单击预览还会让卡片产生两种点击语义，交互学习成本高。
- 代码位置：`src/components/VideoCard.tsx` 使用 `onPointerEnter` 触发 hover，触屏设备不会稳定触发，自然回退为纯跳转。
- 回归方法：在 `VideoCard` 的点击处理里检测 `pointerType === 'touch'`，首次点击 `preventDefault` 并启动预览，浮层加"播放"按钮跳转。

#### 14.1.2 详情页移动端推荐列放在评论之后

- plan 3.9 节写：移动端建议把推荐列放在评论区前，提高回流。
- 当前实现：推荐列在 CSS grid 第二列，移动端单列堆叠时自然出现在评论后。
- 原因：当前使用 `grid-template-columns: 2fr 1fr` 的简单布局，DOM 顺序即视觉顺序。移到评论前需要用 `order` 重排或拆分 DOM。
- 代码位置：`src/pages/VideoDetailPage.tsx`，`src/styles/video-detail.css` 中 `.detail-layout` 的媒体查询。
- 回归方法：移动端断点下给 `.detail-side { order: -1 }`，或按窗口宽度在 JSX 里改子元素顺序。

#### 14.1.3 卡片边框色调亮

- plan 2 节写：`--color-card-border: #030303`。
- 当前实现：`--color-card-border: #2a2a2a`。
- 原因：`#030303` 和卡片背景 `#151515` 对比度太低，边框几乎不可见，卡片之间缺少分界。
- 代码位置：`src/styles/tokens.css`。
- 回归方法：改回 `#030303`，或者把边框换成更明显的阴影。

### 14.2 plan 未覆盖、实现时补充的决定

#### 14.2.1 引入 React Router

- plan 8 节技术栈未提路由。
- 当前实现：`react-router-dom` v6，`BrowserRouter` 包在 `main.tsx`。
- 路由表：
  - `/` → `HomePage`
  - `/list` → `ListingPage`（查询参数 `q` / `tag` / `cat`）
  - `/video/:id` → `VideoDetailPage`
- 代码位置：`src/App.tsx`、`src/main.tsx`。

#### 14.2.2 全局预览锁用模块级 store + useSyncExternalStore

- plan 6.2 节只给了 `PreviewController` 类型，未指定实现。
- 当前实现：模块级 singleton，`subscribe` 订阅，`useSyncExternalStore` 接入 React。
- 原因：Context 放 `activeVideoId` 会触发全树重渲染；模块级 store 只让新旧两张 active 卡片重渲染。
- 代码位置：`src/lib/previewController.ts`。

#### 14.2.3 IntersectionObserver 全局共享实例

- plan 6.3 节只说"使用 IntersectionObserver"，未指定粒度。
- 当前实现：单例 observer + `WeakMap` 映射 element 到回调。`rootMargin: '200px 0px'` 让靠近视口的卡片也允许挂载预览。
- 原因：列表页 24-48 张卡片各自 `new IntersectionObserver` 是重复开销。
- 代码位置：`src/lib/useInViewport.ts`。

#### 14.2.4 嵌入代码增加"复制"按钮

- plan 详情页说明写：只读 textarea，点击可全选。
- 当前实现：textarea 仍保留点击全选，同时加了"复制"按钮，用 `navigator.clipboard.writeText` 并以 `document.execCommand('copy')` 作为 fallback。复制后 1.6 秒内按钮文案切换为"已复制"。
- 原因：现代 UI 习惯是一键复制，textarea 点击全选再 `Ctrl+C` 的操作链条偏长。
- 代码位置：`src/components/VideoInfoPanel.tsx`。

#### 14.2.5 数据层用 Promise 模拟异步

- plan 8 节只说"本地 mock 数据"，未定义同步或异步。
- 当前实现：`src/data/videos.ts` 同时导出同步版（`getHomeVideos` 等）和异步版（`fetchHomeVideos` 等，带 120ms `setTimeout`）。页面实际使用异步版。
- 原因：接真实 API 时只需替换 `fetchXxx` 实现，组件的 `useEffect + setLoading` 模式不用改。

#### 14.2.6 Loading / Empty 状态规格

- plan 10 节 `VideoGrid` 职责提到空状态和加载状态，未给具体样式。
- 当前实现：
  - Loading 用 `.skeleton-card` 骨架屏，灰色 shimmer 动画。`skeletonCount` 默认 8，首页/列表页传 12。
  - Empty 用 `.video-grid-empty` 居中文字，文本通过 `emptyText` prop 覆盖。
  - Error 第一版仅覆盖预览失败，用 `.preview-error` 覆盖层显示"预览加载失败"。
- 代码位置：`src/components/VideoGrid.tsx`、`src/styles/video-card.css`。

#### 14.2.7 分页组件展示规则

- plan 未定义分页展示规则。
- 当前实现：总页数 ≤ 7 全显示；> 7 显示 `1 ... 当前-1 当前 当前+1 ... 末页`。每页 `PAGE_SIZE = 24`，和首页卡片数对齐。
- 代码位置：`src/components/Pagination.tsx`、`src/pages/ListingPage.tsx`。

#### 14.2.8 详情页双列用 CSS Grid

- plan 说主列占 `8/12`，侧栏占 `4/12`，但未定 CSS 实现。
- 当前实现：`grid-template-columns: 2fr 1fr`（≈ `67/33`），容器最大宽度 `1200px`，和 plan 数字对齐。移动端断点 `900px` 切单列。
- 代码位置：`src/styles/video-detail.css`。

#### 14.2.9 扩充了 CSS token 集合

- plan 2 节只定义了颜色 token。
- 当前实现补充了：
  - 间距：`--space-1` 到 `--space-8`
  - 圆角：`--radius-sm` / `--radius-md` / `--radius-lg`
  - 容器：`--container-max: 1200px`
  - 阴影：`--shadow-card` / `--shadow-elevated`
  - 颜色：`--color-muted-light` / `--color-accent-dark` / `--color-danger` / `--color-section`
- 代码位置：`src/styles/tokens.css`。
- 原因：实现复杂布局需要统一的间距和圆角尺度。

### 14.3 mock 数据的临时代用

以下内容仅在 mock 阶段成立，接真实后端时需要一并替换。

#### 14.3.1 预览视频复用完整视频

- plan 5.2 节强调预览应为独立的 10 秒 teaser 文件。
- 当前 mock：`previewSrc === videoSrc`，都指向 Google 公开演示视频（`commondatastorage.googleapis.com/gtv-videos-bucket`）。
- 影响：只影响 mock 数据，组件按"只加载预览 URL"工作，后端生成好独立 teaser 后，只改 `data/videos.ts` 中 `previewSrc` 即可。

#### 14.3.2 "今日排行"和"最新视频"使用同一批数据

- 当前 mock：首页两个 section 用同一个 24 条数组，第二个 section 做了 `slice().reverse()`。
- 替换方案：真实接口会是两个 endpoint，换 `fetchXxx` 即可。

#### 14.3.3 封面图用 picsum.photos

- 当前 mock：`thumbnail: https://picsum.photos/seed/{seed}/480/270`，每个视频一张基于 seed 的稳定图片。
- 特点：和视频内容无关，但 seed 稳定不会每次刷新变。接真实 CDN 时一起替换。

### 14.4 待拍板的开放决定

影响度由高到低：

1. 详情页移动端推荐列位置（目前评论后，plan 要求评论前）。
2. 移动端单击预览行为（目前直接跳转，plan 要求先预览再跳转）。
3. 嵌入框复制按钮（目前保留，可回退为纯 textarea 全选）。
4. 卡片边框色（目前 `#2a2a2a`，可回退为 plan 原值 `#030303`）。

任何一项都可以在小改动内回归 plan 原设计，等统一确认后再动。

## 15. 后端集成方案（网盘驱动 + 元数据 + 预览生成）

本节记录接入真实网盘后端的架构和关键决策。

### 15.1 架构

```
VideoProject/
├─ src/                        React 前端
├─ backend/                    Go 单体服务
│  ├─ cmd/server/main.go
│  ├─ internal/
│  │  ├─ drives/               Drive 接口 + 三家实现
│  │  │  ├─ iface.go           List / Stat / StreamURL / RefreshAuth
│  │  │  ├─ quark/             自己实现（参考 OpenList quark_uc）
│  │  │  ├─ p115/              壳 + SheltonZhu/115driver
│  │  │  └─ wopan/             壳 + OpenListTeam/wopan-sdk-go
│  │  ├─ catalog/              SQLite + VideoItem 增删改查
│  │  ├─ scanner/              扫目录 → 落库 + 异步抽 teaser
│  │  ├─ preview/              ffmpeg 抽 10s teaser
│  │  ├─ proxy/                /p/<drive>/<id> 代理下载，注入 UA/Referer/Cookie
│  │  ├─ auth/                 管理后台鉴权
│  │  └─ api/                  REST 路由
│  ├─ admin/                   管理后台静态页（登录、盘管理、视频录入）
│  ├─ config.yaml
│  └─ go.mod
├─ 115driver-1.3.2/            SDK 本地镜像（go.mod replace 引用）
└─ wopan-sdk-go-0.2.0/         SDK 本地镜像（go.mod replace 引用）
```

### 15.2 技术选型

- **后端语言**：Go 1.23。一个二进制、交叉编译到 Linux 简单。
- **数据库**：SQLite（`modernc.org/sqlite` 纯 Go 驱动，无需 CGO，便于交叉编译）。
- **HTTP 框架**：标准库 `net/http` + `gorilla/mux` 或 `chi`。
- **SDK**：
  - 夸克：移植 OpenList `drivers/quark_uc` 的 HTTP 逻辑（纯 Cookie + resty）。
  - 115：`github.com/SheltonZhu/115driver`，通过 `replace` 指令指向 `../115driver-1.3.2`。
  - 沃盘：`github.com/OpenListTeam/wopan-sdk-go`，`replace` 指向 `../wopan-sdk-go-0.2.0`。
- **视频处理**：ffmpeg / ffprobe，作为外部子进程调用。
- **部署**：本地 Windows 开发，最终部署到 Linux 服务器（二进制 + systemd + nginx 反代）。

### 15.3 关键决策（已拍板）

| 项 | 决定 |
|---|---|
| 登录方式 | **B**：管理后台做完整登录流程。115 扫码、夸克扫码或 Cookie 导入、沃盘手机号 + 短信验证。Token 持久化到 SQLite 并自动刷新。 |
| 元数据来源 | **默认文件名解析**：`标题.mp4` 或 `[tag1,tag2] 标题 - 作者.mp4`；同时提供后台录入 API 覆盖字段 |
| Hover teaser | **C 预生成**：scanner 发现新视频时异步生成 10s teaser 并存回网盘的 `previews/` 目录，详情页和列表页 hover 都秒开 |
| 部署目标 | Linux 服务器；本地 Windows 开发 |
| 扫描策略 | 启动时全量 + 每 6 小时增量 + 支持手动触发 |

### 15.4 Drive 接口

```go
// internal/drives/iface.go
type Drive interface {
    Name() string                     // "quark" / "p115" / "wopan"
    Init(ctx context.Context) error

    List(ctx context.Context, dirID string) ([]Entry, error)
    Stat(ctx context.Context, fileID string) (*Entry, error)

    // 返回一次性直链 + 必要的请求头。proxy 层据此回源。
    StreamURL(ctx context.Context, fileID string) (*StreamLink, error)

    // 上传用于 scanner 写回 teaser 文件
    Upload(ctx context.Context, parentID, name string, r io.Reader, size int64) (string, error)
}

type Entry struct {
    ID       string
    Name     string
    Size     int64
    IsDir    bool
    ParentID string
    MimeType string
    ModTime  time.Time
}

type StreamLink struct {
    URL     string
    Headers http.Header   // UA/Referer/Cookie
    Expires time.Time
}
```

三家实现都收敛到这套接口，上层不区分盘。

### 15.5 文件名解析规则

默认解析顺序（取第一个匹配）：

1. 完整格式：`[tag1,tag2] 标题 - 作者.ext`
2. 去作者：`[tag1,tag2] 标题.ext`
3. 去标签：`标题 - 作者.ext`
4. 最简单：`标题.ext`

解析出的字段：`title` / `author` / `tags[]`。其余字段（`duration` / `views` / `favorites` 等）由 scanner 读取文件元数据或置默认值。

后台录入接口可用来覆盖解析结果：

```
POST /admin/api/videos/:id     # 更新元数据
PUT  /admin/api/videos         # 新建视频（跳过扫描）
```

### 15.6 Teaser 生成流程

scanner 每次发现新视频（catalog 里没有的 fileID）时：

1. 向对应 Drive 要一次性直链 `StreamURL`
2. 启动 ffmpeg 子进程：
   ```
   ffmpeg -ss 10 -i "<直链>" -t 10 -an -vf "scale=480:-2" -c:v libx264 -preset veryfast -crf 28 -movflags +faststart -y <tmp>.mp4
   ```
   - `-ss 10`：跳过片头
   - `-t 10`：固定 10 秒
   - `-an`：去音轨
   - `scale=480:-2`：目标宽 480，缩减体积到 300KB-1.5MB
   - `-movflags +faststart`：让 moov atom 在文件头部，支持边下边播
3. ffmpeg 需要带上 Drive 提供的 UA/Referer/Cookie（用 `-headers` 参数传递）
4. teaser 上传到网盘 `/previews/<fileID>.mp4`
5. catalog 记录 `preview_file_id`，详情页/卡片返回 `previewSrc` 指向 `/p/<drive>/<previewFileID>`

失败重试 3 次，间隔指数退避。失败的记录标记 `preview_status = failed`，不再自动重试，需要后台手动重扫。

### 15.7 直链代理

网盘直链不能直接喂给 `<video>`：

- 夸克：校验 `User-Agent` 为 `quark-cloud-drive`
- 115：IP + UA 绑定 + 30 分钟过期
- 沃盘：有效期短

代理路由：

```
GET /p/<drive>/<fileID>
```

backend 做的事：

1. 通过 `fileID` 查 catalog，确认授权（管理后台的视频才能被代理）
2. 向 Drive 要一次性 `StreamURL`（带缓存，30 秒 TTL，避免高频 hover 打爆网盘 API）
3. 反向代理到真实直链，透传 `Range` 请求头
4. 设置合理的响应头：`Accept-Ranges: bytes`、`Content-Type`、`Cache-Control: private, max-age=300`

### 15.8 REST API

前台（无需鉴权）：

```
GET  /api/home                     # 首页视频
GET  /api/list?q=&tag=&cat=&sort=&page=&size=
GET  /api/video/:id                # 详情 + relatedVideos
GET  /api/tags                     # 热门标签
```

管理后台（需 Cookie/Token 鉴权）：

```
POST /admin/api/login              # 管理员账号密码
POST /admin/api/logout

POST /admin/api/drives             # 新建盘
GET  /admin/api/drives
POST /admin/api/drives/:id/login   # 触发登录流程
GET  /admin/api/drives/:id/login/status
POST /admin/api/drives/:id/rescan

GET  /admin/api/videos
POST /admin/api/videos             # 手动新建
PUT  /admin/api/videos/:id         # 修改元数据
DELETE /admin/api/videos/:id
POST /admin/api/videos/:id/regen-preview
```

登录流程三家各不相同：

- **115 扫码**：`POST /admin/api/drives/:id/login` 返回二维码图片；前端轮询 `.../login/status` 直到成功
- **夸克**：最稳是让用户在电脑浏览器登录 pan.quark.cn 后 F12 复制 Cookie，后台粘贴保存。可选：实现扫码登录（OpenList 社区有方案）
- **沃盘**：手机号 → 后端请求短信 → 前端填验证码 → 登录

### 15.9 前端改动

仅改 `src/data/videos.ts`：把 `fetchXxx` 实现换成 `fetch('/api/...')`，保持签名不变。组件代码一行不改。

Vite dev server 加 proxy：

```ts
// vite.config.ts
server: {
  port: 5173,
  proxy: {
    '/api': 'http://localhost:8080',
    '/p':   'http://localhost:8080',
    '/admin': 'http://localhost:8080',
  },
}
```

生产部署用 nginx 把 `/`、`/api`、`/p`、`/admin` 都反代到 backend 或前端 dist 目录。

### 15.10 部署

Linux 服务器：

1. `go build -o video-server ./cmd/server` 交叉编译
2. 上传到服务器 `/opt/video-site/`
3. ffmpeg：`apt install ffmpeg`
4. systemd 单元：
   ```
   [Service]
   WorkingDirectory=/opt/video-site
   ExecStart=/opt/video-site/video-server
   Restart=always
   ```
5. nginx 反代 + 静态文件服务

本地开发同时跑：
- `npm run dev`（前端 5173）
- `go run ./backend/cmd/server`（后端 8080）

### 15.11 风险和待确认

- **三家协议变动风险**：协议是逆向出来的，网盘方改就得跟着改。SDK 社区更新到了就 `go get` 新版本。
- **网盘风控**：扫描频率太高、直链请求太密集可能被封。scanner 默认 QPS 限制 + 单次扫描目录数量上限。
- **teaser 回写可能需要网盘有"写权限"**：某些只读分享场景下需要把 teaser 存到本地文件系统而非回网盘。第一版先用"回网盘"，如遇权限问题降级到本地 `data/previews/`。

### 15.12 Teaser 生成策略（已落地）

Teaser 不再是"固定从第 10 秒抽 10 秒"，改为按视频时长分段挑起点 + 三段拼接：

- **段数**：`Config.Segments`，默认 3。视频 `< 30s` 自动降级为单段。
- **每段时长**：`DurationSeconds / Segments`，下限 2 秒，默认 9 / 3 = 3 秒。
- **起点策略** `pickSegmentStarts(duration, n, eachSec)`：
  - `duration < 30s` → 单段，起点 `max(2, duration*0.1)`
  - `30s ≤ duration < 10min` → 在 `[5%, 85%]` 区间均匀分布 N 段
  - `duration ≥ 10min` → 在 `[20%, 80%]` 区间均匀分布 N 段
- **拼接**：每段 `scale=480:-2` 缩放，`fade-in 0.2s` + `fade-out 0.2s`，`concat` 滤镜合成单个 mp4，`libx264 crf 28 preset veryfast`，体积 500 KB - 1.5 MB。

封面独立于 teaser：
- `pickThumbnailOffset(duration)`：
  - `duration < 60s` → `duration * 0.3`
  - `duration ≥ 60s` → `clamp(duration * 0.2, 5, 120)` 秒
- 抽帧单独走 `ffmpeg -frames:v 1`，和 teaser 起点解耦。
- 输出 `data/previews/thumbs/<videoID>.jpg`，前端走 `/p/thumb/<videoID>` 路由。

前端展示（`VideoCard.tsx`）：
- 播放中底部显示橙色进度条，随 `<video>.currentTime / duration` 同步。
- 右上角"预览"角标 `.preview-tag`，与"HD/徽标"区分。
- 离开卡片时进度归零。

代码位置：
- `backend/internal/preview/ffmpeg.go` `pickSegmentStarts` / `pickThumbnailOffset` / `Generate` / `GenerateThumbnail`
- `backend/internal/config/config.go` `Preview.Segments` / `FFprobePath`
- `src/components/PreviewVideo.tsx` `onTimeUpdate`
- `src/components/VideoCard.tsx` progress state + DOM
- `src/styles/video-card.css` `.preview-progress` / `.preview-tag`

取舍说明：
- 第一段不选 `duration*0.1` 之前的起点，避免片头黑屏/logo。
- 最后一段末端留 1 秒余量，避免切到文件尾部导致 ffmpeg 读越界。
- 单段 fallback 原因：拼接滤镜对 < 30s 视频性价比低，直接整段取一次性 25% 位置。
- 选段未使用场景检测（`ffmpeg scdet`）：单次扫描 3000+ 视频时成本过高，留给后续 C3 按需开关。
