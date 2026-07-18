"use client";

import { useState } from "react";
import { useToast, Field } from "./ui";
import { LocalizedText, LocalizedSections, type LocaleMap } from "./fields";
import { sendPerLocale } from "@/lib/studio/save";
import { LOCALE_CODES } from "@/lib/studio/locales";
import { IconCheck } from "./icons";

export type GuideInitial = {
  id: number;
  country: number | null;
  title: LocaleMap;
  sections: Record<string, { heading: string; body: string }[]>;
};

export function GuideEditor({
  initial,
  countries,
}: {
  initial: GuideInitial;
  countries: { id: number; name: string }[];
}) {
  const toast = useToast();
  const [g, setG] = useState<GuideInitial>(initial);
  const [saving, setSaving] = useState(false);
  const patch = (p: Partial<GuideInitial>) => setG((v) => ({ ...v, ...p }));

  async function save() {
    setSaving(true);
    const bodies = Object.fromEntries(
      LOCALE_CODES.map((loc) => [
        loc,
        {
          country: g.country,
          title: g.title[loc] ?? "",
          sections: g.sections[loc] ?? [],
        },
      ]),
    );
    const ok = await sendPerLocale("PATCH", `/api/guides/${g.id}`, bodies);
    setSaving(false);
    toast(ok ? "Saqlandi" : "Saqlab bo'lmadi", ok ? "ok" : "error");
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
