import type { TalkieTabState } from "../../electron/browser-api";

export function StatusLine({ active }: { active: TalkieTabState | null }) {
  const loading = Boolean(active?.isLoading);
  const text = loading
    ? "Loading page…"
    : active?.url
      ? active.title || "Page ready"
      : "New tab — search or enter an address";

  return (
    <div className="status-line">
      <span className={loading ? "status-dot loading" : "status-dot"} />
      <span>{text}</span>
      <span className="status-right">TALKIE / EARLY BUILD</span>
    </div>
  );
}
