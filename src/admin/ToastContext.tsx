import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

type ToastKind = "info" | "success" | "error";
type Toast = { id: number; kind: ToastKind; text: string };

type Ctx = {
  show: (text: string, kind?: ToastKind) => void;
};

const ToastCtx = createContext<Ctx | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);

  const show = useCallback((text: string, kind: ToastKind = "info") => {
    const id = Date.now() + Math.random();
    setItems((list) => [...list, { id, kind, text }]);
    window.setTimeout(() => {
      setItems((list) => list.filter((t) => t.id !== id));
    }, 2600);
  }, []);

  return (
    <ToastCtx.Provider value={{ show }}>
      {children}
      {items.map((t) => (
        <div key={t.id} className={`admin-toast is-${t.kind}`}>
          {t.text}
        </div>
      ))}
    </ToastCtx.Provider>
  );
}

export function useToast(): Ctx {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

// 小工具：自动关闭的 toast 倒计时，用于某些异步提示展示后返回
export function useFlashError(): [string | null, (msg: string | null) => void] {
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    if (!err) return;
    const t = window.setTimeout(() => setErr(null), 4000);
    return () => window.clearTimeout(t);
  }, [err]);
  return [err, setErr];
}
