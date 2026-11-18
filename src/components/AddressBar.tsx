import { forwardRef, useState } from "react";
import type { FormEvent } from "react";

interface AddressBarProps {
  /** URL of the active tab; shown whenever the user is not typing. */
  url: string;
  /** Resolves when navigation is accepted, rejects with a user-facing error. */
  onSubmit: (value: string) => Promise<void>;
}

export const AddressBar = forwardRef<HTMLInputElement, AddressBarProps>(function AddressBar(
  { url, onSubmit },
  ref
) {
  // null means "not editing": mirror the active tab's URL.
  const [draft, setDraft] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = (draft ?? url).trim();
    if (!value) return;
    try {
      await onSubmit(value);
      setDraft(null);
      if (typeof ref === "object" && ref?.current) ref.current.blur();
    } catch {
      // Keep the draft so the user can fix the address.
    }
  }

  return (
    <form className="address-form" onSubmit={handleSubmit}>
      <span className="address-mark" aria-hidden="true">
        ⌕
      </span>
      <input
        ref={ref}
        type="text"
        autoComplete="off"
        spellCheck={false}
        placeholder="Search Google or enter an address"
        aria-label="Search or enter address"
        value={draft ?? url}
        onChange={(event) => setDraft(event.target.value)}
        onFocus={(event) => event.target.select()}
        onBlur={() => setDraft(null)}
      />
      <button className="go-button" type="submit">
        Go
      </button>
    </form>
  );
});
