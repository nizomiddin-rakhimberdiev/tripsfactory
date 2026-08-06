"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "./ui";

/**
 * Re-fills the other seven locales from the English text.
 *
 * Translation happens once, at import. Editing the English afterwards leaves
 * those translations holding the old wording, and nothing on the page would
 * otherwise say so — so this is the button that fixes it, pressed when the
 * editor knows they changed something.
 *
 * Deliberately not automatic on save: it costs an API call per locale, and a
 * translation somebody corrected by hand should not be silently replaced
 * because a price field changed.
 */
export function RetranslateButton({ id }: { id: number }) {
  const router = useRouter();
  const toast = useToast();
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    const res = await fetch("/api/studio/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id }),
    }).catch(() => null);

    setBusy(false);
    setArmed(false);

    if (!res?.ok) {
      let message = "Tarjima qilinmadi";
      try {
        const data = (await res?.json()) as { error?: string };
        if (data?.error) message = data.error;
      } catch {
        /* keep the generic message */
      }
      toast(message, "error");
      return;
    }

    const data = (await res.json()) as { translated: string[]; failed: string[] };
    if (!data.translated.length) {
      toast("Hech bir til tarjima qilinmadi", "error");
      return;
    }
    toast(
      data.failed.length
        ? `${data.translated.length} til yangilandi, ${data.failed
            .map((l) => l.toUpperCase())
            .join(", ")} bo'lmadi`
        : `${data.translated.length} til yangilandi`,
      data.failed.length ? "error" : "ok",
    );
    router.refresh();
  }

  if (!armed) {
    return (
      <button type="button" className="s-btn" onClick={() => setArmed(true)}>
        Tarjimalarni yangilash
      </button>
    );
  }

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 13, color: "var(--s-fg-secondary)" }}>
        Inglizchadan 7 tilga qayta yozilsinmi? Qo&apos;lda tuzatganingiz
        almashadi.
      </span>
      <button
        type="button"
        className="s-btn s-btn--primary"
        disabled={busy}
        onClick={run}
      >
        {busy ? "Tarjima qilinmoqda…" : "Ha, yangila"}
      </button>
      <button type="button" className="s-btn" onClick={() => setArmed(false)}>
        Bekor qilish
      </button>
    </span>
  );
}
