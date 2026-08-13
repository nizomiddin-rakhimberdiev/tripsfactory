"use client";

import { useState } from "react";
import { Field, useToast } from "./ui";
import { ImagePicker, LocalizedText, type LocaleMap, type MediaRef } from "./fields";
import { saveMessage, sendPerLocale } from "@/lib/studio/save";
import { LOCALE_CODES } from "@/lib/studio/locales";
import { IconCheck } from "./icons";

type Hero = { image: MediaRef; title: LocaleMap; subtitle: LocaleMap };

export type Booking = { paymentUrl: string; venue: string };

export function ContentEditor({
  initialHero,
  initialPremium,
  initialBooking,
}: {
  initialHero: Hero;
  initialPremium: Hero;
  initialBooking: Booking;
}) {
  const toast = useToast();
  const [hero, setHero] = useState<Hero>(initialHero);
  const [premium, setPremium] = useState<Hero>(initialPremium);
  const [booking, setBooking] = useState<Booking>(initialBooking);
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
          // Not localized — a link and an address are the same in every
          // language — so they ride along with each write unchanged.
          booking: {
            paymentUrl: booking.paymentUrl.trim(),
            venue: booking.venue.trim(),
          },
        },
      ]),
    );
    // The global always exists in every locale, so every locale is written.
    const { ok, failed } = await sendPerLocale("POST", "/api/globals/site-content", bodies);
    setSaving(false);
    toast(saveMessage(failed, " — saytda ~5 daqiqada ko'rinadi"), ok ? "ok" : "error");
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

        <div className="s-card">
          <div className="s-card__body">
            <div className="s-section-title" style={{ margin: "0 0 16px" }}>
              Bron va to&apos;lov
            </div>
            <div className="s-form">
              <Field
                label="To'lov havolasi"
                help="Masterklassga so'rov kelganda mijozga shu havola bilan xat ketadi. Bo'sh qolsa xatda «to'lov ma'lumotlarini tez orada yuboramiz» deb yoziladi."
              >
                <input
                  className="s-input"
                  value={booking.paymentUrl}
                  placeholder="https://..."
                  onChange={(e) =>
                    setBooking({ ...booking, paymentUrl: e.target.value })
                  }
                />
              </Field>
              <Field
                label="Masterklass manzili"
                help="To'lov tasdiqlangach yuboriladigan xatda ko'rsatiladi."
              >
                <input
                  className="s-input"
                  value={booking.venue}
                  placeholder="Toshkent, ..."
                  onChange={(e) =>
                    setBooking({ ...booking, venue: e.target.value })
                  }
                />
              </Field>
            </div>
          </div>
        </div>
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
