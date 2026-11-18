import { vi } from "vitest";
import type { TalkieBrowserBridge, TalkieBrowserState, TalkieTabState } from "../../electron/browser-api";

export function tab(overrides: Partial<TalkieTabState> = {}): TalkieTabState {
  return {
    id: "tab-1",
    title: "Example",
    url: "https://example.com/",
    isLoading: false,
    canGoBack: false,
    canGoForward: false,
    ...overrides
  };
}

export function browserState(tabs: TalkieTabState[], activeTabId: string | null = tabs[0]?.id ?? null): TalkieBrowserState {
  return { tabs, activeTabId, active: tabs.find((t) => t.id === activeTabId) ?? null };
}

export function createFakeBridge(initial: TalkieBrowserState) {
  let listener: ((state: TalkieBrowserState) => void) | null = null;
  let focusListener: (() => void) | null = null;
  const unsubscribe = vi.fn(() => {
    listener = null;
  });

  const bridge: TalkieBrowserBridge = {
    getState: vi.fn(async () => initial),
    newTab: vi.fn(async () => "tab-new"),
    switchTab: vi.fn(async () => {}),
    closeTab: vi.fn(async () => {}),
    navigate: vi.fn(async () => {}),
    back: vi.fn(async () => {}),
    forward: vi.fn(async () => {}),
    reload: vi.fn(async () => {}),
    home: vi.fn(async () => {}),
    openExternal: vi.fn(async () => {}),
    onStateChange: vi.fn((cb) => {
      listener = cb;
      return unsubscribe;
    }),
    onFocusAddress: vi.fn((cb) => {
      focusListener = cb;
      return () => {
        focusListener = null;
      };
    })
  };

  return {
    bridge,
    unsubscribe,
    push: (state: TalkieBrowserState) => listener?.(state),
    requestAddressFocus: () => focusListener?.()
  };
}
