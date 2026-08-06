"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Field, useToast } from "./ui";
import { ImagePicker, type MediaRef } from "./fields";

/**
 * Creating a record, for every collection, from one component.
 *
 * The Studio could read and edit but not create, so adding a tour meant asking
 * a developer. Four bespoke pages would have been four places for the field
 * list to drift, so the shape of each form is data — the page passes a spec and
 * this renders it.
 *
 * It asks only for what Payload will refuse to create the record without.
 * Everything else belongs in the full editor, which is where the new record
 * opens the moment it exists. That is also why nothing is invented to fill a
 * required relationship: a tour needs a country and a photograph, so the form
 * asks for them rather than silently attaching the first one it finds.
 */
export type NewField =
  | { name: string; label: string; kind: "text" | "textarea" }
  | { name: string; label: string; kind: "number"; min?: number }
  | {
      name: string;
      label: string;
      kind: "select";
      options: { value: string | number; label: string }[];
    }
  | { name: string; label: string; kind: "media" };

/** Latin slug from the title, so the editor is not asked for one twice. */
function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[’‘'`´ʻʼ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function NewDoc({
  collection,
  title,
  fields,
  fixed,
  slugFrom,
}: {
  /** Payload collection slug — also the Studio route segment. */
  collection: string;
  title: string;
  fields: NewField[];
  /** Values sent with every create but never shown, e.g. a default tier. */
  fixed?: Record<string, unknown>;
  /** Which field the slug is derived from. */
  slugFrom: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [media, setMedia] = useState<Record<string, MediaRef>>({});
  const [saving, setSaving] = useState(false);

  const set = (name: string, v: unknown) =>
    setValues((prev) => ({ ...prev, [name]: v }));

  const missing = fields.filter((f) =>
    f.kind === "media"
      ? !media[f.name]?.id
      : values[f.name] === undefined ||
        values[f.name] === "" ||
        values[f.name] === null,
  );

  async function create() {
    const source = String(values[slugFrom] ?? "");
    const slug = slugify(source);
    if (!slug) {
      toast("Nom lotin harflarida bo'lishi kerak — slug hosil bo'lmadi", "error");
      return;
    }

    setSaving(true);

    // The slug is unique, and a collision comes back from the database as a
    // bare 500 with "Something went wrong" — nothing an editor can act on.
    // Asking first turns it into a sentence that names the problem.
    const taken = await fetch(
      `/api/${collection}?where[slug][equals]=${encodeURIComponent(slug)}&limit=1&depth=0`,
      { credentials: "include" },
    )
      .then((r) => (r.ok ? (r.json() as Promise<{ totalDocs?: number }>) : null))
      .then((d) => (d?.totalDocs ?? 0) > 0)
      .catch(() => false);

    if (taken) {
      setSaving(false);
      toast(`«${source}» nomli yozuv allaqachon bor — boshqa nom bering`, "error");
      return;
    }

    const body: Record<string, unknown> = { ...fixed, ...values, slug };
    for (const [name, ref] of Object.entries(media)) {
      if (ref?.id) body[name] = ref.id;
    }

    const res = await fetch(`/api/${collection}?locale=en`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    }).catch(() => null);

    if (!res?.ok) {
      // Payload names the offending fields; showing them beats "could not save".
      let detail = "";
      try {
        const data = (await res?.json()) as {
          errors?: { data?: { errors?: { path: string }[] } }[];
        };
        const inner = data?.errors?.[0]?.data?.errors ?? [];
        detail = inner.map((e) => e.path).join(", ");
      } catch {
        /* keep the generic message */
      }
      setSaving(false);
      toast(
        detail ? `Yaratilmadi — tekshiring: ${detail}` : "Yaratilmadi",
        "error",
      );
      return;
    }

    const data = (await res.json()) as { doc?: { id: number } };
    const id = data?.doc?.id;
    toast("Yaratildi — endi to'liq tahrirlashingiz mumkin");
    // Straight into the real editor: this form deliberately holds only the
    // required minimum, and everything else lives there.
    router.push(`/studio/${collection}/${id}`);
  }

  return (
    <div className="s-card" style={{ padding: 24, maxWidth: 680 }}>
      <h2 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 600 }}>
        {title}
      </h2>
      <p
        style={{
          margin: "0 0 20px",
          color: "var(--s-fg-secondary)",
          fontSize: 13.5,
        }}
      >
        Faqat majburiy maydonlar. Saqlagandan keyin to&apos;liq tahrir sahifasi
        ochiladi.
      </p>

      {fields.map((f) => {
        if (f.kind === "media") {
          return (
            <ImagePicker
              key={f.name}
              label={f.label}
              value={media[f.name] ?? null}
              onChange={(v) => setMedia((m) => ({ ...m, [f.name]: v }))}
            />
          );
        }
        return (
          <Field key={f.name} label={f.label} required>
            {f.kind === "textarea" ? (
              <textarea
                className="s-input"
                rows={3}
                value={String(values[f.name] ?? "")}
                onChange={(e) => set(f.name, e.target.value)}
              />
            ) : f.kind === "select" ? (
              <select
                className="s-select"
                value={String(values[f.name] ?? "")}
                onChange={(e) =>
                  set(
                    f.name,
                    typeof f.options[0]?.value === "number"
                      ? Number(e.target.value)
                      : e.target.value,
                  )
                }
              >
                <option value="">— tanlang —</option>
                {f.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                className="s-input"
                type={f.kind === "number" ? "number" : "text"}
                min={f.kind === "number" ? f.min : undefined}
                value={String(values[f.name] ?? "")}
                onChange={(e) =>
                  set(
                    f.name,
                    f.kind === "number"
                      ? e.target.value === ""
                        ? ""
                        : Number(e.target.value)
                      : e.target.value,
                  )
                }
              />
            )}
          </Field>
        );
      })}

      <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
        <button
          type="button"
          className="s-btn s-btn--primary"
          disabled={saving || missing.length > 0}
          onClick={create}
        >
          {saving ? "Yaratilmoqda…" : "Yaratish"}
        </button>
        <button
          type="button"
          className="s-btn"
          onClick={() => router.push(`/studio/${collection}`)}
        >
          Bekor qilish
        </button>
      </div>
      {missing.length > 0 && (
        <p
          style={{
            marginTop: 10,
            fontSize: 12.5,
            color: "var(--s-fg-muted)",
          }}
        >
          To&apos;ldirilmagan: {missing.map((f) => f.label).join(", ")}
        </p>
      )}
    </div>
  );
}
