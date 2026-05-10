import type { VideoItem } from "@/types";
import { VideoGrid } from "./VideoGrid";

type Props = {
  videos: VideoItem[];
};

export function RecommendedRail({ videos }: Props) {
  return (
    <aside className="detail-side" aria-label="推荐视频">
      <div className="detail-side__header">推荐视频</div>
      <VideoGrid videos={videos} compact />
    </aside>
  );
}
