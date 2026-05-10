import { useState } from "react";
import {
  Bookmark,
  Download,
  Flag,
  MessageSquare,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import type { VideoDetail } from "@/types";
import { formatCount } from "@/lib/format";

type Props = {
  video: VideoDetail;
  onJumpToComments: () => void;
};

export function VideoActions({ video, onJumpToComments }: Props) {
  const [likes, setLikes] = useState(video.likes ?? 0);
  const [dislikes, setDislikes] = useState(video.dislikes ?? 0);
  const [bursting, setBursting] = useState(false);
  const [favorited, setFavorited] = useState(false);

  async function handleLike() {
    // 乐观 +1，立即给个视觉反馈
    setLikes((n) => n + 1);
    setBursting(true);
    window.setTimeout(() => setBursting(false), 240);

    try {
      const res = await fetch(
        `/api/video/${encodeURIComponent(video.id)}/like`,
        { method: "POST", credentials: "include" }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { likes: number };
      if (typeof data.likes === "number") {
        // 用服务端真实值对齐（并发点击时更准确）
        setLikes(data.likes);
      }
    } catch {
      // 回滚 +1
      setLikes((n) => Math.max(0, n - 1));
    }
  }

  return (
    <>
      <div className="video-stats">
        <span className="video-stats__item">
          <span className="video-stats__label">时长</span>
          <span className="video-stats__value">{video.duration}</span>
        </span>
        <span className="video-stats__item">
          <span className="video-stats__label">观看</span>
          <span className="video-stats__value">{formatCount(video.views)}</span>
        </span>
        <span className="video-stats__item">
          <span className="video-stats__label">评论</span>
          <span className="video-stats__value">
            {formatCount(video.comments)}
          </span>
        </span>
        <span className="video-stats__item">
          <span className="video-stats__label">收藏</span>
          <span className="video-stats__value">
            {formatCount(video.favorites)}
          </span>
        </span>
        <span className="video-stats__item">
          <span className="video-stats__label">点赞</span>
          <span className="video-stats__value">{formatCount(likes)}</span>
        </span>
      </div>

      <div className="video-actions">
        <button
          className={`video-actions__btn video-actions__like ${
            bursting ? "is-bursting" : ""
          }`}
          onClick={handleLike}
          aria-label="点赞"
        >
          <ThumbsUp size={14} />
          点赞 · {formatCount(likes)}
        </button>
        <button
          className="video-actions__btn is-danger"
          onClick={() => setDislikes((n) => n + 1)}
          aria-label="点踩"
        >
          <ThumbsDown size={14} />
          点踩 · {formatCount(dislikes)}
        </button>
        <button
          className={`video-actions__btn ${favorited ? "is-active" : ""}`}
          onClick={() => setFavorited((v) => !v)}
          aria-pressed={favorited}
        >
          <Bookmark size={14} />
          {favorited ? "已收藏" : "收藏"}
        </button>
        <button className="video-actions__btn" onClick={onJumpToComments}>
          <MessageSquare size={14} />
          写评论
        </button>
        <button className="video-actions__btn" title="登录后可下载">
          <Download size={14} />
          下载
        </button>
        <button className="video-actions__btn" title="举报">
          <Flag size={14} />
          举报
        </button>
      </div>
    </>
  );
}
