"use client";

import { useState } from "react";
import { Field, useToast } from "./ui";
import { LocalizedText, type LocaleMap } from "./fields";
import { saveMessage, sendPerLocale } from "@/lib/studio/save";
import { LOCALE_CODES } from "@/lib/studio/locales";
import { fieldErrors, slugTaken, slugify } from "@/lib/studio/slug";
import { fillTranslations } from "@/lib/studio/translate-client";
import { useRouter } from "next/navigation";

export type RegionInitial = {
  /** null while the record has not been created yet. */
  id: number | null;
  slug: string;
  name: LocaleMap;
};

/** The only localized field; a locale with it blank is skipped on save. */
const LOCALIZED = ["name"];

/**
 * A region is two fields — a slug and a name in eight languages — which is why
 * it was left out of the Studio and edited in the Payload admin instead. That
 * meant two panels for one job, so it lives here now like everything else.
 */
export function RegionEditor({ initial }: { initial: RegionInitial }) {
  const toast = useToast();
  const router = useRouter();
  const [r, setR] = useState<RegionInitial>(initial);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    // Every configured locale, not just the ones already filled in: a new
    // region has none, and `bodies.en` has to exist for the create below.
    // Shared fields go with the base locale only — see the note in TourEditor:
    // they are not localized, so repeating them in all eight writes is wasted
    // work, and for a relationship stored without a locale column it duplicates
    // rows.
    const bodies = Object.fromEntries(
      LOCALE_CODES.map((loc) => [
        loc,
        loc === "en"
          ? { slug: r.slug, name: r.name[loc] ?? "" }
          : { name: r.name[loc] ?? "" },
      ]),
    );
    // Creating uses the same form and the same button: the base locale is
    // posted to get an id, then the rest are written onto it exactly as on
    // any later save.
    if (r.id === null) {
      const created = await create(bodies.en as Record<string, unknown>);
      setSaving(false);
      if (created === null) return;
      const rest = Object.fromEntries(
        Object.entries(bodies).filter(([loc]) => loc !== "en"),
      );
      const { failed } = await sendPerLocale(
        "PATCH",
        `/api/regions/${created}`,
        rest,
        LOCALIZED,
      );
      toast(
        failed.length ? saveMessage(failed) : "Yaratildi",
        failed.length ? "error" : "ok",
      );
      router.replace(`/studio/regions/${created}`);
      void fillTranslations("regions", created, toast, {
        silentWhenNothingToDo: true,
      });
      return;
    }

    const { ok, failed } = await sendPerLocale(
      "PATCH",
      `/api/regions/${r.id}`,
      bodies,
      LOCALIZED,
    );
    setSaving(false);
    toast(saveMessage(failed, " — saytda ~5 daqiqada ko'rinadi"), ok ? "ok" : "error");
    // Any locale still empty is filled from the English just saved. Locales
    // that already hold text are left alone, so a correction survives.
    if (ok && r.id !== null) {
      void fillTranslations("regions", r.id, toast, {
        silentWhenNothingToDo: true,
      });
    }
  }
  /** Returns the new id, or null after reporting why it could not be made. */
  async function create(body: Record<string, unknown>): Promise<number | null> {
    // This editor shows the slug, so a typed one wins. The others derive it
    // from the title because they never ask for it.
    const slug = slugify(r.slug.trim() || (r.name.en ?? ""));
    if (!slug) {
      toast("Inglizcha nom lotin harflarida bo'lishi kerak", "error");
      return null;
    }
    if (await slugTaken("regions", slug)) {
      toast(`«${r.name.en}» nomli mintaqa allaqachon bor`, "error");
      return null;
    }
    const res = await fetch("/api/regions?locale=en", {
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
      <div className="s-card" style={{ padding: 20, maxWidth: 680 }}>
        <Field
          label="Manzil (slug)"
          required
          help="URL'da ishlatiladi. O'zgartirsangiz eski havolalar ishlamay qoladi."
        >
          <input
            className="s-input"
            value={r.slug}
            onChange={(e) => setR((v) => ({ ...v, slug: e.target.value }))}
          />
        </Field>

        <LocalizedText
          label="Nomi"
          value={r.name}
          onChange={(name) => setR((v) => ({ ...v, name }))}
        />
      </div>

      <div style={{ marginTop: 16 }}>
        <button
          type="button"
          className="s-btn s-btn--primary"
          disabled={saving}
          onClick={save}
        >
          {saving ? "Saqlanmoqda…" : "Saqlash"}
        </button>
      </div>
    </>
  );
}
