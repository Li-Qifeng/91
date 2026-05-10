import { FormEvent, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";

type SearchType = "video" | "user" | "id" | "date";

const typeOptions: { value: SearchType; label: string }[] = [
  { value: "video", label: "搜索视频" },
  { value: "user", label: "搜索用户" },
  { value: "id", label: "视频 ID" },
  { value: "date", label: "按日期" },
];

export function SearchPanel() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [keyword, setKeyword] = useState(params.get("q") ?? "");
  const [type, setType] = useState<SearchType>("video");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const q = keyword.trim();
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    sp.set("type", type);
    navigate(`/list?${sp.toString()}`);
  }

  return (
    <form className="search-panel" onSubmit={handleSubmit} role="search">
      <div className="search-panel__form">
        <input
          className="search-panel__input"
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="搜索关键词、作者、视频 ID"
          aria-label="关键词"
        />
        <select
          className="search-panel__select"
          value={type}
          onChange={(e) => setType(e.target.value as SearchType)}
          aria-label="搜索类型"
        >
          {typeOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <button className="search-panel__submit" type="submit">
          <Search size={16} />
          搜索
        </button>
      </div>
    </form>
  );
}
