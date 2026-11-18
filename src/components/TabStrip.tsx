import type { KeyboardEvent, MouseEvent } from "react";
import type { TalkieTabState } from "../../electron/browser-api";

interface TabStripProps {
  tabs: TalkieTabState[];
  activeTabId: string | null;
  onSwitch: (id: string) => void;
  onClose: (id: string) => void;
  onNewTab: () => void;
}

export function TabStrip({ tabs, activeTabId, onSwitch, onClose, onNewTab }: TabStripProps) {
  return (
    <div className="tab-strip" role="tablist" aria-label="Browser tabs">
      {tabs.map((tab) => {
        const active = tab.id === activeTabId;

        const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
          if (event.target !== event.currentTarget) return;
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onSwitch(tab.id);
          }
        };
        // Middle-click closes a tab, like other browsers.
        const onAuxClick = (event: MouseEvent<HTMLDivElement>) => {
          if (event.button === 1) {
            event.preventDefault();
            onClose(tab.id);
          }
        };

        return (
          <div
            key={tab.id}
            className={active ? "tab active" : "tab"}
            role="tab"
            tabIndex={0}
            aria-selected={active}
            title={tab.url || tab.title}
            onClick={() => onSwitch(tab.id)}
            onKeyDown={onKeyDown}
            onAuxClick={onAuxClick}
          >
            <span className="tab-title">{tab.isLoading ? "Loading…" : tab.title || "New tab"}</span>
            <button
              type="button"
              className="tab-close"
              tabIndex={-1}
              aria-label={`Close tab: ${tab.title || "New tab"}`}
              onClick={(event) => {
                event.stopPropagation();
                onClose(tab.id);
              }}
            >
              ×
            </button>
          </div>
        );
      })}
      <div className="tab-strip-spacer" />
      <button
        type="button"
        className="new-tab-button"
        title="New tab (⌘/Ctrl+T)"
        aria-label="New tab"
        onClick={onNewTab}
      >
        +
      </button>
    </div>
  );
}
