import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Link } from "react-router-dom";
import type { PreviewState, VideoItem } from "@/types";
import { previewController } from "@/lib/previewController";
import { useInViewport } from "@/lib/useInViewport";
import { formatCount } from "@/lib/format";
import { PreviewVideo } from "./PreviewVideo";

type Props = {
  video: VideoItem;
};

const HOVER_DELAY_MS = 300;

function useActivePreviewId(): string | null {
  return useSyncExternalStore(
    previewController.subscribe,
    previewController.getActiveId,
    () => null
  );
}

export function VideoCard({ video }: Props) {
  const [previewState, setPreviewState] = useState<PreviewState>("idle");
  const [shouldRenderPreview, setShouldRenderPreview] = useState(false);
  const [progress, setProgress] = useState(0); // 0~1

  const rootRef = useRef<HTMLElement | null>(null);
  const hoverTimerRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const activeId = useActivePreviewId();
  const inView = useInViewport(rootRef);

  // 当全局活跃卡片不是自己时，立刻停止预览
  useEffect(() => {
    if (activeId !== video.id && shouldRenderPreview) {
      cleanup();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, video.id]);

  // 离开视口时停止预览
  useEffect(() => {
    if (!inView && shouldRenderPreview) {
      cleanup();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView]);

  // 卸载时清理
  useEffect(() => {
    return () => cleanup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function cleanup() {
    if (hoverTimerRef.current) {
      window.clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }

    const el = videoRef.current;
    if (el) {
      try {
        el.pause();
        el.removeAttribute("src");
        el.load();
      } catch {
        // noop
      }
    }

    setShouldRenderPreview(false);
    setPreviewState("idle");
    setProgress(0);

    if (previewController.getActiveId() === video.id) {
      previewController.setActiveId(null);
    }
  }

  function startPreviewIntent() {
    if (!inView) return;
    setPreviewState("intent");

    hoverTimerRef.current = window.setTimeout(() => {
      // 抢占全局播放锁
      previewController.setActiveId(video.id);
      setShouldRenderPreview(true);
      setPreviewState("loading");
    }, HOVER_DELAY_MS);
  }

  function stopPreview() {
    cleanup();
  }

  // 移动端：首次点击卡片触发预览，浮层播放按钮跳转详情
  // 为了让 Link 正常跳转，我们不拦截移动端点击，移动端表现为直接跳转详情
  // 如需长按预览，后续可在此扩展

  return (
    <article
      ref={rootRef as React.RefObject<HTMLElement>}
      className="video-card"
      onPointerEnter={startPreviewIntent}
      onPointerLeave={stopPreview}
      onFocus={startPreviewIntent}
      onBlur={stopPreview}
    >
      <Link to={video.href} className="video-card__link" tabIndex={0}>
        <div className="thumb-frame">
          <img
            className="thumb-image"
            src={video.thumbnail}
            alt={video.title}
            loading="lazy"
          />

          {shouldRenderPreview && (
            <PreviewVideo
              ref={videoRef}
              src={video.previewSrc}
              state={previewState}
              onCanPlay={() => setPreviewState("playing")}
              onError={() => setPreviewState("error")}
              onTimeUpdate={(p) => setProgress(p)}
            />
          )}

          {previewState === "loading" && <span className="preview-loader" />}
          {previewState === "error" && (
            <span className="preview-error">预览加载失败</span>
          )}

          {/* 预览进度条（播放时显示在底部） */}
          {previewState === "playing" && (
            <div className="preview-progress" aria-hidden="true">
              <div
                className="preview-progress__bar"
                style={{ width: `${Math.min(100, progress * 100)}%` }}
              />
            </div>
          )}

          {/* hover 时右上角 "预览" 角标 */}
          {previewState === "playing" && (
            <span className="preview-tag" aria-hidden="true">
              预览
            </span>
          )}

          <div className="badge-row">
            {video.quality === "HD" && (
              <span className="video-badge is-hd">HD</span>
            )}
            {(video.badges ?? []).map((badge) => (
              <span className="video-badge" key={badge}>
                {badge}
              </span>
            ))}
          </div>

          <span className="duration">{video.duration}</span>
        </div>

        <h3 className="video-title" title={video.title}>
          {video.title}
        </h3>

        <div className="video-meta">
          <span className="video-meta__author">{video.author}</span>
          <span>{formatCount(video.views)} 观看</span>
          <span>{formatCount(video.favorites)} 收藏</span>
          <span>{formatCount(video.comments)} 评论</span>
          <span>{video.publishedAt}</span>
        </div>
      </Link>
    </article>
  );
}
