import type { VideoDetail, VideoItem } from "@/types";

// 真实后端接口调用。未配置网盘时，各接口返回空数据。
export function fetchHomeVideos(): Promise<VideoItem[]> {
  return apiGet<VideoItem[]>("/api/home").catch(() => []);
}

export function fetchListing(
  page: number,
  pageSize: number,
  params?: { q?: string; tag?: string; cat?: string; sort?: string }
): Promise<{ items: VideoItem[]; total: number }> {
  const qs = new URLSearchParams({
    page: String(page),
    size: String(pageSize),
  });
  if (params?.q) qs.set("q", params.q);
  if (params?.tag) qs.set("tag", params.tag);
  if (params?.cat) qs.set("cat", params.cat);
  if (params?.sort) qs.set("sort", params.sort);
  return apiGet<{ items: VideoItem[]; total: number }>(
    `/api/list?${qs.toString()}`
  ).catch(() => ({ items: [], total: 0 }));
}

export function fetchVideoDetail(id: string): Promise<VideoDetail | null> {
  return apiGet<VideoDetail>(`/api/video/${encodeURIComponent(id)}`).catch(
    () => null
  );
}

export type TagItem = { id: string; label: string; count?: number };

export function fetchTags(): Promise<TagItem[]> {
  return apiGet<TagItem[]>("/api/tags").catch(() => []);
}

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(path, { credentials: "include" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
