export function Toast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <div className={visible ? "toast visible" : "toast"} role="status" aria-live="polite">
      {message}
    </div>
  );
}
