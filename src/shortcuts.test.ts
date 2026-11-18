import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const { matchShortcut } = require("../electron/shortcuts.cjs") as {
  matchShortcut: (input: Record<string, unknown>, isMac: boolean) => string | null;
};

const key = (k: string, mods: Record<string, boolean> = {}) => ({ type: "keyDown", key: k, ...mods });

describe("matchShortcut", () => {
  it("uses Ctrl on Windows/Linux", () => {
    expect(matchShortcut(key("l", { control: true }), false)).toBe("focus-address");
    expect(matchShortcut(key("t", { control: true }), false)).toBe("new-tab");
    expect(matchShortcut(key("w", { control: true }), false)).toBe("close-tab");
    expect(matchShortcut(key("r", { control: true }), false)).toBe("reload");
  });

  it("uses Cmd on macOS", () => {
    expect(matchShortcut(key("t", { meta: true }), true)).toBe("new-tab");
    expect(matchShortcut(key("w", { meta: true }), true)).toBe("close-tab");
  });

  it("is case-insensitive (Caps Lock)", () => {
    expect(matchShortcut(key("W", { control: true }), false)).toBe("close-tab");
  });

  it("ignores the wrong modifier for the platform", () => {
    expect(matchShortcut(key("t", { control: true }), true)).toBeNull();
    expect(matchShortcut(key("t", { meta: true }), false)).toBeNull();
  });

  it("lets Shift and Alt combinations through to the page", () => {
    expect(matchShortcut(key("t", { control: true, shift: true }), false)).toBeNull();
    expect(matchShortcut(key("r", { control: true, alt: true }), false)).toBeNull();
  });

  it("ignores plain keys, other keys, key-up and auto-repeat", () => {
    expect(matchShortcut(key("t"), false)).toBeNull();
    expect(matchShortcut(key("x", { control: true }), false)).toBeNull();
    expect(matchShortcut({ type: "keyUp", key: "t", control: true }, false)).toBeNull();
    expect(matchShortcut(key("w", { control: true, isAutoRepeat: true }), false)).toBeNull();
  });

  it("does not throw on missing input", () => {
    expect(matchShortcut(undefined as never, false)).toBeNull();
  });
});
