import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PromoStrip } from "@/components/PromoStrip";
import { SearchPanel } from "@/components/SearchPanel";
import { TagCloud } from "@/components/TagCloud";
import { SectionHeader } from "@/components/SectionHeader";
import { VideoGrid } from "@/components/VideoGrid";
import { fetchHomeVideos, fetchListing } from "@/data/videos";
import type { VideoItem } from "@/types";
import { RefreshCw } from "lucide-react";

const DESKTOP_COUNT = 12;
const MOBILE_COUNT = 8;
const CATEGORY_COUNT = 6;
const HOME_RECENT_KEY = "home.random.recentVideoIds";

const CATEGORY_MAP: { key: string; label: string }[] = [
  { key: "top", label: "本月Top" },
  { key: "hot", label: "本月最热" },
  { key: "ori", label: "91原创" },
  { key: "long", label: "10分钟以上" },
  { key: "longer", label: "20分钟以上" },
  { key: "tf", label: "收藏最多" },
  { key: "rf", label: "精华推荐" },
  { key: "hd", label: "高清" },
  { key: "md", label: "讨论最多" },
  { key: "mf", label: "最多关注" },
];
const HOME_RECENT_LIMIT = 72;

function useIsMobile() {
  const [mobile, setMobile] = useState(window.innerWidth <= 640);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const handler = () => setMobile(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return mobile;
}

// 模块级缓存：SPA 生命周期内保持，刷新页面时重置
let cachedRanking: VideoItem[] | null = null;
let cachedLatest: VideoItem[] | null = null;

function loadRecentHomeVideoIds(): string[] {
  try {
    const raw = window.localStorage.getItem(HOME_RECENT_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === "string" && id.length > 0)
      : [];
  } catch {
    return [];
  }
}

function rememberHomeVideos(items: VideoItem[]) {
  const merged = [...items.map((item) => item.id), ...loadRecentHomeVideoIds()];
  const seen = new Set<string>();
  const recent: string[] = [];
  for (const id of merged) {
    if (!id || seen.has(id)) continue;
    seen.add(id);
    recent.push(id);
    if (recent.length >= HOME_RECENT_LIMIT) break;
  }
  try {
    window.localStorage.setItem(HOME_RECENT_KEY, JSON.stringify(recent));
  } catch {
    // localStorage 不可用时只影响连续刷新去重，不影响首页展示。
  }
}

type CategorySection = {
  category: string;
  label: string;
  videos: VideoItem[];
  loading: boolean;
};

export default function HomePage() {
  const [rankingVideos, setRankingVideos] = useState<VideoItem[]>(cachedRanking ?? []);
  const [latestVideos, setLatestVideos] = useState<VideoItem[]>(cachedLatest ?? []);
  const [rankingLoading, setRankingLoading] = useState(cachedRanking === null);
  const [latestLoading, setLatestLoading] = useState(cachedLatest === null);
  const [categories, setCategories] = useState<CategorySection[]>([]);
  const isMobile = useIsMobile();

  useEffect(() => {
    document.title = "首页 · 91";

    let active = true;

    if (cachedRanking === null) {
      setRankingLoading(true);
      const excludeIds = loadRecentHomeVideoIds();
      fetchHomeVideos(excludeIds)
        .then((rankingItems) => {
          if (!active) return;
          rememberHomeVideos(rankingItems);
          cachedRanking = rankingItems;
          setRankingVideos(rankingItems);
        })
        .finally(() => {
          if (active) setRankingLoading(false);
        });
    }

    if (cachedLatest === null) {
      setLatestLoading(true);
      fetchListing(1, DESKTOP_COUNT, { sort: "latest", includeTotal: false })
        .then((latestResult) => {
          if (!active) return;
          cachedLatest = latestResult.items;
          setLatestVideos(latestResult.items);
        })
        .finally(() => {
          if (active) setLatestLoading(false);
        });
    }

    // 加载分类区块（固定 91porn 分类，逐个请求）
    const sections: CategorySection[] = CATEGORY_MAP.map((c) => ({
      category: c.key,
      label: c.label,
      videos: [],
      loading: true,
    }));
    setCategories(sections);

    // 逐个加载分类视频
    sections.forEach((sec, idx) => {
      fetchListing(1, CATEGORY_COUNT, { cat: sec.category, sort: "views", includeTotal: false })
        .then((res) => {
          if (!active) return;
          setCategories((prev) => {
            const next = [...prev];
            if (next[idx]) {
              next[idx] = { ...next[idx], videos: res.items, loading: false };
            }
            return next;
          });
        })
        .catch(() => {
          if (!active) return;
          setCategories((prev) => {
            const next = [...prev];
            if (next[idx]) {
              next[idx] = { ...next[idx], loading: false };
            }
            return next;
          });
        });
    });

    return () => { active = false; };
  }, []);

  const displayCount = isMobile ? MOBILE_COUNT : DESKTOP_COUNT;
  const ranking = rankingVideos.slice(0, displayCount);
  const latest = latestVideos.slice(0, displayCount);

  async function refreshRandom() {
    setRankingLoading(true);
    const excludeIds = loadRecentHomeVideoIds();
    try {
      let items = await fetchHomeVideos(excludeIds);
      if (!items.length) {
        window.localStorage.removeItem(HOME_RECENT_KEY);
        items = await fetchHomeVideos([]);
      }
      rememberHomeVideos(items);
      cachedRanking = items;
      setRankingVideos(items);
    } catch {
      // ignore
    } finally {
      setRankingLoading(false);
    }
  }

  return (
    <AppShell mobileAutoHideNav>
      <div className="container page-section">
        <PromoStrip />
        <SearchPanel />
        <TagCloud />
      </div>

      <div className="container page-section">
        <SectionHeader
          title="随机推荐"
          extra={
            <button
              className="admin-btn"
              onClick={refreshRandom}
              disabled={rankingLoading}
              style={{ fontSize: 12, padding: "4px 10px" }}
            >
              <RefreshCw size={13} /> 换一批
            </button>
          }
        />
        <VideoGrid
          videos={ranking}
          loading={rankingLoading}
          priorityCount={Math.min(4, displayCount)}
          skeletonCount={displayCount}
        />
      </div>

      <div className="container page-section">
        <SectionHeader title="最新视频" extra={latest.length > 0 ? `共 ${latest.length} 个` : undefined} />
        <VideoGrid videos={latest} loading={latestLoading} skeletonCount={displayCount} />
      </div>

      {categories.map((sec) => (
        <div key={sec.category} className="container page-section">
          <SectionHeader
            title={sec.label}
            extra={
              <a href={`/list?cat=${encodeURIComponent(sec.category)}`} style={{ fontSize: 12, color: "var(--accent)" }}>
                查看更多 →
              </a>
            }
          />
          <VideoGrid
            videos={sec.videos}
            loading={sec.loading}
            skeletonCount={CATEGORY_COUNT}
          />
        </div>
      ))}
    </AppShell>
  );
}
