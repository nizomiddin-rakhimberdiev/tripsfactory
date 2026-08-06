"use client";

import { useState } from "react";
import { useToast, Field } from "./ui";
import {
  ImagePicker,
  LocalizedText,
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

export type CountryInitial = {
  /** null while the record has not been created yet. */
  id: number | null;
  region: number | null;
  published: boolean;
  heroImage: MediaRef;
  gallery: GalleryItem[];
  name: LocaleMap;
  intro: LocaleMap;
  body: LocaleMap;
};

/** Fields stored per locale; a locale with none of them filled in is not written. */
const LOCALIZED = ["name", "intro", "body"];

export function CountryEditor({
  initial,
  regions,
}: {
  initial: CountryInitial;
  regions: { id: number; name: string }[];
}) {
  const toast = useToast();
  const router = useRouter();
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
    // Creating uses the same form and the same button: the base locale is
    // posted to get an id, then the rest are written onto it exactly as on
    // any later save.
    if (c.id === null) {
      const created = await create(bodies.en as Record<string, unknown>);
      setSaving(false);
      if (created === null) return;
      const rest = Object.fromEntries(
        Object.entries(bodies).filter(([loc]) => loc !== "en"),
      );
      const { failed } = await sendPerLocale(
        "PATCH",
        `/api/countries/${created}`,
        rest,
        LOCALIZED,
      );
      toast(
        failed.length ? saveMessage(failed) : "Yaratildi",
        failed.length ? "error" : "ok",
      );
      router.replace(`/studio/countries/${created}`);
      // Not awaited: the record exists and the editor should not sit on a
      // spinner while eight languages are written.
      void fillTranslations("countries", created, toast, {
        silentWhenNothingToDo: true,
      });
      return;
    }

    const { ok, failed } = await sendPerLocale("PATCH", `/api/countries/${c.id}`, bodies, LOCALIZED);
    setSaving(false);
    toast(saveMessage(failed, " — saytda ~5 daqiqada ko'rinadi"), ok ? "ok" : "error");
    // Any locale still empty is filled from the English just saved. Locales
    // that already hold text are left alone, so a correction survives.
    if (ok && c.id !== null) {
      void fillTranslations("countries", c.id, toast, {
        silentWhenNothingToDo: true,
      });
    }
  }
  /** Returns the new id, or null after reporting why it could not be made. */
  async function create(body: Record<string, unknown>): Promise<number | null> {
    const slug = slugify(c.name.en ?? "");
    if (!slug) {
      toast("Inglizcha nom lotin harflarida bo'lishi kerak", "error");
      return null;
    }
    if (await slugTaken("countries", slug)) {
      toast(`«${c.name.en}» nomli davlat allaqachon bor`, "error");
      return null;
    }
    const res = await fetch("/api/countries?locale=en", {
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
                  Saytda ko&apos;rsatilsin
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
