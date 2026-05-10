import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { fetchTags, type TagItem } from "@/data/videos";

export function TagCloud() {
  const [params] = useSearchParams();
  const activeTag = params.get("cat");
  const [tags, setTags] = useState<TagItem[]>([]);

  useEffect(() => {
    let active = true;
    fetchTags().then((list) => {
      if (active) setTags(list);
    });
    return () => {
      active = false;
    };
  }, []);

  if (tags.length === 0) return null;

  return (
    <div className="tag-cloud" aria-label="热门分类">
      <span className="tag-cloud__label">分类：</span>
      {tags.map((tag) => (
        <Link
          key={tag.id}
          to={`/list?cat=${encodeURIComponent(tag.label)}`}
          className={`tag-chip ${activeTag === tag.label ? "is-active" : ""}`}
          title={
            typeof tag.count === "number" ? `${tag.count} 个视频` : undefined
          }
        >
          {tag.label}
          {typeof tag.count === "number" && tag.count > 0 && (
            <span style={{ marginLeft: 4, opacity: 0.7 }}>({tag.count})</span>
          )}
        </Link>
      ))}
    </div>
  );
}
