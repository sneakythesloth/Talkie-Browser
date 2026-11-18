export interface TalkieBrowserState {
  url: string;
  title: string;
  canGoBack: boolean;
  canGoForward: boolean;
  isLoading: boolean;
}

export interface TalkieBrowserBridge {
  navigate(url: string): Promise<void>;
  back(): Promise<void>;
  forward(): Promise<void>;
  reload(): Promise<void>;
  getState(): Promise<TalkieBrowserState | null>;
  onStateChange(callback: (state: TalkieBrowserState) => void): () => void;
}

declare global {
  interface Window {
    talkieBrowser: TalkieBrowserBridge;
  }
}

export {};
