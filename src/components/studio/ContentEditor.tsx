"use client";

import { useState } from "react";
import { useToast } from "./ui";
import { ImagePicker, LocalizedText, type LocaleMap, type MediaRef } from "./fields";
import { sendPerLocale } from "@/lib/studio/save";
import { LOCALE_CODES } from "@/lib/studio/locales";
import { IconCheck } from "./icons";

type Hero = { image: MediaRef; title: LocaleMap; subtitle: LocaleMap };

export function ContentEditor({
  initialHero,
  initialPremium,
}: {
  initialHero: Hero;
  initialPremium: Hero;
}) {
  const toast = useToast();
  const [hero, setHero] = useState<Hero>(initialHero);
  const [premium, setPremium] = useState<Hero>(initialPremium);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const bodies = Object.fromEntries(
      LOCALE_CODES.map((loc) => [
        loc,
        {
          hero: {
            image: hero.image?.id ?? null,
            title: hero.title[loc] ?? "",
            subtitle: hero.subtitle[loc] ?? "",
          },
          premiumHero: {
            image: premium.image?.id ?? null,
            title: premium.title[loc] ?? "",
            subtitle: premium.subtitle[loc] ?? "",
          },
        },
      ]),
    );
    const ok = await sendPerLocale("POST", "/api/globals/site-content", bodies);
    setSaving(false);
    toast(ok ? "Saqlandi — saytda ~5 daqiqada ko'rinadi" : "Saqlab bo'lmadi", ok ? "ok" : "error");
  }

  const block = (
    title: string,
    v: Hero,
    set: (h: Hero) => void,
  ) => (
    <div className="s-card">
      <div className="s-card__body">
        <div className="s-section-title" style={{ margin: "0 0 16px" }}>
          {title}
        </div>
        <div className="s-form">
          <ImagePicker
            label="Rasm"
            value={v.image}
            onChange={(image) => set({ ...v, image })}
          />
          <LocalizedText
            label="Sarlavha"
            required
            value={v.title}
            onChange={(title) => set({ ...v, title })}
          />
          <LocalizedText
            label="Tagsarlavha"
            textarea
            value={v.subtitle}
            onChange={(subtitle) => set({ ...v, subtitle })}
          />
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {block("Bosh sahifa hero", hero, setHero)}
        {block("Premium hero", premium, setPremium)}
      </div>
      <div className="s-savebar">
        <span className="s-savebar__status">
          8 tilni til tugmalari orqali alohida tahrirlang
        </span>
        <div className="s-savebar__spacer" />
        <button
          className="s-btn s-btn--primary"
          onClick={save}
          disabled={saving}
        >
          {saving ? <span className="s-spin" /> : <IconCheck />}
          Saqlash
        </button>
      </div>
    </>
  );
}
