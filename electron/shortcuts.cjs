/**
 * Maps a `before-input-event` input to a browser shortcut action.
 * Kept free of Electron imports so it can be unit tested.
 *
 * macOS uses Cmd (meta); Windows and Linux use Ctrl. Shift and Alt
 * combinations are intentionally not matched, so they still reach the page.
 */
function matchShortcut(input, isMac) {
  if (!input || input.type !== "keyDown" || input.isAutoRepeat || input.alt || input.shift) return null;

  const modifierHeld = isMac ? Boolean(input.meta) && !input.control : Boolean(input.control) && !input.meta;
  if (!modifierHeld) return null;

  switch (String(input.key).toLowerCase()) {
    case "l":
      return "focus-address";
    case "t":
      return "new-tab";
    case "w":
      return "close-tab";
    case "r":
      return "reload";
    default:
      return null;
  }
}

module.exports = { matchShortcut };
