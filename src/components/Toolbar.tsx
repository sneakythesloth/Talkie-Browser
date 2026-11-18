import { forwardRef } from "react";
import type { TalkieTabState } from "../../electron/browser-api";
import { AddressBar } from "./AddressBar";

interface ToolbarProps {
  active: TalkieTabState | null;
  onBack: () => void;
  onForward: () => void;
  onReload: () => void;
  onHome: () => void;
  onNavigate: (value: string) => Promise<void>;
  onAi: () => void;
  onMenu: () => void;
}

export const Toolbar = forwardRef<HTMLInputElement, ToolbarProps>(function Toolbar(
  { active, onBack, onForward, onReload, onHome, onNavigate, onAi, onMenu },
  addressRef
) {
  const loading = Boolean(active?.isLoading);

  return (
    <div className="toolbar">
      <div className="navigation-buttons">
        <button type="button" className="tool-button" title="Back" aria-label="Back" disabled={!active?.canGoBack} onClick={onBack}>
          ‹
        </button>
        <button type="button" className="tool-button" title="Forward" aria-label="Forward" disabled={!active?.canGoForward} onClick={onForward}>
          ›
        </button>
        <button
          type="button"
          className="tool-button"
          title={loading ? "Stop loading" : "Reload"}
          aria-label={loading ? "Stop loading" : "Reload"}
          onClick={onReload}
        >
          {loading ? "×" : "↻"}
        </button>
        <button type="button" className="tool-button home-button" title="Home" aria-label="Home" onClick={onHome}>
          ⌂
        </button>
      </div>
      <AddressBar ref={addressRef} url={active?.url ?? ""} onSubmit={onNavigate} />
      <button type="button" className="ai-toggle" title="AI workspace is not wired up yet" onClick={onAi}>
        ✦ <span>AI</span>
      </button>
      <button type="button" className="menu-button" title="Browser menu" aria-label="Browser menu" onClick={onMenu}>
        ···
      </button>
    </div>
  );
});
