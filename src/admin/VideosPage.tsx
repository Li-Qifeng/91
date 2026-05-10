import { useEffect, useState } from "react";
import { Edit, RefreshCw, Search } from "lucide-react";
import * as api from "./api";
import { useToast } from "./ToastContext";
import { Modal } from "./Modal";

export function VideosPage() {
  const [list, setList] = useState<api.AdminVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [editing, setEditing] = useState<api.AdminVideo | null>(null);
  const { show } = useToast();

  async function refresh() {
    setLoading(true);
    try {
      const r = await api.listVideos();
      setList(r.items ?? []);
    } catch (e) {
      show(e instanceof Error ? e.message : "加载失败", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const filtered = keyword.trim()
    ? list.filter((v) => {
        const k = keyword.toLowerCase();
        return (
          v.title.toLowerCase().includes(k) ||
          (v.author ?? "").toLowerCase().includes(k) ||
          v.id.toLowerCase().includes(k)
        );
      })
    : list;

  async function handleRegen(v: api.AdminVideo) {
    try {
      await api.regenPreview(v.id);
      show("已触发 teaser 重生", "success");
    } catch (e) {
      show(e instanceof Error ? e.message : "触发失败", "error");
    }
  }

  return (
    <section>
      <header className="admin-page__header">
        <h1 className="admin-page__title">视频管理</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
            }}
          >
            <Search
              size={14}
              style={{
                position: "absolute",
                left: 10,
                color: "#aaa",
              }}
            />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索标题 / 作者 / ID"
              style={{
                padding: "8px 10px 8px 30px",
                border: "1px solid var(--color-line)",
                borderRadius: 3,
                minWidth: 240,
              }}
            />
          </div>
          <button className="admin-btn" onClick={refresh}>
            <RefreshCw size={13} /> 刷新
          </button>
        </div>
      </header>

      {loading ? (
        <div className="admin-empty">加载中...</div>
      ) : filtered.length === 0 ? (
        <div className="admin-card admin-empty">
          还没有视频。先在「网盘管理」里配置好盘并触发扫描。
        </div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>标题</th>
              <th>作者</th>
              <th>标签</th>
              <th>时长</th>
              <th>Teaser</th>
              <th>来源</th>
              <th className="is-actions">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((v) => (
              <tr key={v.id}>
                <td>
                  <div style={{ fontWeight: 600 }}>{v.title}</div>
                  <div style={{ color: "#999", fontSize: 12, fontFamily: "ui-monospace" }}>
                    {v.id}
                  </div>
                </td>
                <td>{v.author || <span style={{ color: "#aaa" }}>—</span>}</td>
                <td>
                  <div className="admin-pills">
                    {(v.tags ?? []).map((t) => (
                      <span key={t} className="admin-pill">
                        {t}
                      </span>
                    ))}
                  </div>
                </td>
                <td>{formatDur(v.durationSeconds)}</td>
                <td>
                  <PreviewStatus s={v.previewStatus} />
                </td>
                <td style={{ fontFamily: "ui-monospace", fontSize: 12 }}>
                  {v.driveId}
                </td>
                <td className="is-actions">
                  <button className="admin-btn" onClick={() => setEditing(v)}>
                    <Edit size={13} /> 编辑
                  </button>{" "}
                  <button className="admin-btn" onClick={() => handleRegen(v)}>
                    <RefreshCw size={13} /> 重生 teaser
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {editing && (
        <EditVideoModal
          video={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            refresh();
          }}
        />
      )}
    </section>
  );
}

function PreviewStatus({ s }: { s: string }) {
  if (s === "ready") return <span className="admin-status is-ok">就绪</span>;
  if (s === "failed") return <span className="admin-status is-error">失败</span>;
  return <span className="admin-status is-pending">待生成</span>;
}

function formatDur(sec: number): string {
  if (!sec) return "—";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function EditVideoModal({
  video,
  onClose,
  onSaved,
}: {
  video: api.AdminVideo;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(video.title);
  const [author, setAuthor] = useState(video.author ?? "");
  const [tags, setTags] = useState((video.tags ?? []).join(", "));
  const [category, setCategory] = useState(video.category ?? "");
  const [badges, setBadges] = useState((video.badges ?? []).join(", "));
  const [description, setDescription] = useState(video.description ?? "");
  const [thumbnail, setThumbnail] = useState(video.thumbnailUrl ?? "");
  const [quality, setQuality] = useState(video.quality ?? "");
  const [durationSec, setDurationSec] = useState(String(video.durationSeconds || 0));
  const [saving, setSaving] = useState(false);
  const { show } = useToast();

  async function handleSave() {
    setSaving(true);
    try {
      await api.updateVideo(video.id, {
        title: title.trim(),
        author: author.trim(),
        tags: splitList(tags),
        category: category.trim(),
        badges: splitList(badges),
        description,
        thumbnail: thumbnail.trim(),
        quality: quality.trim(),
        durationSeconds: Number(durationSec) || 0,
      });
      show("已保存", "success");
      onSaved();
    } catch (e) {
      show(e instanceof Error ? e.message : "保存失败", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      title={`编辑视频 · ${video.title}`}
      onClose={onClose}
      footer={
        <>
          <button className="admin-btn" onClick={onClose}>
            取消
          </button>
          <button className="admin-btn is-primary" onClick={handleSave} disabled={saving}>
            {saving ? "保存中..." : "保存"}
          </button>
        </>
      }
    >
      <div className="admin-form">
        <div className="admin-form__row">
          <label>标题</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="admin-form__row">
          <label>作者</label>
          <input value={author} onChange={(e) => setAuthor(e.target.value)} />
        </div>
        <div className="admin-form__row">
          <label>标签（逗号分隔）</label>
          <input value={tags} onChange={(e) => setTags(e.target.value)} />
        </div>
        <div className="admin-form__row">
          <label>分类</label>
          <input value={category} onChange={(e) => setCategory(e.target.value)} />
        </div>
        <div className="admin-form__row">
          <label>徽标（逗号分隔，例如 精选, 原创）</label>
          <input value={badges} onChange={(e) => setBadges(e.target.value)} />
        </div>
        <div className="admin-form__row">
          <label>质量</label>
          <select value={quality} onChange={(e) => setQuality(e.target.value)}>
            <option value="">未设置</option>
            <option value="HD">HD</option>
            <option value="SD">SD</option>
          </select>
        </div>
        <div className="admin-form__row">
          <label>时长（秒）</label>
          <input
            value={durationSec}
            onChange={(e) => setDurationSec(e.target.value)}
            inputMode="numeric"
          />
        </div>
        <div className="admin-form__row">
          <label>封面 URL</label>
          <input value={thumbnail} onChange={(e) => setThumbnail(e.target.value)} />
        </div>
        <div className="admin-form__row">
          <label>描述</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <dl className="admin-kv" style={{ marginTop: 8 }}>
          <dt>视频 ID</dt>
          <dd style={{ fontFamily: "ui-monospace", fontSize: 12 }}>{video.id}</dd>
          <dt>来源盘</dt>
          <dd>{video.driveId}</dd>
          <dt>文件 ID</dt>
          <dd style={{ fontFamily: "ui-monospace", fontSize: 12 }}>{video.fileId}</dd>
          <dt>Teaser</dt>
          <dd>
            <PreviewStatus s={video.previewStatus} />
          </dd>
        </dl>
      </div>
    </Modal>
  );
}

function splitList(s: string): string[] {
  return s
    .split(/[,，、\s]+/)
    .map((x) => x.trim())
    .filter(Boolean);
}
