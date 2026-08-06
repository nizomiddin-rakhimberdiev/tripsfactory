/**
 * Fills the other seven locales after a save, from the Studio.
 *
 * Editors write English. Without this the remaining locales stay empty and
 * Payload falls back to English, so a Japanese visitor reads English prose
 * under a Japanese URL — which is what was happening to every record added by
 * hand.
 *
 * Deliberately not awaited by the save button. Translating a tour with an
 * eleven-day itinerary takes tens of seconds, and holding "Saqlanmoqda…" on
 * screen for that long would make saving feel broken. The save reports itself
 * immediately; this reports separately when it finishes.
 *
 * By default only empty locales are filled, so a translation somebody has
 * corrected by hand survives, and a save that only changed a price costs
 * nothing. `force` rewrites all seven — that is the button on the tour page,
 * pressed on purpose after the English has changed.
 */
type Result = { translated: string[]; failed: string[]; skipped?: boolean };
type Toast = (message: string, kind?: "ok" | "error") => void;

export async function fillTranslations(
  collection: string,
  id: number,
  toast: Toast,
  opts: { force?: boolean; silentWhenNothingToDo?: boolean } = {},
): Promise<void> {
  const res = await fetch("/api/studio/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ collection, id, force: opts.force ?? false }),
  }).catch(() => null);

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

  const data = (await res.json()) as Result;

  // Nothing to do is the common case on an ordinary edit; saying so every time
  // would train the editor to ignore the toast that matters.
  if (data.skipped || (!data.translated.length && !data.failed.length)) {
    if (!opts.silentWhenNothingToDo) toast("Tarjimalar allaqachon to'liq");
    return;
  }

  if (!data.translated.length) {
    toast("Hech bir til tarjima qilinmadi", "error");
    return;
  }

  toast(
    data.failed.length
      ? `${data.translated.length} til tarjima qilindi, ${data.failed
          .map((l) => l.toUpperCase())
          .join(", ")} bo'lmadi`
      : `${data.translated.length} tilga tarjima qilindi`,
    data.failed.length ? "error" : "ok",
  );
}
