"use client";

import { useState } from "react";
import { Field, useToast } from "./ui";
import { LocalizedText, type LocaleMap } from "./fields";
import { saveMessage, sendPerLocale } from "@/lib/studio/save";

export type RegionInitial = {
  id: number;
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
  const [r, setR] = useState<RegionInitial>(initial);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const bodies = Object.fromEntries(
      Object.keys(r.name).map((loc) => [
        loc,
        { slug: r.slug, name: r.name[loc] ?? "" },
      ]),
    );
    const { ok, failed } = await sendPerLocale(
      "PATCH",
      `/api/regions/${r.id}`,
      bodies,
      LOCALIZED,
    );
    setSaving(false);
    toast(saveMessage(failed, " — saytda ~5 daqiqada ko'rinadi"), ok ? "ok" : "error");
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
