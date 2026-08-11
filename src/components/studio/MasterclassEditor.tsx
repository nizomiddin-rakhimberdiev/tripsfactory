"use client";

import { useState } from "react";
import { useToast, Field } from "./ui";
import {
  ImagePicker,
  LocalizedText,
  LocalizedList,
  LocalizedReviews,
  type LocaleMap,
  type MediaRef,
} from "./fields";
import { saveMessage, sendPerLocale } from "@/lib/studio/save";
import { fieldErrors, slugTaken, slugify } from "@/lib/studio/slug";
import { fillTranslations } from "@/lib/studio/translate-client";
import { useRouter } from "next/navigation";
import { LOCALE_CODES } from "@/lib/studio/locales";
import { IconCheck, IconPlus, IconTrash } from "./icons";
import { GalleryPicker, type GalleryItem } from "./GalleryPicker";

export type Session = { date: string; capacity: number; booked: number };
export type Review = { author: string; text: string };

export type MasterclassInitial = {
  /** null while the record has not been created yet. */
  id: number | null;
  city: number | null;
  durationHours: number;
  priceUsd: number;
  youtubeUrl: string;
  published: boolean;
  heroImage: MediaRef;
  gallery: GalleryItem[];
  title: LocaleMap;
  tagline: LocaleMap;
  summary: LocaleMap;
  description: LocaleMap;
  included: Record<string, { text: string }[]>;
  reviews: Record<string, Review[]>;
  sessions: Session[];
};

/** Fields stored per locale; a locale with none of them filled in is not written. */
const LOCALIZED = [
  "title",
  "tagline",
  "summary",
  "description",
  "included",
  "reviews",
];

export function MasterclassEditor({
  initial,
  cities,
}: {
  initial: MasterclassInitial;
  cities: { id: number; name: string }[];
}) {
  const toast = useToast();
  const router = useRouter();
  const [m, setM] = useState<MasterclassInitial>(initial);
  const [saving, setSaving] = useState(false);
  const patch = (p: Partial<MasterclassInitial>) =>
    setM((v) => ({ ...v, ...p }));

  async function save() {
    setSaving(true);
    const shared = {
      city: m.city,
      durationHours: m.durationHours,
      priceUsd: m.priceUsd,
      youtubeUrl: m.youtubeUrl.trim(),
      published: m.published,
      heroImage: m.heroImage?.id ?? null,
      gallery: m.gallery,
      // Sessions are dates and seat counts — identical in every language, so
      // they travel with the base locale like every other shared field.
      sessions: m.sessions.filter((s) => s.date),
    };
    const localized = (loc: string) => ({
      title: m.title[loc] ?? "",
      tagline: m.tagline[loc] ?? "",
      summary: m.summary[loc] ?? "",
      description: m.description[loc] ?? "",
      included: m.included[loc] ?? [],
      reviews: m.reviews[loc] ?? [],
    });
    const bodies = Object.fromEntries(
      LOCALE_CODES.map((loc) => [
        loc,
        loc === "en" ? { ...shared, ...localized(loc) } : localized(loc),
      ]),
    );

    if (m.id === null) {
      const created = await create(bodies.en as Record<string, unknown>);
      setSaving(false);
      if (created === null) return;
      const rest = Object.fromEntries(
        Object.entries(bodies).filter(([loc]) => loc !== "en"),
      );
      const { failed } = await sendPerLocale(
        "PATCH",
        `/api/masterclasses/${created}`,
        rest,
        LOCALIZED,
      );
      toast(
        failed.length ? saveMessage(failed) : "Yaratildi",
        failed.length ? "error" : "ok",
      );
      router.replace(`/studio/masterclasses/${created}`);
      void fillTranslations("masterclasses", created, toast, {
        silentWhenNothingToDo: true,
      });
      return;
    }

    const { ok, failed } = await sendPerLocale(
      "PATCH",
      `/api/masterclasses/${m.id}`,
      bodies,
      LOCALIZED,
    );
    setSaving(false);
    toast(saveMessage(failed), ok ? "ok" : "error");
    if (ok && m.id !== null) {
      void fillTranslations("masterclasses", m.id, toast, {
        silentWhenNothingToDo: true,
      });
    }
  }

  /** Returns the new id, or null after reporting why it could not be made. */
  async function create(body: Record<string, unknown>): Promise<number | null> {
    const slug = slugify(m.title.en ?? "");
    if (!slug) {
      toast("Inglizcha nom lotin harflarida bo'lishi kerak", "error");
      return null;
    }
    if (await slugTaken("masterclasses", slug)) {
      toast(`«${m.title.en}» nomli masterklass allaqachon bor`, "error");
      return null;
    }
    const res = await fetch("/api/masterclasses?locale=en", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ ...body, slug }),
    }).catch(() => null);
    if (!res?.ok) {
      const detail = await fieldErrors(res);
      toast(
        detail ? `Yaratilmadi — to'ldiring: ${detail}` : "Yaratilmadi",
        "error",
      );
      return null;
    }
    const data = (await res.json()) as { doc?: { id: number } };
    return data.doc?.id ?? null;
  }

  const setSession = (i: number, next: Partial<Session>) => {
    const list = [...m.sessions];
    list[i] = { ...list[i], ...next };
    patch({ sessions: list });
  };

  return (
    <>
      <div className="s-card">
        <div className="s-card__body">
          <div className="s-form">
            <LocalizedText
              label="Nomi"
              required
              value={m.title}
              onChange={(title) => patch({ title })}
            />
            <LocalizedText
              label="Qisqa shior"
              value={m.tagline}
              onChange={(tagline) => patch({ tagline })}
            />
            <LocalizedText
              label="Qisqa tavsif (katalog kartasi)"
              textarea
              value={m.summary}
              onChange={(summary) => patch({ summary })}
            />
            <LocalizedText
              label="To'liq tavsif"
              textarea
              value={m.description}
              onChange={(description) => patch({ description })}
            />

            <div className="s-row2">
              <Field label="Shahar" required>
                <select
                  className="s-select"
                  value={m.city ?? ""}
                  onChange={(e) => patch({ city: Number(e.target.value) })}
                >
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
                  value={m.durationHours}
                  onChange={(e) =>
                    patch({ durationHours: Number(e.target.value) })
                  }
                />
              </Field>
            </div>

            <Field label="Narxi (USD, kishiga)" required>
              <input
                className="s-input"
                type="number"
                min={0}
                value={m.priceUsd}
                onChange={(e) => patch({ priceUsd: Number(e.target.value) })}
              />
            </Field>

            <Field
              label="YouTube havolasi"
              help="Videoning oddiy havolasini qo'ying (youtube.com/watch?v=… yoki youtu.be/…). Bo'sh qolsa video ko'rsatilmaydi."
            >
              <input
                className="s-input"
                value={m.youtubeUrl}
                placeholder="https://www.youtube.com/watch?v=..."
                onChange={(e) => patch({ youtubeUrl: e.target.value })}
              />
            </Field>

            <label className="s-check">
              <input
                type="checkbox"
                checked={m.published}
                onChange={(e) => patch({ published: e.target.checked })}
              />
              Saytda ko&apos;rsatilsin
            </label>

            <ImagePicker
              label="Asosiy rasm"
              value={m.heroImage}
              onChange={(heroImage) => patch({ heroImage })}
            />
            <GalleryPicker
              value={m.gallery}
              onChange={(gallery) => patch({ gallery })}
            />

            <Field
              label="Patoklar"
              help="Saytda eng yaqin, hali to'lmagan patok ko'rinadi. To'lgani avtomatik o'tkazib yuboriladi."
            >
              <div className="s-repeat">
                {m.sessions.map((s, i) => (
                  <div key={i} className="s-departure-row">
                    <input
                      className="s-input"
                      type="date"
                      value={s.date?.slice(0, 10) ?? ""}
                      onChange={(e) => setSession(i, { date: e.target.value })}
                    />
                    <input
                      className="s-input"
                      type="number"
                      min={1}
                      placeholder="Joylar"
                      value={s.capacity}
                      onChange={(e) =>
                        setSession(i, { capacity: Number(e.target.value) })
                      }
                    />
                    <input
                      className="s-input"
                      type="number"
                      min={0}
                      placeholder="Band"
                      value={s.booked}
                      onChange={(e) =>
                        setSession(i, { booked: Number(e.target.value) })
                      }
                    />
                    <button
                      type="button"
                      className="s-btn s-btn--icon s-btn--danger"
                      aria-label="Patokni o'chirish"
                      onClick={() =>
                        patch({
                          sessions: m.sessions.filter((_, j) => j !== i),
                        })
                      }
                    >
                      <IconTrash />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="s-btn s-btn--sm"
                  onClick={() =>
                    patch({
                      sessions: [
                        ...m.sessions,
                        { date: "", capacity: 12, booked: 0 },
                      ],
                    })
                  }
                >
                  <IconPlus /> Patok qo&apos;shish
                </button>
              </div>
            </Field>

            <LocalizedList
              label="Narxga kiradi"
              value={m.included}
              onChange={(included) => patch({ included })}
            />
            <LocalizedReviews
              value={m.reviews}
              onChange={(reviews) => patch({ reviews })}
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
