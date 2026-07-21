"use client";

import { useState } from "react";
import { useToast, Field } from "./ui";
import {
  ImagePicker,
  LocalizedText,
  type LocaleMap,
  type MediaRef,
} from "./fields";
import { sendPerLocale } from "@/lib/studio/save";
import { LOCALE_CODES } from "@/lib/studio/locales";
import { IconCheck } from "./icons";
import { GalleryPicker, type GalleryItem } from "./GalleryPicker";

export type CountryInitial = {
  id: number;
  region: number | null;
  published: boolean;
  heroImage: MediaRef;
  gallery: GalleryItem[];
  name: LocaleMap;
  intro: LocaleMap;
  body: LocaleMap;
};

export function CountryEditor({
  initial,
  regions,
}: {
  initial: CountryInitial;
  regions: { id: number; name: string }[];
}) {
  const toast = useToast();
  const [c, setC] = useState<CountryInitial>(initial);
  const [saving, setSaving] = useState(false);
  const patch = (p: Partial<CountryInitial>) => setC((v) => ({ ...v, ...p }));

  async function save() {
    setSaving(true);
    const shared = {
      region: c.region,
      published: c.published,
      heroImage: c.heroImage?.id ?? null,
      gallery: c.gallery,
    };
    const bodies = Object.fromEntries(
      LOCALE_CODES.map((loc) => [
        loc,
        {
          ...shared,
          name: c.name[loc] ?? "",
          intro: c.intro[loc] ?? "",
          body: c.body[loc] ?? "",
        },
      ]),
    );
    const ok = await sendPerLocale("PATCH", `/api/countries/${c.id}`, bodies);
    setSaving(false);
    toast(ok ? "Saqlandi — saytda ~5 daqiqada ko'rinadi" : "Saqlab bo'lmadi", ok ? "ok" : "error");
  }

  return (
    <>
      <div className="s-card">
        <div className="s-card__body">
          <div className="s-form">
            <LocalizedText label="Nomi" required value={c.name} onChange={(name) => patch({ name })} />
            <LocalizedText
              label="Qisqa tavsif"
              textarea
              value={c.intro}
              onChange={(intro) => patch({ intro })}
              help="Sahifa tepasidagi kirish matni."
            />
            <LocalizedText
              label="To'liq ma'lumot (Markdown)"
              textarea
              value={c.body}
              onChange={(body) => patch({ body })}
              help="Istalgancha to'liq ma'lumot. Markdown: '# Sarlavha', '## Kichik sarlavha', '- ro'yxat', '**qalin**', '[havola](https://...)', '![rasm](https://...)'. Bo'sh qoldirsangiz faqat qisqa tavsif chiqadi."
            />
            <div className="s-row2">
              <Field label="Mintaqa" required>
                <select
                  className="s-select"
                  value={c.region ?? ""}
                  onChange={(e) => patch({ region: Number(e.target.value) })}
                >
                  {regions.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Holat">
                <label className="s-check" style={{ marginTop: 8 }}>
                  <input
                    type="checkbox"
                    checked={c.published}
                    onChange={(e) => patch({ published: e.target.checked })}
                  />
                  Saytda ko'rsatilsin
                </label>
              </Field>
            </div>
            <ImagePicker label="Asosiy rasm" value={c.heroImage} onChange={(heroImage) => patch({ heroImage })} />
            <GalleryPicker value={c.gallery} onChange={(gallery) => patch({ gallery })} />
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
