import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { SearchPanel } from "@/components/SearchPanel";
import { VideoPlayer } from "@/components/VideoPlayer";
import { VideoActions } from "@/components/VideoActions";
import { VideoInfoPanel } from "@/components/VideoInfoPanel";
import { CommentPanel } from "@/components/CommentPanel";
import { RecommendedRail } from "@/components/RecommendedRail";
import { fetchVideoDetail } from "@/data/videos";
import type { VideoDetail } from "@/types";

export default function VideoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [detail, setDetail] = useState<VideoDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const commentRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!id) return;
    let active = true;
    setLoading(true);
    fetchVideoDetail(id).then((d) => {
      if (!active) return;
      setDetail(d);
      setLoading(false);
      document.title = d ? `${d.title} · 视频聚合站` : "视频不存在";
    });
    return () => {
      active = false;
    };
  }, [id]);

  function jumpToComments() {
    commentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (loading) {
    return (
      <AppShell>
        <div className="container page-section">
          <div className="video-grid-loading">
            <div className="skeleton-card" />
            <div className="skeleton-card" />
            <div className="skeleton-card" />
            <div className="skeleton-card" />
          </div>
        </div>
      </AppShell>
    );
  }

  if (!detail) {
    return (
      <AppShell>
        <div className="container page-section">
          <div className="video-grid-empty">视频不存在或已被移除</div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="container page-section">
        <SearchPanel />
      </div>

      <div className="container">
        <div className="detail-layout">
          <div className="detail-main">
            <div className="detail-title-bar">{detail.title}</div>
            <VideoPlayer
              src={detail.videoSrc}
              poster={detail.poster}
              title={detail.title}
            />
            <VideoActions
              video={detail}
              onJumpToComments={jumpToComments}
            />
            <VideoInfoPanel video={detail} />
            <CommentPanel
              ref={commentRef}
              comments={detail.commentsList}
            />
          </div>
          <RecommendedRail videos={detail.relatedVideos} />
        </div>
      </div>

      <div style={{ height: 40 }} />
    </AppShell>
  );
}
