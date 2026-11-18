import { readFileSync } from "node:fs";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import App from "./App";
import { cleanIpcError } from "./lib";
import { browserState, createFakeBridge, tab } from "./test/fakeBridge";

const twoTabs = () =>
  browserState(
    [
      tab({ id: "tab-1", title: "First", url: "https://first.test/", canGoBack: true }),
      tab({ id: "tab-2", title: "Second", url: "https://second.test/" })
    ],
    "tab-1"
  );

async function setup(state = twoTabs()) {
  const fake = createFakeBridge(state);
  const user = userEvent.setup();
  render(<App api={fake.bridge} />);
  await screen.findAllByRole("tab");
  return { ...fake, user };
}

describe("tabs", () => {
  it("renders every tab and marks the active one", async () => {
    await setup();
    expect(screen.getByRole("tab", { name: /First/ })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: /Second/ })).toHaveAttribute("aria-selected", "false");
  });

  it("switches tab on click", async () => {
    const { bridge, user } = await setup();
    await user.click(screen.getByRole("tab", { name: /Second/ }));
    expect(bridge.switchTab).toHaveBeenCalledWith("tab-2");
  });

  it("closes a tab without also switching to it", async () => {
    const { bridge, user } = await setup();
    await user.click(screen.getByRole("button", { name: "Close tab: Second" }));
    expect(bridge.closeTab).toHaveBeenCalledWith("tab-2");
    expect(bridge.switchTab).not.toHaveBeenCalled();
  });

  it("closes a tab on middle click", async () => {
    const { bridge } = await setup();
    const second = screen.getByRole("tab", { name: /Second/ });
    second.dispatchEvent(new MouseEvent("auxclick", { bubbles: true, button: 1 }));
    await waitFor(() => expect(bridge.closeTab).toHaveBeenCalledWith("tab-2"));
  });

  it("opens a new tab from the + button", async () => {
    const { bridge, user } = await setup();
    await user.click(screen.getByRole("button", { name: "New tab" }));
    expect(bridge.newTab).toHaveBeenCalledWith("");
  });

  it("shows Loading… for a loading tab", async () => {
    await setup(browserState([tab({ id: "tab-1", title: "First", isLoading: true })]));
    expect(await screen.findByText("Loading…")).toBeInTheDocument();
  });

  it("follows state pushed from the main process", async () => {
    const { push } = await setup();
    act(() => push(browserState([tab({ id: "tab-9", title: "Pushed" })])));
    expect(await screen.findByRole("tab", { name: /Pushed/ })).toBeTruthy();
    expect(screen.queryByRole("tab", { name: /Second/ })).toBeNull();
  });

  it("unsubscribes on unmount", async () => {
    const fake = createFakeBridge(twoTabs());
    const { unmount } = render(<App api={fake.bridge} />);
    await screen.findByRole("tab", { name: /First/ });
    unmount();
    expect(fake.unsubscribe).toHaveBeenCalled();
  });
});

describe("toolbar", () => {
  it("disables back/forward from the active tab's history", async () => {
    await setup();
    expect(screen.getByRole("button", { name: "Back" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Forward" })).toBeDisabled();
  });

  it("calls back, forward, reload and home", async () => {
    const { bridge, user } = await setup(
      browserState([tab({ canGoBack: true, canGoForward: true })])
    );
    await user.click(screen.getByRole("button", { name: "Back" }));
    await user.click(screen.getByRole("button", { name: "Forward" }));
    await user.click(screen.getByRole("button", { name: "Reload" }));
    await user.click(screen.getByRole("button", { name: "Home" }));
    expect(bridge.back).toHaveBeenCalled();
    expect(bridge.forward).toHaveBeenCalled();
    expect(bridge.reload).toHaveBeenCalled();
    expect(bridge.home).toHaveBeenCalled();
  });

  it("turns reload into stop while loading", async () => {
    await setup(browserState([tab({ title: "First", isLoading: true })]));
    expect(await screen.findByRole("button", { name: "Stop loading" })).toBeTruthy();
  });

  it("tells the user the AI workspace is not connected", async () => {
    const { user } = await setup();
    await user.click(screen.getByRole("button", { name: /AI/ }));
    expect(await screen.findByRole("status")).toHaveTextContent(/not connected/);
  });
});

describe("address bar", () => {
  it("shows the active tab's URL", async () => {
    await setup();
    expect(screen.getByLabelText("Search or enter address")).toHaveValue("https://first.test/");
  });

  it("navigates on submit", async () => {
    const { bridge, user } = await setup();
    const input = screen.getByLabelText("Search or enter address");
    await user.clear(input);
    await user.type(input, "example.org{Enter}");
    expect(bridge.navigate).toHaveBeenCalledWith("example.org");
  });

  it("shows a cleaned error and keeps the draft when navigation is rejected", async () => {
    const { bridge, user } = await setup();
    vi.mocked(bridge.navigate).mockRejectedValueOnce(
      new Error("Error invoking remote method 'talkie:browser-navigate': Error: Only http and https are supported.")
    );
    const input = screen.getByLabelText("Search or enter address");
    await user.clear(input);
    await user.type(input, "ftp://nope{Enter}");
    expect(await screen.findByRole("status")).toHaveTextContent(/^Only http and https are supported\.$/);
    expect(input).toHaveValue("ftp://nope");
  });

  it("does not overwrite what the user is typing when state updates", async () => {
    const { push, user } = await setup();
    const input = screen.getByLabelText("Search or enter address");
    await user.clear(input);
    await user.type(input, "typing");
    act(() => push(browserState([tab({ id: "tab-1", title: "First", url: "https://changed.test/" })])));
    expect(input).toHaveValue("typing");
  });

  it("falls back to the tab URL after blur", async () => {
    const { user } = await setup();
    const input = screen.getByLabelText("Search or enter address");
    await user.clear(input);
    await user.type(input, "abandoned");
    await user.tab();
    expect(input).toHaveValue("https://first.test/");
  });
});

describe("keyboard shortcuts", () => {
  it("Ctrl+T opens a tab and Ctrl+W closes the active one", async () => {
    const { bridge, user } = await setup();
    await user.keyboard("{Control>}t{/Control}");
    expect(bridge.newTab).toHaveBeenCalledWith("");
    await user.keyboard("{Control>}w{/Control}");
    expect(bridge.closeTab).toHaveBeenCalledWith("tab-1");
  });

  it("Ctrl+R reloads and Ctrl+L focuses the address bar", async () => {
    const { bridge, user } = await setup();
    await user.keyboard("{Control>}r{/Control}");
    expect(bridge.reload).toHaveBeenCalled();
    await user.keyboard("{Control>}l{/Control}");
    expect(screen.getByLabelText("Search or enter address")).toHaveFocus();
  });

  it("focuses the address bar when the main process asks (shortcut pressed inside a page)", async () => {
    const { requestAddressFocus } = await setup();
    act(() => requestAddressFocus());
    expect(screen.getByLabelText("Search or enter address")).toHaveFocus();
  });

  it("Ctrl+Shift+T explains recently closed tabs are not available", async () => {
    const { user } = await setup();
    await user.keyboard("{Control>}{Shift>}t{/Shift}{/Control}");
    expect(await screen.findByRole("status")).toHaveTextContent(/Recently closed tabs/);
  });
});

describe("cleanIpcError", () => {
  it("strips Electron's IPC prefix", () => {
    expect(cleanIpcError(new Error("Error invoking remote method 'x': Error: boom"), "fb")).toBe("boom");
  });
  it("uses the fallback for empty or unknown errors", () => {
    expect(cleanIpcError(undefined, "fallback")).toBe("fallback");
  });
});

describe("main-process contract", () => {
  it("chrome height in CSS matches TOOLBAR_HEIGHT in main.cjs", () => {
    const main = readFileSync("electron/main.cjs", "utf8");
    const css = readFileSync("src/styles.css", "utf8");
    const fromMain = Number(/const TOOLBAR_HEIGHT = (\d+);/.exec(main)?.[1]);
    const fromCss = Number(/\.browser-chrome \{ height: (\d+)px;/.exec(css)?.[1]);
    expect(fromMain).toBeGreaterThan(0);
    expect(fromCss).toBe(fromMain);
  });

  it("every method the UI calls exists in the preload bridge", () => {
    const preload = readFileSync("electron/preload.cjs", "utf8");
    for (const name of ["onFocusAddress", "getState", "newTab", "switchTab", "closeTab", "navigate", "back", "forward", "reload", "home", "onStateChange"]) {
      expect(preload).toContain(`${name}:`);
    }
  });
});
