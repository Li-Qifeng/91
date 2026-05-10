import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { PromoStrip } from "@/components/PromoStrip";
import { SearchPanel } from "@/components/SearchPanel";
import { TagCloud } from "@/components/TagCloud";
import { SectionHeader } from "@/components/SectionHeader";
import { SortToolbar, type ViewMode } from "@/components/SortToolbar";
import { VideoGrid } from "@/components/VideoGrid";
import { Pagination } from "@/components/Pagination";
import { fetchListing } from "@/data/videos";
import type { SortKey, VideoItem } from "@/types";

const PAGE_SIZE = 24;

export default function ListingPage() {
  const [params] = useSearchParams();
  const keyword = params.get("q") ?? "";
  const tag = params.get("tag") ?? "";
  const cat = params.get("cat") ?? "";

  const [sort, setSort] = useState<SortKey>("latest");
  const [view, setView] = useState<ViewMode>("grid");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<VideoItem[]>([]);
  const [total, setTotal] = useState(0);

  // 筛选条件变更时回到第一页
  useEffect(() => {
    setPage(1);
  }, [keyword, tag, cat, sort]);

  useEffect(() => {
    document.title = keyword
      ? `搜索 "${keyword}" · 视频聚合站`
      : tag
      ? `标签 ${tag} · 视频聚合站`
      : cat
      ? `分类 ${cat} · 视频聚合站`
      : "视频列表 · 视频聚合站";

    let active = true;
    setLoading(true);
    fetchListing(page, PAGE_SIZE, { q: keyword, tag, cat, sort }).then((r) => {
      if (!active) return;
      setItems(r.items ?? []);
      setTotal(r.total ?? 0);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [keyword, tag, cat, sort, page]);

  const title = keyword
    ? `搜索结果：${keyword}`
    : tag
    ? `标签：${tag}`
    : cat && cat !== "all"
    ? `分类：${cat}`
    : "全部视频";

  return (
    <AppShell>
      <div className="container page-section">
        <PromoStrip />
        <SearchPanel />
        <TagCloud />
      </div>

      <div className="container page-section">
        <SectionHeader title={title} extra={`共 ${total} 个视频`} />
        <SortToolbar
          sort={sort}
          view={view}
          onSortChange={setSort}
          onViewChange={setView}
        />
        <VideoGrid
          videos={items}
          loading={loading}
          compact={view === "compact"}
          skeletonCount={12}
          emptyText="没有找到匹配的视频"
        />
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          onChange={(p) => {
            setPage(p);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      </div>
    </AppShell>
  );
}
