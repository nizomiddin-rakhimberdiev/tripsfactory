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
import { saveMessage, sendPerLocale } from "@/lib/studio/save";
import { fieldErrors, slugTaken, slugify } from "@/lib/studio/slug";
import { fillTranslations } from "@/lib/studio/translate-client";
import { useRouter } from "next/navigation";
import { LOCALE_CODES } from "@/lib/studio/locales";
import { IconCheck } from "./icons";
import { GalleryPicker, type GalleryItem } from "./GalleryPicker";

export type ExcursionInitial = {
  /** null while the record has not been created yet. */
  id: number | null;
  city: number | null;
  durationHours: number;
  priceUsd: number;
  published: boolean;
  heroImage: MediaRef;
  gallery: GalleryItem[];
  title: LocaleMap;
  description: LocaleMap;
  included: Record<string, { text: string }[]>;
};

/** Fields stored per locale; a locale with none of them filled in is not written. */
const LOCALIZED = ["title", "description", "included"];

export function ExcursionEditor({
  initial,
  cities,
}: {
  initial: ExcursionInitial;
  cities: { id: number; name: string }[];
}) {
  const toast = useToast();
  const router = useRouter();
  const [e, setE] = useState<ExcursionInitial>(initial);
  const [saving, setSaving] = useState(false);
  const patch = (p: Partial<ExcursionInitial>) => setE((v) => ({ ...v, ...p }));

  async function save() {
    setSaving(true);
    const shared = {
      city: e.city,
      durationHours: e.durationHours,
      priceUsd: e.priceUsd,
      published: e.published,
      heroImage: e.heroImage?.id ?? null,
      gallery: e.gallery,
    };
    // Shared fields go with the base locale only — they are not localized, so
    // repeating them in all eight writes is wasted work, and for a
    // relationship stored without a locale column it duplicates rows.
    const localized = (loc: string) => ({
      title: e.title[loc] ?? "",
      description: e.description[loc] ?? "",
      included: e.included[loc] ?? [],
    });
    const bodies = Object.fromEntries(
      LOCALE_CODES.map((loc) => [
        loc,
        loc === "en" ? { ...shared, ...localized(loc) } : localized(loc),
      ]),
    );
    // Creating uses the same form and the same button: the base locale is
    // posted to get an id, then the rest are written onto it exactly as on
    // any later save.
    if (e.id === null) {
      const created = await create(bodies.en as Record<string, unknown>);
      setSaving(false);
      if (created === null) return;
      const rest = Object.fromEntries(
        Object.entries(bodies).filter(([loc]) => loc !== "en"),
      );
      const { failed } = await sendPerLocale(
        "PATCH",
        `/api/excursions/${created}`,
        rest,
        LOCALIZED,
      );
      toast(
        failed.length ? saveMessage(failed) : "Yaratildi",
        failed.length ? "error" : "ok",
      );
      router.replace(`/studio/excursions/${created}`);
      void fillTranslations("excursions", created, toast, {
        silentWhenNothingToDo: true,
      });
      return;
    }

    const { ok, failed } = await sendPerLocale(
      "PATCH",
      `/api/excursions/${e.id}`,
      bodies,
      LOCALIZED,
    );
    setSaving(false);
    toast(saveMessage(failed), ok ? "ok" : "error");
    // Any locale still empty is filled from the English just saved. Locales
    // that already hold text are left alone, so a correction survives.
    if (ok && e.id !== null) {
      void fillTranslations("excursions", e.id, toast, {
        silentWhenNothingToDo: true,
      });
    }
  }

  /** Returns the new id, or null after reporting why it could not be made. */
  async function create(body: Record<string, unknown>): Promise<number | null> {
    const slug = slugify(e.title.en ?? "");
    if (!slug) {
      toast("Inglizcha nom lotin harflarida bo'lishi kerak", "error");
      return null;
    }
    if (await slugTaken("excursions", slug)) {
      toast(`«${e.title.en}» nomli ekskursiya allaqachon bor`, "error");
      return null;
    }
    const res = await fetch("/api/excursions?locale=en", {
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
            <LocalizedText
              label="Nomi"
              required
              value={e.title}
              onChange={(title) => patch({ title })}
            />
            <LocalizedText
              label="Tavsif"
              textarea
              value={e.description}
              onChange={(description) => patch({ description })}
            />
            <div className="s-row2">
              <Field label="Shahar" required>
                <select
                  className="s-select"
                  value={e.city ?? ""}
                  onChange={(ev) => patch({ city: Number(ev.target.value) })}
                >
                  {/* Without this an unset city silently submits the first one
                      in the list — a Bukhara excursion filed under Andijan. */}
                  <option value="">— tanlang —</option>
                  {cities.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Davomiyligi (soat)" required>
                <input
                  className="s-input"
                  type="number"
                  min={1}
                  value={e.durationHours}
                  onChange={(ev) =>
                    patch({ durationHours: Number(ev.target.value) })
                  }
                />
              </Field>
            </div>
            <Field
              label="Narxi (USD, kishiga)"
              required
              help="Bir kishi uchun to'liq narx."
            >
              <input
                className="s-input"
                type="number"
                min={0}
                value={e.priceUsd}
                onChange={(ev) => patch({ priceUsd: Number(ev.target.value) })}
              />
            </Field>
            <label className="s-check">
              <input
                type="checkbox"
                checked={e.published}
                onChange={(ev) => patch({ published: ev.target.checked })}
              />
              Saytda ko&apos;rsatilsin
            </label>
            <ImagePicker
              label="Asosiy rasm"
              value={e.heroImage}
              onChange={(heroImage) => patch({ heroImage })}
            />
            <GalleryPicker
              value={e.gallery}
              onChange={(gallery) => patch({ gallery })}
            />
            <LocalizedList
              label="Narxga kiradi"
              value={e.included}
              onChange={(included) => patch({ included })}
            />
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
