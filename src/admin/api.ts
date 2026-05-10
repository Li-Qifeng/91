// 管理后台 API 客户端
// 所有请求都带 cookie，401 会抛错让路由守卫跳登录
const BASE = "/admin/api";

export class UnauthorizedError extends Error {
  constructor() {
    super("unauthorized");
  }
}

async function request<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const res = await fetch(BASE + path, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    ...init,
  });
  if (res.status === 401) {
    throw new UnauthorizedError();
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    return (await res.json()) as T;
  }
  return (await res.text()) as unknown as T;
}

export function login(username: string, password: string) {
  return request<{ ok: boolean }>("/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export function logout() {
  return request<{ ok: boolean }>("/logout", { method: "POST" });
}

export function me() {
  return request<{ authenticated: boolean }>("/me");
}

// ---------- Drives ----------

export type AdminDrive = {
  id: string;
  kind: "quark" | "p115" | "wopan";
  name: string;
  rootId: string;
  scanRootId: string;
  status: string;
  lastError?: string;
  hasCredential: boolean;
};

export function listDrives() {
  return request<AdminDrive[]>("/drives");
}

export type UpsertDriveInput = {
  id: string;
  kind: "quark" | "p115" | "wopan";
  name: string;
  rootId: string;
  scanRootId: string;
  credentials: Record<string, string>;
};

export function upsertDrive(body: UpsertDriveInput) {
  return request<{ ok: boolean; warning?: string }>("/drives", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function deleteDrive(id: string) {
  return request<{ ok: boolean }>(`/drives/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export function rescan(id: string) {
  return request<{ ok: boolean }>(
    `/drives/${encodeURIComponent(id)}/rescan`,
    { method: "POST" }
  );
}

// ---------- Videos ----------

export type AdminVideo = {
  id: string;
  driveId: string;
  fileId: string;
  title: string;
  author: string;
  tags: string[];
  durationSeconds: number;
  size: number;
  ext: string;
  quality: string;
  thumbnailUrl: string;
  previewStatus: string;
  views: number;
  favorites: number;
  comments: number;
  likes: number;
  category: string;
  badges: string[];
  description: string;
  publishedAt: string;
  updatedAt: string;
};

export function listVideos() {
  return request<{ items: AdminVideo[]; total: number }>("/videos");
}

export type UpdateVideoInput = Partial<{
  title: string;
  author: string;
  tags: string[];
  category: string;
  badges: string[];
  description: string;
  thumbnail: string;
  quality: string;
  durationSeconds: number;
}>;

export function updateVideo(id: string, body: UpdateVideoInput) {
  return request<AdminVideo>(`/videos/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function regenPreview(id: string) {
  return request<{ ok: boolean }>(
    `/videos/${encodeURIComponent(id)}/regen-preview`,
    { method: "POST" }
  );
}

// ---------- Settings ----------

export type Settings = {
  previewEnabled: boolean;
};

export function getSettings() {
  return request<Settings>("/settings");
}

export function updateSettings(body: Settings) {
  return request<Settings>("/settings", {
    method: "PUT",
    body: JSON.stringify(body),
  });
}
