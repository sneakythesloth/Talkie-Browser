import { useEffect, useState } from "react";
import type { TalkieBrowserBridge, TalkieBrowserState } from "../../electron/browser-api";
import { cleanIpcError } from "../lib";

export interface BrowserStateResult {
  state: TalkieBrowserState | null;
  error: string | null;
}

/** Subscribes to browser state pushed from the main process. */
export function useBrowserState(api: TalkieBrowserBridge): BrowserStateResult {
  const [state, setState] = useState<TalkieBrowserState | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    // Subscribe first so no push is missed while the initial read is in flight.
    const unsubscribe = api.onStateChange((next) => {
      if (!cancelled) setState(next);
    });

    api
      .getState()
      .then((initial) => {
        // A push that arrived first is newer than this snapshot.
        if (!cancelled) setState((current) => current ?? initial);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(cleanIpcError(e, "Could not read browser state"));
      });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [api]);

  return { state, error };
}
