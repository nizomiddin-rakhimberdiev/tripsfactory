"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "./ui";
import { IconPlus } from "./icons";

/**
 * Mint a run of QR codes before there are hotels to put them in.
 *
 * The print shop takes one order of thirty or forty banners; the contracts
 * arrive one at a time over the following months. These two facts used to be
 * in conflict — no hotel, no code, no banner. They are not any more: the code
 * belongs to the banner, and the hotel is attached to it later without
 * anything being reprinted.
 */
export function PartnerBatch() {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(40);
  const [busy, setBusy] = useState(false);

  async function mint() {
    setBusy(true);
    const res = await fetch("/api/studio/partner-batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ count }),
    }).catch(() => null);
    setBusy(false);

    if (!res?.ok) {
      toast("Yaratilmadi", "error");
      return;
    }
    const data = (await res.json()) as {
      created: { code: string }[];
      failed: string[];
    };
    setOpen(false);
    toast(
      data.failed.length
        ? `${data.created.length} ta yaratildi, ${data.failed.length} tasi bo'lmadi`
        : `${data.created.length} ta QR kod yaratildi`,
      data.failed.length ? "error" : "ok",
    );
    router.refresh();
  }

  if (!open) {
    return (
      <button
        type="button"
        className="s-btn"
        onClick={() => setOpen(true)}
        title="Mehmonxona topilmasdan oldin chop etish uchun"
      >
        <IconPlus /> QR partiyasi
      </button>
    );
  }

  return (
    <span
      style={{
        display: "inline-flex",
        gap: 8,
        alignItems: "center",
        flexWrap: "wrap",
      }}
    >
      <input
        className="s-input"
        type="number"
        min={1}
        max={100}
        value={count}
        onChange={(e) => setCount(Number(e.target.value))}
        style={{ width: 90 }}
        aria-label="Nechta QR kod"
      />
      <button
        type="button"
        className="s-btn s-btn--primary"
        disabled={busy}
        onClick={mint}
      >
        {busy ? "Yaratilmoqda…" : "Yaratish"}
      </button>
      <button type="button" className="s-btn" onClick={() => setOpen(false)}>
        Bekor
      </button>
    </span>
  );
}
