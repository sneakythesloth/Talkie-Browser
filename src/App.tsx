import { useCallback, useEffect, useRef } from "react";
import type { TalkieBrowserBridge } from "../electron/browser-api";
import { StatusLine } from "./components/StatusLine";
import { TabStrip } from "./components/TabStrip";
import { Toast } from "./components/Toast";
import { Toolbar } from "./components/Toolbar";
import { useBrowserState } from "./hooks/useBrowserState";
import { useShortcuts } from "./hooks/useShortcuts";
import { useToast } from "./hooks/useToast";
import { cleanIpcError } from "./lib";

interface AppProps {
  /** The preload bridge. Injected so tests can pass a fake. */
  api: TalkieBrowserBridge;
}

export default function App({ api }: AppProps) {
  const { state, error } = useBrowserState(api);
  const toast = useToast();
  const addressRef = useRef<HTMLInputElement>(null);
  const { notify } = toast;

  useEffect(() => {
    if (error) notify(error);
  }, [error, notify]);

  // Fire-and-forget bridge calls: surface failures instead of swallowing them.
  const run = useCallback(
    (action: () => Promise<unknown>, fallback: string) => {
      action().catch((e: unknown) => notify(cleanIpcError(e, fallback)));
    },
    [notify]
  );

  const navigate = useCallback(
    async (value: string) => {
      try {
        await api.navigate(value);
      } catch (e) {
        notify(cleanIpcError(e, "That address could not be opened"));
        throw e;
      }
    },
    [api, notify]
  );

  const activeTabId = state?.activeTabId ?? null;

  useShortcuts({
    focusAddress: () => addressRef.current?.focus(),
    newTab: () => run(() => api.newTab(""), "Could not open a new tab"),
    closeActiveTab: () => {
      if (activeTabId) run(() => api.closeTab(activeTabId), "Could not close the tab");
    },
    reload: () => run(() => api.reload(), "Could not reload"),
    reopenClosedTab: () => notify("Recently closed tabs are not available yet.")
  });

  return (
    <>
      <header className="browser-chrome">
        <TabStrip
          tabs={state?.tabs ?? []}
          activeTabId={activeTabId}
          onSwitch={(id) => run(() => api.switchTab(id), "Could not switch tabs")}
          onClose={(id) => run(() => api.closeTab(id), "Could not close the tab")}
          onNewTab={() => run(() => api.newTab(""), "Could not open a new tab")}
        />
        <Toolbar
          ref={addressRef}
          active={state?.active ?? null}
          onBack={() => run(() => api.back(), "Could not go back")}
          onForward={() => run(() => api.forward(), "Could not go forward")}
          onReload={() => run(() => api.reload(), "Could not reload")}
          onHome={() => run(() => api.home(), "Could not go home")}
          onNavigate={navigate}
          onAi={() => notify("The AI workspace is planned, but it is not connected in this build yet.")}
          onMenu={() => notify("Bookmarks, downloads and settings are still being built.")}
        />
        <StatusLine active={state?.active ?? null} />
      </header>
      <Toast message={toast.message} visible={toast.visible} />
    </>
  );
}
