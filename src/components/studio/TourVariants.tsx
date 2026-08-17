"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "./ui";
import { IconPlus, IconArrowRight } from "./icons";
import { tourEditPath } from "@/lib/studio/tour-path";
import { TYPE_LABEL, TOUR_TYPES } from "@/lib/studio/variants";

export type Sibling = { id: number; type: string; title: string; slug: string };

/**
 * The other versions of this itinerary.
 *
 * A group tour and a private one are two records on purpose — two pages, two
 * prices, two sets of departure dates. This panel is the thread between them:
 * it says which others exist, makes a missing one, and pushes the writing
 * across when the English changes.
 *
 * What it never copies is the commercial half. Price, single supplement,
 * departures and whether a tour is published stay where they were set; the
 * whole reason these are separate records is that those differ.
 */
export function TourVariants({
  tourId,
  type,
  siblings,
}: {
  tourId: number;
  type: string;
  siblings: Sibling[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);

  const taken = new Set([type, ...siblings.map((s) => s.type)]);
  const missing = TOUR_TYPES.filter((v) => !taken.has(v));

  async function act(action: "create" | "sync", value?: string) {
    setBusy(value ?? action);
    const res = await fetch("/api/studio/tour-variants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ tourId, action, type: value }),
    }).catch(() => null);
    setBusy(null);

    const body = (await res?.json().catch(() => null)) as {
      error?: string;
      created?: { id: number; type: string };
      updated?: number;
    } | null;

    if (!res?.ok) {
      toast(body?.error ?? "Bajarilmadi", "error");
      return;
    }
    if (action === "create" && body?.created) {
      toast(`${TYPE_LABEL[body.created.type]} ko'rinishi yaratildi`);
      router.push(tourEditPath(body.created.type, body.created.id));
      return;
    }
    toast(
      body?.updated
        ? `Matn ${body.updated} ta turga ko'chirildi`
        : "Ko'chiriladigan tur topilmadi",
    );
    router.refresh();
  }

  return (
    <div className="s-card">
      <div className="s-card__body">
        <div className="s-section-title" style={{ margin: "0 0 6px" }}>
          Shu dasturning boshqa ko&apos;rinishlari
        </div>
        <p
          style={{
            margin: "0 0 14px",
            fontSize: 12.5,
            color: "var(--s-fg-muted)",
            lineHeight: 1.7,
            maxWidth: 640,
          }}
        >
          Guruh va individual turlar alohida yozuv: har birining o&apos;z narxi,
          o&apos;z jo&apos;nash sanalari va o&apos;z sahifasi bor. Umumiy
          bo&apos;lgani — matn.
        </p>

        {siblings.length > 0 && (
          <div className="s-list" style={{ marginBottom: 14 }}>
            {siblings.map((s) => (
              <Link
                key={s.id}
                href={tourEditPath(s.type, s.id)}
                className="s-list__item"
              >
                <span className="s-list__body">
                  <span className="s-list__t">{s.title}</span>
                  <span className="s-list__d">
                    {TYPE_LABEL[s.type] ?? s.type} · /{s.slug}
                  </span>
                </span>
                <IconArrowRight width={16} height={16} />
              </Link>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {missing.map((v) => (
            <button
              key={v}
              type="button"
              className="s-btn s-btn--sm"
              disabled={busy !== null}
              onClick={() => act("create", v)}
            >
              <IconPlus /> {TYPE_LABEL[v]} ko&apos;rinishini yaratish
            </button>
          ))}
          {siblings.length > 0 && (
            <button
              type="button"
              className="s-btn s-btn--sm"
              disabled={busy !== null}
              onClick={() => act("sync")}
              title="Tavsif, kunma-kun dastur, narxga kiradi/kirmaydi, rasm, shaharlar va marshrutni ko'chiradi"
            >
              {busy === "sync" ? "Ko'chirilmoqda…" : "Matnni boshqalariga ko'chirish"}
            </button>
          )}
        </div>

        {siblings.length > 0 && (
          <p
            style={{
              margin: "10px 0 0",
              fontSize: 12,
              color: "var(--s-fg-muted)",
            }}
          >
            Ko&apos;chirilmaydi: nomi, narxi, yakka joy qo&apos;shimchasi,
            jo&apos;nash sanalari va chop etilgan holati.
          </p>
        )}
      </div>
    </div>
  );
}
