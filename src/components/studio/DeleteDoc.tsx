"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "./ui";

/**
 * Deleting a record.
 *
 * Two clicks, not a browser confirm(): the second click is the confirmation,
 * and it names what is about to go. A native dialog is easy to dismiss without
 * reading, and this removes a page that may be linked from live tours.
 *
 * There is no undo, so the button says so before the click that does it.
 */
export function DeleteDoc({
  collection,
  id,
  label,
}: {
  collection: string;
  id: number;
  /** What the editor is about to delete, in their words. */
  label: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);

  async function remove() {
    setBusy(true);
    const res = await fetch(`/api/${collection}/${id}`, {
      method: "DELETE",
      credentials: "include",
    }).catch(() => null);

    if (!res?.ok) {
      setBusy(false);
      setArmed(false);
      // Where the server explains itself, say what it said. A partner that
      // cannot be removed because enquiries depend on it is a rule with a
      // reason, and "something is probably linked" wastes the reader's time.
      const body = (await res?.json().catch(() => null)) as {
        errors?: { message?: string }[];
      } | null;
      const explained = body?.errors?.[0]?.message;
      toast(
        explained && !/something went wrong/i.test(explained)
          ? explained
          : "O'chirilmadi — bu yozuvga boshqa joydan havola bo'lishi mumkin",
        "error",
      );
      return;
    }
    toast("O'chirildi");
    router.push(`/studio/${collection}`);
    router.refresh();
  }

  if (!armed) {
    return (
      <button
        type="button"
        className="s-btn s-btn--danger"
        onClick={() => setArmed(true)}
      >
        O&apos;chirish
      </button>
    );
  }

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 13, color: "var(--s-fg-secondary)" }}>
        «{label}» butunlay o&apos;chirilsinmi?
      </span>
      <button
        type="button"
        className="s-btn s-btn--danger"
        disabled={busy}
        onClick={remove}
      >
        {busy ? "O'chirilmoqda…" : "Ha, o'chir"}
      </button>
      <button type="button" className="s-btn" onClick={() => setArmed(false)}>
        Bekor qilish
      </button>
    </span>
  );
}
