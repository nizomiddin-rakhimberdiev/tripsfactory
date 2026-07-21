"use client";

import { useState } from "react";
import { MediaPickerModal } from "./fields";
import { Field } from "./ui";
import { IconPlus, IconTrash, IconChevron } from "./icons";

export type GalleryItem = { id: number; url: string };

export function GalleryPicker({
  value,
  onChange,
}: {
  value: GalleryItem[];
  onChange: (v: GalleryItem[]) => void;
}) {
  const [open, setOpen] = useState(false);

  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= value.length) return;
    const n = [...value];
    [n[i], n[j]] = [n[j], n[i]];
    onChange(n);
  };

  const iconBtn: React.CSSProperties = {
    width: 26,
    height: 26,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
    border: "none",
    background: "rgba(255,255,255,0.92)",
    color: "var(--s-fg)",
    cursor: "pointer",
  };

  return (
    <Field
      label="Rasmlar galereyasi (karusel)"
      help="Bir nechta rasm qo'shing — sahifada karuselda ko'rinadi. Strelkalar bilan tartiblang."
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
          gap: 10,
        }}
      >
        {value.map((g, i) => (
          <div
            key={`${g.id}-${i}`}
            style={{
              position: "relative",
              borderRadius: 10,
              overflow: "hidden",
              border: "1px solid var(--s-border)",
              aspectRatio: "3 / 2",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={g.url}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            <div style={{ position: "absolute", top: 5, right: 5 }}>
              <button
                type="button"
                style={{ ...iconBtn, color: "var(--s-danger)" }}
                onClick={() => onChange(value.filter((_, j) => j !== i))}
                title="O'chirish"
              >
                <IconTrash width={15} height={15} />
              </button>
            </div>
            <div style={{ position: "absolute", bottom: 5, left: 5, display: "flex", gap: 3 }}>
              <button type="button" style={iconBtn} onClick={() => move(i, -1)} disabled={i === 0} title="Chapga">
                <IconChevron width={15} height={15} style={{ transform: "rotate(180deg)" }} />
              </button>
              <button type="button" style={iconBtn} onClick={() => move(i, 1)} disabled={i === value.length - 1} title="O'ngga">
                <IconChevron width={15} height={15} />
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          className="s-dropzone"
          onClick={() => setOpen(true)}
          style={{
            aspectRatio: "3 / 2",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
            gap: 4,
          }}
        >
          <IconPlus width={22} height={22} />
          <span style={{ fontSize: 12 }}>Rasm qo'shish</span>
        </button>
      </div>
      {open && (
        <MediaPickerModal
          onClose={() => setOpen(false)}
          onPick={(m) => {
            if (m?.url) onChange([...value, { id: m.id, url: m.url }]);
          }}
        />
      )}
    </Field>
  );
}
