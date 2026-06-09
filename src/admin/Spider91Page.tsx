import { useEffect, useState } from "react";
import { useToast } from "./ToastContext";
import * as api from "./api";
import { Globe, Save, Play, Activity, Clock, CheckCircle, XCircle, Loader, ChevronUp, ChevronDown, ChevronRight, ChevronDown as ChevronDownIcon } from "lucide-react";

const CATEGORIES: { key: string; label: string }[] = [
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

function fmtDate(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("zh-CN");
}

export function Spider91Page() {
  const { show } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);

  // status
  const [status, setStatus] = useState<api.CrawlJobStatus | null>(null);
  const [history, setHistory] = useState<api.HistoryRecord[]>([]);

  const [categories, setCategories] = useState<string[]>(["top"]);
  const [targetNew, setTargetNew] = useState(15);
  const [cronHour, setCronHour] = useState(1);

  // 历史记录展开详情
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [detailMap, setDetailMap] = useState<Record<number, api.Spider91HistoryDetail>>({});
  const [detailLoading, setDetailLoading] = useState<number | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  // 轮询 spider91 状态
  useEffect(() => {
    let mounted = true;
    async function poll() {
      try {
        const res = await api.getSpider91Status();
        if (!mounted) return;
        setStatus(res.status);
        setHistory(res.history);
      } catch {
        // 静默忽略轮询失败
      }
    }
    poll();
    const id = setInterval(poll, 3000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  async function loadSettings() {
    try {
      const s = await api.getSettings();
      const cfg = s.spider91Config ?? {};
      const nextCategories = Array.isArray(cfg.categories)
        ? cfg.categories.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
        : [];
      if (nextCategories.length > 0) {
        setCategories(Array.from(new Set(nextCategories)));
      } else if (cfg.category) {
        setCategories([cfg.category]);
      }
      if (s.spider91TargetNew > 0) setTargetNew(s.spider91TargetNew);
      if (typeof s.nightlyCronHour === "number" && s.nightlyCronHour >= 0 && s.nightlyCronHour <= 23) {
        setCronHour(s.nightlyCronHour);
      }
    } catch {
      show("加载设置失败", "error");
    } finally {
      setLoading(false);
    }
  }

  function toggleCategory(key: string) {
    setCategories((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]
    );
  }

  function moveCategory(key: string, direction: -1 | 1) {
    setCategories((prev) => {
      const idx = prev.indexOf(key);
      const nextIdx = idx + direction;
      if (idx < 0 || nextIdx < 0 || nextIdx >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[nextIdx]] = [next[nextIdx], next[idx]];
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      const cfg: api.Spider91Config = {
        categories,
      };
      await api.updateSettings({
        spider91Config: cfg,
        spider91TargetNew: targetNew,
        nightlyCronHour: cronHour,
      });
      show("保存成功", "success");
    } catch {
      show("保存失败", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleRunNow() {
    setRunning(true);
    try {
      await api.runNightlyJob();
      show("已触发爬虫任务", "success");
    } catch {
      show("触发失败", "error");
    } finally {
      setRunning(false);
    }
  }

  async function toggleExpand(idx: number, outputJson?: string) {
    if (expandedIdx === idx) {
      setExpandedIdx(null);
      return;
    }
    setExpandedIdx(idx);
    if (!outputJson || detailMap[idx]) return;
    setDetailLoading(idx);
    try {
      const detail = await api.getSpider91HistoryDetail(outputJson);
      setDetailMap((prev) => ({ ...prev, [idx]: detail }));
    } catch {
      show("加载详情失败", "error");
    } finally {
      setDetailLoading(null);
    }
  }

  const state = status?.state ?? "idle";
  const isRunning = state === "running";

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-page__header">
          <h1 className="admin-page__title">
            <Globe size={20} /> 爬虫设置
          </h1>
        </div>
        <p style={{ color: "var(--muted-fg)" }}>加载中...</p>
      </div>
    );
  }

  // 按实际优先级顺序渲染：已选中的按 categories 数组顺序排前面，未选中的按原始顺序排后面
  const sortedCategories = [
    ...CATEGORIES.filter((c) => categories.includes(c.key)).sort(
      (a, b) => categories.indexOf(a.key) - categories.indexOf(b.key)
    ),
    ...CATEGORIES.filter((c) => !categories.includes(c.key)),
  ];

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <h1 className="admin-page__title">
          <Globe size={20} /> 爬虫设置
        </h1>
      </div>

      {/* 状态面板 */}
      <div style={{ maxWidth: 720, marginBottom: 24 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <div className="admin-card" style={{ padding: 16 }}>
            <div style={{ fontSize: 12, color: "var(--muted-fg)", marginBottom: 4 }}>
              当前状态
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 600 }}>
              {isRunning ? (
                <>
                  <Loader size={16} className="spin" style={{ animation: "spin 1s linear infinite" }} /> 运行中
                </>
              ) : state === "error" ? (
                <>
                  <XCircle size={16} color="#ef4444" /> 错误
                </>
              ) : state === "done" ? (
                <>
                  <CheckCircle size={16} color="#22c55e" /> 完成
                </>
              ) : (
                <>
                  <Activity size={16} color="var(--muted-fg)" /> 空闲
                </>
              )}
            </div>
          </div>

          <div className="admin-card" style={{ padding: 16 }}>
            <div style={{ fontSize: 12, color: "var(--muted-fg)", marginBottom: 4 }}>目标 / 进度</div>
            <div style={{ fontWeight: 600 }}>
              {status?.progress ?? 0} / {status?.targetNew ?? targetNew}
            </div>
          </div>

          <div className="admin-card" style={{ padding: 16 }}>
            <div style={{ fontSize: 12, color: "var(--muted-fg)", marginBottom: 4 }}>新增入库</div>
            <div style={{ fontWeight: 600, color: "#22c55e" }}>{status?.newVideos ?? 0}</div>
          </div>

          <div className="admin-card" style={{ padding: 16 }}>
            <div style={{ fontSize: 12, color: "var(--muted-fg)", marginBottom: 4 }}>跳过 / 失败</div>
            <div style={{ fontWeight: 600 }}>
              <span style={{ color: "#f59e0b" }}>{status?.skipped ?? 0}</span>
              {" / "}
              <span style={{ color: "#ef4444" }}>{status?.failed ?? 0}</span>
            </div>
          </div>
        </div>

        {isRunning && status && status.targetNew > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                height: 6,
                background: "var(--card-bg)",
                borderRadius: 3,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${Math.min(100, (status.progress / status.targetNew) * 100)}%`,
                  background: "linear-gradient(90deg, #f59e0b, #eab308)",
                  borderRadius: 3,
                  transition: "width 0.3s ease",
                }}
              />
            </div>
            <div style={{ fontSize: 12, color: "var(--muted-fg)", marginTop: 4 }}>
              开始于 {fmtDate(status.startedAt)}
            </div>
          </div>
        )}

        {state === "error" && status?.error && (
          <div
            style={{
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: 8,
              padding: 12,
              color: "#ef4444",
              fontSize: 13,
              marginBottom: 16,
            }}
          >
            {status.error}
          </div>
        )}
      </div>

      {/* 历史记录 */}
      {history.length > 0 && (
        <div style={{ maxWidth: 720, marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, marginBottom: 12 }}>
            <Clock size={16} style={{ verticalAlign: "-2px", marginRight: 6 }} />
            最近任务历史
          </h3>
          <div style={{ overflowX: "auto" }}>
            <table className="admin-table" style={{ minWidth: "100%", fontSize: 13 }}>
              <thead>
                <tr>
                  <th>状态</th>
                  <th>目标</th>
                  <th>进度</th>
                  <th>新增</th>
                  <th>跳过</th>
                  <th>失败</th>
                  <th>开始时间</th>
                  <th>结束时间</th>
                </tr>
              </thead>
              <tbody>
                {history.map((rec, idx) => (
                  <>
                    <tr
                      key={idx}
                      style={{ cursor: rec.outputJson ? "pointer" : "default" }}
                      onClick={() => rec.outputJson && toggleExpand(idx, rec.outputJson)}
                    >
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          {rec.outputJson && (
                            expandedIdx === idx ? (
                              <ChevronDownIcon size={14} color="var(--muted-fg)" />
                            ) : (
                              <ChevronRight size={14} color="var(--muted-fg)" />
                            )
                          )}
                          {rec.state === "done" ? (
                            <CheckCircle size={14} color="#22c55e" />
                          ) : rec.state === "error" ? (
                            <XCircle size={14} color="#ef4444" />
                          ) : (
                            <Activity size={14} color="var(--muted-fg)" />
                          )}
                        </div>
                      </td>
                      <td>{rec.targetNew}</td>
                      <td>{rec.progress}</td>
                      <td>{rec.newVideos}</td>
                      <td>{rec.skipped}</td>
                      <td>{rec.failed}</td>
                      <td>{fmtDate(rec.startedAt)}</td>
                      <td>{fmtDate(rec.finishedAt)}</td>
                    </tr>
                    {expandedIdx === idx && (
                      <tr>
                        <td colSpan={8} style={{ padding: 0, border: "none" }}>
                          <div
                            className="admin-card"
                            style={{
                              margin: "8px 12px 12px",
                              padding: 12,
                              fontSize: 12,
                            }}
                          >
                            {detailLoading === idx ? (
                              <div style={{ color: "var(--muted-fg)" }}>加载中...</div>
                            ) : detailMap[idx] ? (
                              <div>
                                <div style={{ fontWeight: 600, marginBottom: 8 }}>
                                  分类统计（共 {detailMap[idx].total} 条）
                                </div>
                                <div
                                  style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
                                    gap: "6px 12px",
                                  }}
                                >
                                  {Object.entries(detailMap[idx].categoryCounts).map(([cat, count]) => {
                                    const label = CATEGORIES.find((c) => c.key === cat)?.label || cat;
                                    return (
                                      <div key={cat} style={{ display: "flex", justifyContent: "space-between" }}>
                                        <span style={{ color: "var(--muted-fg)" }}>{label}</span>
                                        <span style={{ fontWeight: 600 }}>{count}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ) : (
                              <div style={{ color: "var(--muted-fg)" }}>暂无详情</div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="admin-form" style={{ maxWidth: 720 }}>
        <div className="admin-form__row">
          <label className="admin-form__label">分类优先级</label>
          <p className="admin-form__hint" style={{ marginTop: 0 }}>
            勾选要爬取的分类，并用上下按钮调整轮询顺序。运行时会按优先级逐类补抓，达到目标新增数后停止。
          </p>
          <div style={{ display: "grid", gap: 8 }}>
            {sortedCategories.map((c) => {
              const selected = categories.includes(c.key);
              const order = categories.indexOf(c.key);
              return (
                <div
                  key={c.key}
                  className="admin-card"
                  style={{
                    padding: 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    opacity: selected ? 1 : 0.55,
                  }}
                >
                  <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleCategory(c.key)}
                    />
                    <span style={{ fontWeight: 600 }}>{c.label}</span>
                    {selected && (
                      <span style={{ color: "var(--muted-fg)", fontSize: 12 }}>
                        #{order + 1}
                      </span>
                    )}
                  </label>
                  <div style={{ display: "flex", gap: 6 }}>
                    {selected && (
                      <>
                        <button
                          type="button"
                          className="admin-btn"
                          style={{ padding: "6px 8px" }}
                          disabled={order <= 0}
                          onClick={(e) => {
                            e.stopPropagation();
                            moveCategory(c.key, -1);
                          }}
                        >
                          <ChevronUp size={14} />
                        </button>
                        <button
                          type="button"
                          className="admin-btn"
                          style={{ padding: "6px 8px" }}
                          disabled={order >= categories.length - 1}
                          onClick={(e) => {
                            e.stopPropagation();
                            moveCategory(c.key, 1);
                          }}
                        >
                          <ChevronDown size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="admin-form__row">
          <label className="admin-form__label">目标新增视频数</label>
          <input
            className="admin-form__input"
            type="number"
            min={1}
            value={targetNew}
            onChange={(e) => setTargetNew(Number(e.target.value))}
          />
          <p className="admin-form__hint">每次爬虫任务按分类优先级累计补到该数量。</p>
        </div>

        <div className="admin-form__row">
          <label className="admin-form__label">定时触发时间</label>
          <input
            className="admin-form__input"
            type="number"
            min={0}
            max={23}
            value={cronHour}
            onChange={(e) => setCronHour(Math.max(0, Math.min(23, Number(e.target.value))))}
            style={{ width: 120 }}
          />
          <p className="admin-form__hint">每天几点自动触发爬虫（0–23，默认 1 即凌晨 01:00）。修改后保存立即生效，无需重启。</p>
        </div>

        <div className="admin-form__actions" style={{ display: "flex", gap: 12, marginTop: 24 }}>
          <button
            className="admin-btn is-primary"
            onClick={handleSave}
            disabled={saving}
          >
            <Save size={14} /> {saving ? "保存中" : "保存设置"}
          </button>
          <button
            className="admin-btn"
            onClick={handleRunNow}
            disabled={running || isRunning}
          >
            <Play size={14} /> {running ? "触发中" : isRunning ? "运行中..." : "立即运行"}
          </button>
        </div>
      </div>
    </div>
  );
}

