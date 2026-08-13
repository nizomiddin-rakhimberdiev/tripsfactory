"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Field, useToast } from "./ui";
import { IconCheck, IconDownload } from "./icons";
import { fieldErrors, slugTaken, slugify } from "@/lib/studio/slug";

export type PartnerInitial = {
  /** null while the record has not been created yet. */
  id: number | null;
  name: string;
  code: string;
  type: "hotel" | "ota" | "tour_operator" | "other";
  commissionUsd: number;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  active: boolean;
  notes: string;
};

const TYPES = [
  { value: "hotel", label: "Mehmonxona" },
  { value: "ota", label: "OTA (onlayn platforma)" },
  { value: "tour_operator", label: "Turoperator" },
  { value: "other", label: "Boshqa" },
] as const;

/**
 * A partner, and the QR code that belongs to it.
 *
 * The QR is drawn here rather than stored: it is a pure function of the link,
 * so keeping a generated image in the media library would only create a second
 * thing that can fall out of date with the code it encodes.
 */
export function PartnerEditor({ initial }: { initial: PartnerInitial }) {
  const router = useRouter();
  const toast = useToast();
  const [p, setP] = useState<PartnerInitial>(initial);
  const [saving, setSaving] = useState(false);
  const patch = (v: Partial<PartnerInitial>) => setP((old) => ({ ...old, ...v }));

  const link =
    typeof window !== "undefined"
      ? `${window.location.origin}/r/${p.code || "…"}`
      : `/r/${p.code}`;

  async function save() {
    const code = slugify(p.code.trim() || p.name);
    if (!p.name.trim()) {
      toast("Nomini yozing", "error");
      return;
    }
    if (!code) {
      toast("Kod lotin harflarida bo'lishi kerak", "error");
      return;
    }
    // Asked before it is sent: the database answers a duplicate code with a
    // bare 500 and no field name, which tells an editor nothing about what to
    // change.
    if (p.id === null && (await slugTaken("partners", code, "code"))) {
      toast(`«${code}» kodi allaqachon band`, "error");
      return;
    }
    setSaving(true);
    const body = {
      name: p.name.trim(),
      code,
      type: p.type,
      commissionUsd: p.commissionUsd,
      contactName: p.contactName.trim(),
      contactPhone: p.contactPhone.trim(),
      contactEmail: p.contactEmail.trim() || null,
      active: p.active,
      notes: p.notes.trim(),
    };
    const res = await fetch(
      p.id === null ? "/api/partners" : `/api/partners/${p.id}`,
      {
        method: p.id === null ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      },
    ).catch(() => null);
    setSaving(false);

    if (!res?.ok) {
      const detail = await fieldErrors(res);
      toast(
        detail?.includes("code")
          ? `«${code}» kodi allaqachon band`
          : "Saqlanmadi",
        "error",
      );
      return;
    }
    const data = (await res.json()) as { doc?: { id: number } };
    toast(p.id === null ? "Yaratildi" : "Saqlandi");
    if (p.id === null && data.doc?.id) {
      router.replace(`/studio/partners/${data.doc.id}`);
      return;
    }
    setP((old) => ({ ...old, code }));
    router.refresh();
  }

  return (
    <>
      <div className="s-card">
        <div className="s-card__body">
          <div className="s-form">
            <div className="s-row2">
              <Field label="Nomi" required>
                <input
                  className="s-input"
                  value={p.name}
                  placeholder="Hyatt Regency Tashkent"
                  onChange={(e) => patch({ name: e.target.value })}
                />
              </Field>
              <Field
                label="Kod"
                required
                help="QR havolasida ishlatiladi. O'zgartirsangiz chop etilgan eski QR kodlar ishlamay qoladi."
              >
                <input
                  className="s-input"
                  value={p.code}
                  placeholder="hyatt"
                  onChange={(e) => patch({ code: e.target.value })}
                  onBlur={(e) => patch({ code: slugify(e.target.value) })}
                />
              </Field>
            </div>

            <div className="s-row2">
              <Field label="Turi" required>
                <select
                  className="s-select"
                  value={p.type}
                  onChange={(e) =>
                    patch({ type: e.target.value as PartnerInitial["type"] })
                  }
                >
                  {TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field
                label="Cashback (USD, kishiga)"
                required
                help="Har bir kelgan va to'lagan mijoz uchun."
              >
                <input
                  className="s-input"
                  type="number"
                  min={0}
                  value={p.commissionUsd}
                  onChange={(e) =>
                    patch({ commissionUsd: Number(e.target.value) })
                  }
                />
              </Field>
            </div>

            <div className="s-row2">
              <Field label="Aloqa uchun shaxs">
                <input
                  className="s-input"
                  value={p.contactName}
                  onChange={(e) => patch({ contactName: e.target.value })}
                />
              </Field>
              <Field label="Telefon">
                <input
                  className="s-input"
                  value={p.contactPhone}
                  onChange={(e) => patch({ contactPhone: e.target.value })}
                />
              </Field>
            </div>

            <Field label="Email">
              <input
                className="s-input"
                type="email"
                value={p.contactEmail}
                onChange={(e) => patch({ contactEmail: e.target.value })}
              />
            </Field>

            <label className="s-check">
              <input
                type="checkbox"
                checked={p.active}
                onChange={(e) => patch({ active: e.target.checked })}
              />
              Faol — QR kod ishlaydi
            </label>

            <Field label="Izoh">
              <textarea
                className="s-textarea"
                value={p.notes}
                onChange={(e) => patch({ notes: e.target.value })}
              />
            </Field>
          </div>
        </div>
      </div>

      {p.id !== null && p.code && <QrPanel link={link} code={p.code} name={p.name} />}

      <div className="s-savebar">
        <div className="s-savebar__spacer" />
        <button className="s-btn s-btn--primary" onClick={save} disabled={saving}>
          {saving ? <span className="s-spin" /> : <IconCheck />} Saqlash
        </button>
      </div>
    </>
  );
}

/**
 * The printable half.
 *
 * `qrcode` is imported inside an effect so it is fetched by the browser that
 * needs it and never reaches the Worker bundle, where every extra dependency
 * is startup time on somebody else's request.
 */
function QrPanel({
  link,
  code,
  name,
}: {
  link: string;
  code: string;
  name: string;
}) {
  const [svg, setSvg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    void import("qrcode").then((QR) =>
      QR.toString(link, {
        type: "svg",
        margin: 1,
        width: 320,
        // High correction: this gets printed, taped to a desk and photographed
        // under lobby lighting. It should still scan with a corner scuffed.
        errorCorrectionLevel: "H",
        color: { dark: "#6e1218", light: "#ffffff" },
      }).then((out) => {
        if (alive) setSvg(out);
      }),
    );
    return () => {
      alive = false;
    };
  }, [link]);

  function download() {
    if (!svg) return;
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tripsfactory-qr-${code}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="s-card" style={{ marginTop: 16 }}>
      <div className="s-card__body">
        <div
          style={{
            display: "flex",
            gap: 24,
            alignItems: "flex-start",
            flexWrap: "wrap",
          }}
        >
          <div
            ref={printRef}
            style={{
              width: 200,
              height: 200,
              background: "#fff",
              borderRadius: 12,
              padding: 8,
              flexShrink: 0,
            }}
            // The SVG comes from the QR encoder in this browser, from a string
            // this component built — no user input reaches it.
            dangerouslySetInnerHTML={{ __html: svg ?? "" }}
          />
          <div style={{ minWidth: 240, flex: 1 }}>
            <h2 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 600 }}>
              QR kod
            </h2>
            <p
              style={{
                margin: "0 0 14px",
                fontSize: 13.5,
                color: "var(--s-fg-secondary)",
                lineHeight: 1.6,
              }}
            >
              Shu kodni {name || "hamkor"} uchun chop eting. Mijoz skanlaganda
              o&apos;z tilida masterklasslar sahifasi ochiladi va keyingi 90
              kun ichida bergan buyurtmasi shu hamkorga yoziladi.
            </p>
            <div
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                marginBottom: 14,
              }}
            >
              <code
                style={{
                  fontSize: 13,
                  background: "var(--s-bg-subtle)",
                  padding: "6px 10px",
                  borderRadius: 8,
                  wordBreak: "break-all",
                }}
              >
                {link}
              </code>
              <button
                type="button"
                className="s-btn s-btn--sm"
                onClick={() => {
                  void navigator.clipboard.writeText(link);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
              >
                {copied ? "Nusxalandi" : "Nusxalash"}
              </button>
            </div>
            <button
              type="button"
              className="s-btn"
              onClick={download}
              disabled={!svg}
            >
              <IconDownload /> QR ni yuklab olish (SVG)
            </button>
            <p
              style={{
                margin: "10px 0 0",
                fontSize: 12,
                color: "var(--s-fg-muted)",
              }}
            >
              SVG sifati yo&apos;qolmaydi — istalgan o&apos;lchamda chop etsa
              bo&apos;ladi.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
