import { useRef, useState } from "react";
import { Copy } from "lucide-react";
import type { VideoDetail } from "@/types";
import { formatCount } from "@/lib/format";

type Props = {
  video: VideoDetail;
};

export function VideoInfoPanel({ video }: Props) {
  const [collapsed, setCollapsed] = useState(true);
  const [copied, setCopied] = useState(false);
  const [following, setFollowing] = useState(
    video.authorProfile.isFollowing ?? false
  );
  const embedRef = useRef<HTMLTextAreaElement | null>(null);

  async function copyEmbed() {
    const value = video.embedUrl;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else if (embedRef.current) {
        embedRef.current.select();
        document.execCommand("copy");
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // noop
    }
  }

  return (
    <section className="info-panel" aria-label="视频信息">
      <header className="info-panel__header">视频信息</header>
      <div className="info-panel__body">
        <div className="info-row">
          <span className="info-row__label">发布时间</span>
          <span className="info-row__value">{video.publishedAt}</span>
        </div>

        <div className="info-row">
          <span className="info-row__label">作者</span>
          <div className="info-row__value">
            <div className="author-card">
              <div className="author-card__avatar">
                {video.authorProfile.name.slice(0, 1)}
              </div>
              <div>
                <div className="author-card__name">
                  {video.authorProfile.name}
                </div>
                <div className="author-card__meta">
                  {video.authorProfile.signupAge} ·{" "}
                  {formatCount(video.authorProfile.followers)} 粉丝 ·{" "}
                  {formatCount(video.authorProfile.videoCount)} 视频
                </div>
              </div>
              <button
                className={`author-card__follow ${
                  following ? "is-following" : ""
                }`}
                onClick={() => setFollowing((v) => !v)}
                aria-pressed={following}
              >
                {following ? "已关注" : "关注"}
              </button>
            </div>
          </div>
        </div>

        <div className="info-row">
          <span className="info-row__label">标签</span>
          <span className="info-row__value">
            {(video.tags ?? []).map((t) => (
              <span
                key={t}
                className="tag-chip"
                style={{ marginRight: 6, marginBottom: 4, display: "inline-block" }}
              >
                {t}
              </span>
            ))}
          </span>
        </div>

        <div className="info-row">
          <span className="info-row__label">描述</span>
          <span className="info-row__value">
            <p
              className={`description ${collapsed ? "is-collapsed" : ""}`}
            >
              {video.description}
            </p>
            <button
              className="description-toggle"
              onClick={() => setCollapsed((v) => !v)}
            >
              {collapsed ? "展开全文" : "收起"}
            </button>
          </span>
        </div>

        <div className="info-row">
          <span className="info-row__label">嵌入代码</span>
          <span className="info-row__value">
            <div className="embed-box">
              <textarea
                ref={embedRef}
                className="embed-box__input"
                readOnly
                value={video.embedUrl}
                onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                aria-label="嵌入代码"
              />
              <button
                className={`embed-box__copy ${copied ? "is-copied" : ""}`}
                onClick={copyEmbed}
              >
                <Copy size={14} />
                {copied ? "已复制" : "复制"}
              </button>
            </div>
          </span>
        </div>
      </div>
    </section>
  );
}
