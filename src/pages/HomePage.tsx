import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PromoStrip } from "@/components/PromoStrip";
import { SearchPanel } from "@/components/SearchPanel";
import { TagCloud } from "@/components/TagCloud";
import { SectionHeader } from "@/components/SectionHeader";
import { VideoGrid } from "@/components/VideoGrid";
import { fetchHomeVideos } from "@/data/videos";
import type { VideoItem } from "@/types";

export default function HomePage() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "首页 · 视频聚合站";
    let active = true;
    setLoading(true);
    fetchHomeVideos().then((items) => {
      if (!active) return;
      setVideos(items);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <AppShell>
      <div className="container page-section">
        <PromoStrip />
        <SearchPanel />
        <TagCloud />
      </div>

      <div className="container page-section">
        <SectionHeader title="今日排行" extra={`精选 ${videos.length} 个作品`} />
        <VideoGrid videos={videos} loading={loading} skeletonCount={12} />
      </div>

      <div className="container page-section">
        <SectionHeader title="最新视频" />
        <VideoGrid
          videos={loading ? [] : videos.slice().reverse()}
          loading={loading}
          skeletonCount={12}
        />
      </div>
    </AppShell>
  );
}
