"use client";

import { useState } from "react";
import { useToast, Field } from "./ui";
import { LocalizedText, LocalizedSections, type LocaleMap } from "./fields";
import { saveMessage, sendPerLocale } from "@/lib/studio/save";
import { fieldErrors, slugTaken, slugify } from "@/lib/studio/slug";
import { fillTranslations } from "@/lib/studio/translate-client";
import { useRouter } from "next/navigation";
import { LOCALE_CODES } from "@/lib/studio/locales";
import { IconCheck } from "./icons";

export type GuideInitial = {
  /** null while the record has not been created yet. */
  id: number | null;
  country: number | null;
  title: LocaleMap;
  sections: Record<string, { heading: string; body: string }[]>;
};

/** Fields stored per locale; a locale with none of them filled in is not written. */
const LOCALIZED = ["title", "sections"];

export function GuideEditor({
  initial,
  countries,
}: {
  initial: GuideInitial;
  countries: { id: number; name: string }[];
}) {
  const toast = useToast();
  const router = useRouter();
  const [g, setG] = useState<GuideInitial>(initial);
  const [saving, setSaving] = useState(false);
  const patch = (p: Partial<GuideInitial>) => setG((v) => ({ ...v, ...p }));

  async function save() {
    setSaving(true);
    // Shared fields go with the base locale only — see the note in TourEditor:
    // they are not localized, so repeating them in all eight writes is wasted
    // work, and for a relationship stored without a locale column it duplicates
    // rows.
    const localized = (loc: string) => ({
      title: g.title[loc] ?? "",
      sections: g.sections[loc] ?? [],
    });
    const bodies = Object.fromEntries(
      LOCALE_CODES.map((loc) => [
        loc,
        loc === "en"
          ? { country: g.country, ...localized(loc) }
          : localized(loc),
      ]),
    );
    // Creating uses the same form and the same button: the base locale is
    // posted to get an id, then the rest are written onto it exactly as on
    // any later save.
    if (g.id === null) {
      const created = await create(bodies.en as Record<string, unknown>);
      setSaving(false);
      if (created === null) return;
      const rest = Object.fromEntries(
        Object.entries(bodies).filter(([loc]) => loc !== "en"),
      );
      const { failed } = await sendPerLocale(
        "PATCH",
        `/api/guides/${created}`,
        rest,
        LOCALIZED,
      );
      toast(
        failed.length ? saveMessage(failed) : "Yaratildi",
        failed.length ? "error" : "ok",
      );
      router.replace(`/studio/guides/${created}`);
      void fillTranslations("guides", created, toast, {
        silentWhenNothingToDo: true,
      });
      return;
    }

    const { ok, failed } = await sendPerLocale("PATCH", `/api/guides/${g.id}`, bodies, LOCALIZED);
    setSaving(false);
    toast(saveMessage(failed), ok ? "ok" : "error");
    // Any locale still empty is filled from the English just saved. Locales
    // that already hold text are left alone, so a correction survives.
    if (ok && g.id !== null) {
      void fillTranslations("guides", g.id, toast, {
        silentWhenNothingToDo: true,
      });
    }
  }
  /** Returns the new id, or null after reporting why it could not be made. */
  async function create(body: Record<string, unknown>): Promise<number | null> {
    const slug = slugify(g.title.en ?? "");
    if (!slug) {
      toast("Inglizcha nom lotin harflarida bo'lishi kerak", "error");
      return null;
    }
    if (await slugTaken("guides", slug)) {
      toast(`«${g.title.en}» nomli maqola allaqachon bor`, "error");
      return null;
    }
    const res = await fetch("/api/guides?locale=en", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ ...body, slug }),
    }).catch(() => null);
    if (!res?.ok) {
      const detail = await fieldErrors(res);
      toast(detail ? `Yaratilmadi — to'ldiring: ${detail}` : "Yaratilmadi", "error");
      return null;
    }
    const data = (await res.json()) as { doc?: { id: number } };
    return data.doc?.id ?? null;
  }


  return (
    <>
      <div className="s-card">
        <div className="s-card__body">
          <div className="s-form">
            <LocalizedText label="Sarlavha" required value={g.title} onChange={(title) => patch({ title })} />
            <Field label="Davlat" required>
              <select className="s-select" value={g.country ?? ""} onChange={(e) => patch({ country: Number(e.target.value) })}>
                {countries.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </Field>
            <LocalizedSections value={g.sections} onChange={(sections) => patch({ sections })} />
          </div>
        </div>
      </div>
      <div className="s-savebar">
        <div className="s-savebar__spacer" />
        <button className="s-btn s-btn--primary" onClick={save} disabled={saving}>
          {saving ? <span className="s-spin" /> : <IconCheck />} Saqlash
        </button>
      </div>
    </>
  );
}
