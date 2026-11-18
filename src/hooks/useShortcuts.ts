import { useEffect, useRef } from "react";

export interface ShortcutHandlers {
  focusAddress: () => void;
  newTab: () => void;
  closeActiveTab: () => void;
  reload: () => void;
  reopenClosedTab: () => void;
}

/**
 * Cmd/Ctrl+L, T, W, R and Shift+T while the browser chrome has focus.
 * Handlers are read through a ref so the listener is registered once.
 */
export function useShortcuts(handlers: ShortcutHandlers): void {
  const ref = useRef(handlers);
  ref.current = handlers;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.altKey) return;
      const h = ref.current;
      const key = event.key.toLowerCase();

      if (key === "l") {
        event.preventDefault();
        h.focusAddress();
      } else if (key === "t" && event.shiftKey) {
        event.preventDefault();
        h.reopenClosedTab();
      } else if (key === "t") {
        event.preventDefault();
        h.newTab();
      } else if (key === "w") {
        event.preventDefault();
        h.closeActiveTab();
      } else if (key === "r") {
        event.preventDefault();
        h.reload();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);
}
