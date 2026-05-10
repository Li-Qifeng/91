import { useEffect, useState } from "react";
import { Film } from "lucide-react";
import * as api from "./api";
import { useToast } from "./ToastContext";

// 预览生成开关。放在侧栏底部。
export function PreviewToggle() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const { show } = useToast();

  useEffect(() => {
    let active = true;
    api
      .getSettings()
      .then((s) => {
        if (active) setEnabled(s.previewEnabled);
      })
      .catch(() => {
        if (active) setEnabled(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function handleToggle() {
    if (enabled === null || saving) return;
    const next = !enabled;
    setSaving(true);
    // 乐观更新
    setEnabled(next);
    try {
      const resp = await api.updateSettings({ previewEnabled: next });
      setEnabled(resp.previewEnabled);
      show(
        next ? "已开启预览生成，正在补扫 pending" : "已关闭预览生成",
        "success"
      );
    } catch (e) {
      // 回滚
      setEnabled(!next);
      show(e instanceof Error ? e.message : "切换失败", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="preview-toggle">
      <div className="preview-toggle__head">
        <Film size={14} />
        <span className="preview-toggle__label">Teaser 生成</span>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled ?? false}
        className={`toggle-switch ${enabled ? "is-on" : ""} ${
          saving ? "is-saving" : ""
        }`}
        onClick={handleToggle}
        disabled={enabled === null || saving}
        title={enabled ? "点击关闭" : "点击开启"}
      >
        <span className="toggle-switch__dot" />
      </button>
    </div>
  );
}
