export interface TalkieTabState {
  id: string;
  title: string;
  url: string;
  isLoading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
}

export interface TalkieBrowserState {
  tabs: TalkieTabState[];
  activeTabId: string | null;
  active: TalkieTabState | null;
}

export interface TalkieBrowserBridge {
  getState(): Promise<TalkieBrowserState>;
  newTab(url?: string): Promise<string | null>;
  switchTab(id: string): Promise<void>;
  closeTab(id: string): Promise<void>;
  navigate(url: string): Promise<void>;
  back(): Promise<void>;
  forward(): Promise<void>;
  reload(): Promise<void>;
  home(): Promise<void>;
  openExternal(url: string): Promise<void>;
  onStateChange(callback: (state: TalkieBrowserState) => void): () => void;
  /** Fired when the main process wants the address bar focused (e.g. Cmd/Ctrl+L pressed inside a web page). */
  onFocusAddress(callback: () => void): () => void;
}

declare global {
  interface Window {
    talkieBrowser: TalkieBrowserBridge;
  }
}

export {};

