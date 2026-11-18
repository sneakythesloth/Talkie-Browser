/**
 * Electron prefixes errors thrown in ipcMain handlers with
 * "Error invoking remote method 'channel': Error: ". Strip that so the
 * toast shows only the message the main process meant to show.
 */
export function cleanIpcError(error: unknown, fallback: string): string {
  const raw = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  const cleaned = raw.replace(/^Error invoking remote method '[^']*':\s*(Error:\s*)?/, "").trim();
  return cleaned || fallback;
}
