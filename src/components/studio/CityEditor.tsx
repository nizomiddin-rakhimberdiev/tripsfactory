"use client";

import { useState } from "react";
import { useToast, Field } from "./ui";
import {
  ImagePicker,
  LocalizedText,
  LocalizedList,
  type LocaleMap,
  type MediaRef,
} from "./fields";
import { sendPerLocale } from "@/lib/studio/save";
import { LOCALE_CODES } from "@/lib/studio/locales";
import { IconCheck } from "./icons";
import { GalleryPicker, type GalleryItem } from "./GalleryPicker";

export type CityInitial = {
  id: number;
  country: number | null;
  recommendedNights: number;
  lat: number | null;
  lng: number | null;
  image: MediaRef;
  gallery: GalleryItem[];
  name: LocaleMap;
  intro: LocaleMap;
  attractions: Record<string, { text: string }[]>;
};

export function CityEditor({
  initial,
  countries,
}: {
  initial: CityInitial;
  countries: { id: number; name: string }[];
}) {
  const toast = useToast();
  const [c, setC] = useState<CityInitial>(initial);
  const [saving, setSaving] = useState(false);
  const patch = (p: Partial<CityInitial>) => setC((v) => ({ ...v, ...p }));

  async function save() {
    setSaving(true);
    const shared = {
      country: c.country,
      recommendedNights: c.recommendedNights,
      lat: c.lat,
      lng: c.lng,
      image: c.image?.id ?? null,
      gallery: c.gallery,
    };
    const bodies = Object.fromEntries(
      LOCALE_CODES.map((loc) => [
        loc,
        {
          ...shared,
          name: c.name[loc] ?? "",
          intro: c.intro[loc] ?? "",
          attractions: c.attractions[loc] ?? [],
        },
      ]),
    );
    const ok = await sendPerLocale("PATCH", `/api/cities/${c.id}`, bodies);
    setSaving(false);
    toast(ok ? "Saqlandi" : "Saqlab bo'lmadi", ok ? "ok" : "error");
  }

  return (
    <>
      <div className="s-card">
        <div className="s-card__body">
          <div className="s-form">
            <LocalizedText label="Nomi" required value={c.name} onChange={(name) => patch({ name })} />
            <LocalizedText label="Tavsif" textarea value={c.intro} onChange={(intro) => patch({ intro })} />
            <div className="s-row2">
              <Field label="Davlat" required>
                <select className="s-select" value={c.country ?? ""} onChange={(e) => patch({ country: Number(e.target.value) })}>
                  {countries.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </Field>
              <Field label="Tavsiya etilgan kechalar" required>
                <input className="s-input" type="number" min={1} value={c.recommendedNights}
                  onChange={(e) => patch({ recommendedNights: Number(e.target.value) })} />
              </Field>
            </div>
            <div className="s-row2">
              <Field label="Kenglik (latitude)" help="Xarita uchun. Masalan Samarqand: 39.627">
                <input className="s-input" type="number" step="any" value={c.lat ?? ""}
                  onChange={(e) => patch({ lat: e.target.value === "" ? null : Number(e.target.value) })} />
              </Field>
              <Field label="Uzunlik (longitude)" help="Masalan Samarqand: 66.975">
                <input className="s-input" type="number" step="any" value={c.lng ?? ""}
                  onChange={(e) => patch({ lng: e.target.value === "" ? null : Number(e.target.value) })} />
              </Field>
            </div>
            <ImagePicker label="Rasm" value={c.image} onChange={(image) => patch({ image })} />
            <GalleryPicker value={c.gallery} onChange={(gallery) => patch({ gallery })} />
            <LocalizedList label="Diqqatga sazovor joylar" value={c.attractions} onChange={(attractions) => patch({ attractions })} />
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
