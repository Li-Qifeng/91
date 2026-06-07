import { useEffect, useState } from "react";
import { useToast } from "./ToastContext";
import * as api from "./api";
import { Globe, Save, Play } from "lucide-react";

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

export function Spider91Page() {
  const { show } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);

  const [category, setCategory] = useState("top");
  const [viewtype, setViewtype] = useState("basic");
  const [uaListStr, setUaListStr] = useState("");
  const [minPageDelay, setMinPageDelay] = useState(3);
  const [maxPageDelay, setMaxPageDelay] = useState(6);
  const [minDetailDelay, setMinDetailDelay] = useState(2);
  const [maxDetailDelay, setMaxDetailDelay] = useState(5);
  const [maxRetries, setMaxRetries] = useState(3);
  const [retryDelay, setRetryDelay] = useState(5);
  const [requestTimeout, setRequestTimeout] = useState(30);
  const [extractMeta, setExtractMeta] = useState(true);
  const [targetNew, setTargetNew] = useState(15);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const s = await api.getSettings();
      const cfg = s.spider91Config ?? {};
      if (cfg.category) setCategory(cfg.category);
      if (cfg.viewtype) setViewtype(cfg.viewtype);
      if (cfg.ua_list) setUaListStr((cfg.ua_list as string[]).join(", "));
      if (cfg.min_page_delay != null) setMinPageDelay(cfg.min_page_delay);
      if (cfg.max_page_delay != null) setMaxPageDelay(cfg.max_page_delay);
      if (cfg.min_detail_delay != null) setMinDetailDelay(cfg.min_detail_delay);
      if (cfg.max_detail_delay != null) setMaxDetailDelay(cfg.max_detail_delay);
      if (cfg.max_retries != null) setMaxRetries(cfg.max_retries);
      if (cfg.retry_delay != null) setRetryDelay(cfg.retry_delay);
      if (cfg.request_timeout != null) setRequestTimeout(cfg.request_timeout);
      if (cfg.extract_meta != null) setExtractMeta(cfg.extract_meta);
      if (s.spider91TargetNew > 0) setTargetNew(s.spider91TargetNew);
    } catch {
      show("加载设置失败", "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const uaList = uaListStr
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      const cfg: api.Spider91Config = {
        category: category || undefined,
        viewtype: viewtype || undefined,
        ua_list: uaList.length > 0 ? uaList : undefined,
        min_page_delay: minPageDelay,
        max_page_delay: maxPageDelay,
        min_detail_delay: minDetailDelay,
        max_detail_delay: maxDetailDelay,
        max_retries: maxRetries,
        retry_delay: retryDelay,
        request_timeout: requestTimeout,
        extract_meta: extractMeta,
      };
      await api.updateSettings({
        spider91Config: cfg,
        spider91TargetNew: targetNew,
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

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <h1 className="admin-page__title">
          <Globe size={20} /> 爬虫设置
        </h1>
      </div>

      <div className="admin-form" style={{ maxWidth: 720 }}>
        <div className="admin-form__row">
          <label className="admin-form__label">分类</label>
          <select
            className="admin-form__input"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
          <p className="admin-form__hint">选择要爬取的列表分类</p>
        </div>

        <div className="admin-form__row">
          <label className="admin-form__label">视图类型</label>
          <input
            className="admin-form__input"
            type="text"
            value={viewtype}
            onChange={(e) => setViewtype(e.target.value)}
          />
          <p className="admin-form__hint">目前仅支持 basic</p>
        </div>

        <div className="admin-form__row">
          <label className="admin-form__label">UA 轮换列表</label>
          <textarea
            className="admin-form__input"
            rows={3}
            value={uaListStr}
            onChange={(e) => setUaListStr(e.target.value)}
            placeholder="多个 User-Agent 用逗号分隔，留空则使用默认 UA"
          />
          <p className="admin-form__hint">每次请求随机选取一个 UA，降低被封概率</p>
        </div>

        <div className="admin-form__row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label className="admin-form__label">列表页最小延时 (秒)</label>
            <input
              className="admin-form__input"
              type="number"
              step={0.1}
              value={minPageDelay}
              onChange={(e) => setMinPageDelay(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="admin-form__label">列表页最大延时 (秒)</label>
            <input
              className="admin-form__input"
              type="number"
              step={0.1}
              value={maxPageDelay}
              onChange={(e) => setMaxPageDelay(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="admin-form__row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label className="admin-form__label">详情页最小延时 (秒)</label>
            <input
              className="admin-form__input"
              type="number"
              step={0.1}
              value={minDetailDelay}
              onChange={(e) => setMinDetailDelay(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="admin-form__label">详情页最大延时 (秒)</label>
            <input
              className="admin-form__input"
              type="number"
              step={0.1}
              value={maxDetailDelay}
              onChange={(e) => setMaxDetailDelay(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="admin-form__row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label className="admin-form__label">最大重试次数</label>
            <input
              className="admin-form__input"
              type="number"
              value={maxRetries}
              onChange={(e) => setMaxRetries(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="admin-form__label">重试基础延时 (秒)</label>
            <input
              className="admin-form__input"
              type="number"
              step={0.1}
              value={retryDelay}
              onChange={(e) => setRetryDelay(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="admin-form__row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label className="admin-form__label">请求超时 (秒)</label>
            <input
              className="admin-form__input"
              type="number"
              value={requestTimeout}
              onChange={(e) => setRequestTimeout(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="admin-form__label">目标新增视频数</label>
            <input
              className="admin-form__input"
              type="number"
              value={targetNew}
              onChange={(e) => setTargetNew(Number(e.target.value))}
            />
            <p className="admin-form__hint">每次爬虫任务的目标新增数</p>
          </div>
        </div>

        <div className="admin-form__row">
          <label className="admin-form__label" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              checked={extractMeta}
              onChange={(e) => setExtractMeta(e.target.checked)}
            />
            提取详情页元数据 (views / likes / dislikes / author / tags / duration / description)
          </label>
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
            disabled={running}
          >
            <Play size={14} /> {running ? "触发中" : "立即运行"}
          </button>
        </div>
      </div>
    </div>
  );
}
