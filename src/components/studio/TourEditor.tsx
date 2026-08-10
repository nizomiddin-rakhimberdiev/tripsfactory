"use client";

import { useState } from "react";
import { useToast, Field } from "./ui";
import {
  ImagePicker,
  LocalizedText,
  LocalizedList,
  LocalizedItinerary,
  type LocaleMap,
  type MediaRef,
} from "./fields";
import { saveMessage, sendPerLocale } from "@/lib/studio/save";
import { fieldErrors, slugTaken, slugify } from "@/lib/studio/slug";
import { fillTranslations } from "@/lib/studio/translate-client";
import { useRouter } from "next/navigation";
import { LOCALE_CODES } from "@/lib/studio/locales";
import { IconCheck, IconExternal, IconPlus, IconTrash } from "./icons";
import { RoutePicker } from "./RoutePicker";
import { GalleryPicker, type GalleryItem } from "./GalleryPicker";
import type { RoutePoint } from "@/lib/content/types";

type Departure = { date: string; priceUsd: number; status: string };
export type TourInitial = {
  /** null while the tour has not been created yet. */
  id: number | null;
  slug: string;
  type: string;
  tier: string;
  durationDays: number;
  priceFromUsd: number | null;
  singleSupplementUsd: number | null;
  featured: boolean;
  published: boolean;
  country: number | null;
  cities: number[];
  heroImage: MediaRef;
  title: LocaleMap;
  summary: LocaleMap;
  itinerary: Record<string, { title: string; description: string }[]>;
  included: Record<string, { text: string }[]>;
  excluded: Record<string, { text: string }[]>;
  departures: Departure[];
  route: RoutePoint[];
  gallery: GalleryItem[];
};
type Option = { id: number; name: string };

const TYPES = [
  { value: "group", label: "Guruh turi" },
  { value: "private", label: "Individual tur" },
  { value: "custom", label: "Buyurtma tur" },
];
const TIERS = [
  { value: "standard", label: "Oddiy" },
  { value: "premium", label: "Premium" },
];
const DEP_STATUS = [
  { value: "available", label: "Mavjud" },
  { value: "guaranteed", label: "Kafolatlangan" },
  { value: "soldout", label: "Sotilgan" },
];

/** Fields stored per locale; a locale with none of them filled in is not written. */
const LOCALIZED = ["title", "summary", "itinerary", "included", "excluded"];

export function TourEditor({
  initial,
  countries,
  cities,
  previewUrl,
}: {
  initial: TourInitial;
  countries: Option[];
  cities: Option[];
  previewUrl: string;
}) {
  const toast = useToast();
  const router = useRouter();
  const [t, setT] = useState<TourInitial>(initial);
  const [saving, setSaving] = useState(false);
  const patch = (p: Partial<TourInitial>) => setT((v) => ({ ...v, ...p }));

  async function save() {
    setSaving(true);
    const shared = {
      type: t.type,
      tier: t.tier,
      durationDays: t.durationDays,
      priceFromUsd: t.priceFromUsd,
      singleSupplementUsd: t.singleSupplementUsd,
      featured: t.featured,
      published: t.published,
      country: t.country,
      cities: t.cities,
      heroImage: t.heroImage?.id ?? null,
      departures: t.departures,
      route: t.route,
      gallery: t.gallery,
    };
    // Shared fields go with the base locale only.
    //
    // They are not localized — country, cities, photo, dates, map — so
    // repeating them in all eight writes is at best wasted work and at worst
    // destructive: `cities` is a relationship stored in a flat table with no
    // locale column, and sending it eight times left one tour with the same
    // city listed four times. The other locales carry only what actually
    // differs between them.
    const localized = (loc: string) => ({
          title: t.title[loc] ?? "",
          summary: t.summary[loc] ?? "",
          itinerary: t.itinerary[loc] ?? [],
          included: t.included[loc] ?? [],
          excluded: t.excluded[loc] ?? [],
    });
    const bodies = Object.fromEntries(
      LOCALE_CODES.map((loc) => [
        loc,
        loc === "en" ? { ...shared, ...localized(loc) } : localized(loc),
      ]),
    );
    // A tour that does not exist yet is created from the base locale, then the
    // other seven are written onto it exactly as they are on every later save.
    // Same form, same fields, one button — the alternative was a second,
    // shorter form that looked nothing like this one.
    if (t.id === null) {
      const created = await create(bodies.en as Record<string, unknown>);
      setSaving(false);
      if (created === null) return;
      const rest = Object.fromEntries(
        Object.entries(bodies).filter(([loc]) => loc !== "en"),
      );
      const { failed } = await sendPerLocale(
        "PATCH",
        `/api/tours/${created}`,
        rest,
        LOCALIZED,
      );
      toast(
        failed.length
          ? saveMessage(failed)
          : "Yaratildi — saytda ~5 daqiqada ko'rinadi",
        failed.length ? "error" : "ok",
      );
      router.replace(`/studio/tours/${created}`);
      void fillTranslations("tours", created, toast, {
        silentWhenNothingToDo: true,
      });
      return;
    }

    const { ok, failed } = await sendPerLocale("PATCH", `/api/tours/${t.id}`, bodies, LOCALIZED);
    setSaving(false);
    toast(saveMessage(failed, " — saytda ~5 daqiqada ko'rinadi"), ok ? "ok" : "error");
    // Any locale still empty is filled from the English just saved. Locales
    // that already hold text are left alone, so a correction survives.
    if (ok && t.id !== null) {
      void fillTranslations("tours", t.id, toast, {
        silentWhenNothingToDo: true,
      });
    }
  }

  /** Returns the new id, or null after reporting why it could not be made. */
  async function create(body: Record<string, unknown>): Promise<number | null> {
    const slug = slugify(t.title.en ?? "");
    if (!slug) {
      toast("Inglizcha nom lotin harflarida bo'lishi kerak", "error");
      return null;
    }
    if (await slugTaken("tours", slug)) {
      toast(`«${t.title.en}» nomli tur allaqachon bor`, "error");
      return null;
    }
    const res = await fetch("/api/tours?locale=en", {
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

  const toggleCity = (id: number) =>
    patch({
      cities: t.cities.includes(id)
        ? t.cities.filter((c) => c !== id)
        : [...t.cities, id],
    });

  return (
    <>
      <div className="s-form">
        <div className="s-card">
          <div className="s-card__body">
            <div className="s-form">
              <LocalizedText label="Tur nomi" required value={t.title} onChange={(title) => patch({ title })} />
              <LocalizedText label="Qisqa tavsif" textarea value={t.summary} onChange={(summary) => patch({ summary })} />
              <ImagePicker label="Asosiy rasm" value={t.heroImage} onChange={(heroImage) => patch({ heroImage })} />
              <GalleryPicker value={t.gallery} onChange={(gallery) => patch({ gallery })} />
            </div>
          </div>
        </div>

        <div className="s-card">
          <div className="s-card__body">
            <div className="s-section-title" style={{ margin: "0 0 16px" }}>Asosiy ma&apos;lumotlar</div>
            <div className="s-form">
              <div className="s-row2">
                <Field label="Turi" required>
                  <select className="s-select" value={t.type} onChange={(e) => patch({ type: e.target.value })}>
                    {TYPES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </Field>
                <Field label="Daraja" required help="Premium turlar alohida Premium bo'limida chiqadi.">
                  <select className="s-select" value={t.tier} onChange={(e) => patch({ tier: e.target.value })}>
                    {TIERS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </Field>
              </div>
              <div className="s-row3">
                <Field label="Davomiyligi (kun)" required>
                  <input className="s-input" type="number" min={1} value={t.durationDays}
                    onChange={(e) => patch({ durationDays: Number(e.target.value) })} />
                </Field>
                <Field label="Narxi (USD, dan)" help="Premium 'so'rov bo'yicha' — bo'sh qoldiring.">
                  <input className="s-input" type="number" value={t.priceFromUsd ?? ""}
                    onChange={(e) => patch({ priceFromUsd: e.target.value === "" ? null : Number(e.target.value) })} />
                </Field>
                <Field label="Yakka joy qo'shimchasi (USD)">
                  <input className="s-input" type="number" value={t.singleSupplementUsd ?? ""}
                    onChange={(e) => patch({ singleSupplementUsd: e.target.value === "" ? null : Number(e.target.value) })} />
                </Field>
              </div>
              <Field label="Davlat" required>
                <select className="s-select" value={t.country ?? ""} onChange={(e) => patch({ country: Number(e.target.value) })}>
                  {countries.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
              <Field label="Shaharlar">
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {cities.map((c) => (
                    <button key={c.id} type="button"
                      className={`s-locale-tab ${t.cities.includes(c.id) ? "s-locale-tab--active" : ""}`}
                      style={{ padding: "6px 12px", fontSize: 13 }}
                      onClick={() => toggleCity(c.id)}>
                      {c.name}
                    </button>
                  ))}
                </div>
              </Field>
              <div style={{ display: "flex", gap: 24 }}>
                <label className="s-check">
                  <input type="checkbox" checked={t.featured} onChange={(e) => patch({ featured: e.target.checked })} />
                  Bosh sahifada ko&apos;rsatilsin
                </label>
                <label className="s-check">
                  <input type="checkbox" checked={t.published} onChange={(e) => patch({ published: e.target.checked })} />
                  Saytda ko&apos;rsatilsin
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="s-card">
          <div className="s-card__body">
            <div className="s-section-title" style={{ margin: "0 0 14px" }}>
              Xarita marshruti
            </div>
            <RoutePicker value={t.route} onChange={(route) => patch({ route })} />
          </div>
        </div>

        <div className="s-card">
          <div className="s-card__body">
            <LocalizedItinerary value={t.itinerary} onChange={(itinerary) => patch({ itinerary })} />
          </div>
        </div>

        <div className="s-card">
          <div className="s-card__body">
            <div className="s-row2">
              <LocalizedList label="Narxga kiradi" value={t.included} onChange={(included) => patch({ included })} />
              <LocalizedList label="Narxga kirmaydi" value={t.excluded} onChange={(excluded) => patch({ excluded })} />
            </div>
          </div>
        </div>

        <div className="s-card">
          <div className="s-card__body">
            <Field label="Jo'nash sanalari va narxlar">
              <div className="s-repeat">
                {t.departures.map((d, i) => (
                  <div
                    key={i}
                    className="s-departure-row"
                  >
                    <input className="s-input" type="date" value={d.date?.slice(0, 10) ?? ""}
                      onChange={(e) => {
                        const next = [...t.departures]; next[i] = { ...d, date: e.target.value }; patch({ departures: next });
                      }} />
                    <input className="s-input" type="number" placeholder="Narx" value={d.priceUsd}
                      onChange={(e) => {
                        const next = [...t.departures]; next[i] = { ...d, priceUsd: Number(e.target.value) }; patch({ departures: next });
                      }} />
                    <select className="s-select" value={d.status}
                      onChange={(e) => {
                        const next = [...t.departures]; next[i] = { ...d, status: e.target.value }; patch({ departures: next });
                      }}>
                      {DEP_STATUS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                    <button type="button" className="s-btn s-btn--icon s-btn--danger"
                      onClick={() => patch({ departures: t.departures.filter((_, j) => j !== i) })}>
                      <IconTrash />
                    </button>
                  </div>
                ))}
                <button type="button" className="s-btn s-btn--sm"
                  onClick={() => patch({ departures: [...t.departures, { date: "", priceUsd: 0, status: "available" }] })}>
                  <IconPlus /> Sana qo&apos;shish
                </button>
              </div>
            </Field>
          </div>
        </div>
      </div>

      <div className="s-savebar">
        <a className="s-btn" href={previewUrl} target="_blank" rel="noreferrer">
          <IconExternal /> Saytda ko&apos;rish
        </a>
        <div className="s-savebar__spacer" />
        <button className="s-btn s-btn--primary" onClick={save} disabled={saving}>
          {saving ? <span className="s-spin" /> : <IconCheck />} Saqlash
        </button>
      </div>
    </>
  );
}
