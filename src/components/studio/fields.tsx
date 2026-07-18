"use client";

import { useEffect, useRef, useState } from "react";
import { STUDIO_LOCALES } from "@/lib/studio/locales";
import { Field } from "./ui";
import { IconImage, IconPlus, IconTrash, IconUpload, IconX } from "./icons";

export type LocaleMap = Record<string, string>;
export type MediaRef = {
  id: number;
  url?: string | null;
  filename?: string | null;
} | null;

/* --------------------------------------------------------------- locale tabs */
function LocaleTabs({
  active,
  onChange,
  filled,
}: {
  active: string;
  onChange: (l: string) => void;
  filled: (l: string) => boolean;
}) {
  return (
    <div className="s-locales">
      {STUDIO_LOCALES.map((l) => (
        <button
          key={l.code}
          type="button"
          className={`s-locale-tab ${active === l.code ? "s-locale-tab--active" : ""} ${
            filled(l.code) ? "s-locale-tab--filled" : ""
          }`}
          onClick={() => onChange(l.code)}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}

/* --------------------------------------------------------- localized text/area */
export function LocalizedText({
  label,
  required,
  help,
  value,
  onChange,
  textarea,
}: {
  label: string;
  required?: boolean;
  help?: string;
  value: LocaleMap;
  onChange: (v: LocaleMap) => void;
  textarea?: boolean;
}) {
  const [active, setActive] = useState("en");
  const set = (v: string) => onChange({ ...value, [active]: v });
  return (
    <Field
      label={label}
      required={required}
      help={help}
      right={
        <LocaleTabs
          active={active}
          onChange={setActive}
          filled={(l) => Boolean(value[l]?.trim())}
        />
      }
    >
      {textarea ? (
        <textarea
          className="s-textarea"
          value={value[active] ?? ""}
          onChange={(e) => set(e.target.value)}
        />
      ) : (
        <input
          className="s-input"
          value={value[active] ?? ""}
          onChange={(e) => set(e.target.value)}
        />
      )}
    </Field>
  );
}

/* ------------------------------------------------- localized list of {text} */
export function LocalizedList({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Record<string, { text: string }[]>;
  onChange: (v: Record<string, { text: string }[]>) => void;
}) {
  const [active, setActive] = useState("en");
  const list = value[active] ?? [];
  const setList = (next: { text: string }[]) =>
    onChange({ ...value, [active]: next });
  return (
    <Field
      label={label}
      right={
        <LocaleTabs
          active={active}
          onChange={setActive}
          filled={(l) => (value[l]?.length ?? 0) > 0}
        />
      }
    >
      <div className="s-repeat">
        {list.map((item, i) => (
          <div key={i} style={{ display: "flex", gap: 8 }}>
            <input
              className="s-input"
              value={item.text}
              onChange={(e) => {
                const next = [...list];
                next[i] = { text: e.target.value };
                setList(next);
              }}
            />
            <button
              type="button"
              className="s-btn s-btn--icon s-btn--danger"
              onClick={() => setList(list.filter((_, j) => j !== i))}
            >
              <IconTrash />
            </button>
          </div>
        ))}
        <button
          type="button"
          className="s-btn s-btn--sm"
          onClick={() => setList([...list, { text: "" }])}
        >
          <IconPlus /> Band qo'shish
        </button>
      </div>
    </Field>
  );
}

/* -------------------------------- localized itinerary [{title, description}] */
export function LocalizedItinerary({
  value,
  onChange,
}: {
  value: Record<string, { title: string; description: string }[]>;
  onChange: (v: Record<string, { title: string; description: string }[]>) => void;
}) {
  const [active, setActive] = useState("en");
  const list = value[active] ?? [];
  const setList = (next: { title: string; description: string }[]) =>
    onChange({ ...value, [active]: next });
  return (
    <Field
      label="Kunma-kun dastur"
      right={
        <LocaleTabs
          active={active}
          onChange={setActive}
          filled={(l) => (value[l]?.length ?? 0) > 0}
        />
      }
    >
      <div className="s-repeat">
        {list.map((item, i) => (
          <div key={i} className="s-repeat__item">
            <div className="s-repeat__head">
              <span className="s-repeat__num">{i + 1}-kun</span>
              <button
                type="button"
                className="s-btn s-btn--icon s-btn--danger s-btn--sm"
                style={{ marginLeft: "auto" }}
                onClick={() => setList(list.filter((_, j) => j !== i))}
              >
                <IconTrash />
              </button>
            </div>
            <div className="s-repeat__fields">
              <input
                className="s-input"
                placeholder="Kun sarlavhasi"
                value={item.title}
                onChange={(e) => {
                  const next = [...list];
                  next[i] = { ...next[i], title: e.target.value };
                  setList(next);
                }}
              />
              <textarea
                className="s-textarea"
                placeholder="Tavsif"
                value={item.description}
                onChange={(e) => {
                  const next = [...list];
                  next[i] = { ...next[i], description: e.target.value };
                  setList(next);
                }}
              />
            </div>
          </div>
        ))}
        <button
          type="button"
          className="s-btn s-btn--sm"
          onClick={() => setList([...list, { title: "", description: "" }])}
        >
          <IconPlus /> Kun qo'shish
        </button>
      </div>
    </Field>
  );
}

/* --------------------------------- localized sections [{heading, body}] */
export function LocalizedSections({
  value,
  onChange,
}: {
  value: Record<string, { heading: string; body: string }[]>;
  onChange: (v: Record<string, { heading: string; body: string }[]>) => void;
}) {
  const [active, setActive] = useState("en");
  const list = value[active] ?? [];
  const setList = (next: { heading: string; body: string }[]) =>
    onChange({ ...value, [active]: next });
  return (
    <Field
      label="Bo'limlar"
      right={
        <LocaleTabs
          active={active}
          onChange={setActive}
          filled={(l) => (value[l]?.length ?? 0) > 0}
        />
      }
    >
      <div className="s-repeat">
        {list.map((item, i) => (
          <div key={i} className="s-repeat__item">
            <div className="s-repeat__head">
              <span className="s-repeat__num">{i + 1}</span>
              <button
                type="button"
                className="s-btn s-btn--icon s-btn--danger s-btn--sm"
                style={{ marginLeft: "auto" }}
                onClick={() => setList(list.filter((_, j) => j !== i))}
              >
                <IconTrash />
              </button>
            </div>
            <div className="s-repeat__fields">
              <input
                className="s-input"
                placeholder="Sarlavha"
                value={item.heading}
                onChange={(e) => {
                  const next = [...list];
                  next[i] = { ...next[i], heading: e.target.value };
                  setList(next);
                }}
              />
              <textarea
                className="s-textarea"
                placeholder="Matn"
                value={item.body}
                onChange={(e) => {
                  const next = [...list];
                  next[i] = { ...next[i], body: e.target.value };
                  setList(next);
                }}
              />
            </div>
          </div>
        ))}
        <button
          type="button"
          className="s-btn s-btn--sm"
          onClick={() => setList([...list, { heading: "", body: "" }])}
        >
          <IconPlus /> Bo'lim qo'shish
        </button>
      </div>
    </Field>
  );
}

/* ---------------------------------------------------------- image picker */
export function ImagePicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: MediaRef;
  onChange: (v: MediaRef) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Field
      label={label}
      required
      help="Almashtirish uchun «Rasmni almashtirish» tugmasini bosing — mavjuddan tanlang yoki yangisini yuklang."
    >
      {value?.url ? (
        <div className="s-image">
          <div className="s-image__preview">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value.url} alt="" />
            <div className="s-image__overlay">
              <button
                type="button"
                className="s-btn s-btn--sm"
                onClick={() => setOpen(true)}
              >
                <IconImage /> Rasmni almashtirish
              </button>
            </div>
          </div>
          <div className="s-image__meta">{value.filename}</div>
        </div>
      ) : (
        <button
          type="button"
          className="s-dropzone"
          onClick={() => setOpen(true)}
          style={{ width: "100%" }}
        >
          <IconImage />
          <div>Rasm tanlang yoki yuklang</div>
        </button>
      )}
      {open && (
        <MediaPickerModal
          onClose={() => setOpen(false)}
          onPick={(m) => {
            onChange(m);
            setOpen(false);
          }}
        />
      )}
    </Field>
  );
}

/* --------------------------------------------------- media picker modal */
type MediaDoc = { id: number; url?: string | null; filename?: string | null; alt?: string };

export function MediaPickerModal({
  onClose,
  onPick,
}: {
  onClose: () => void;
  onPick: (m: MediaRef) => void;
}) {
  const [items, setItems] = useState<MediaDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/media?limit=200&depth=0&sort=-createdAt", {
      credentials: "include",
    });
    const data = await res.json();
    setItems(data.docs ?? []);
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  async function upload(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append(
      "_payload",
      JSON.stringify({ alt: file.name.replace(/\.[^.]+$/, "") }),
    );
    const res = await fetch("/api/media", {
      method: "POST",
      credentials: "include",
      body: fd,
    });
    setUploading(false);
    if (res.ok) {
      const data = await res.json();
      const doc: MediaDoc = data.doc ?? data;
      onPick({ id: doc.id, url: doc.url, filename: doc.filename });
    }
  }

  return (
    <div className="s-modal-backdrop" onClick={onClose}>
      <div className="s-modal" onClick={(e) => e.stopPropagation()}>
        <div className="s-modal__head">
          Rasm tanlash
          <button
            className="s-btn s-btn--icon s-btn--ghost"
            style={{ marginLeft: "auto" }}
            onClick={onClose}
          >
            <IconX />
          </button>
        </div>
        <div className="s-modal__body">
          <div
            className={`s-dropzone ${drag ? "s-dropzone--drag" : ""}`}
            style={{ marginBottom: 18 }}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              const f = e.dataTransfer.files[0];
              if (f) upload(f);
            }}
          >
            {uploading ? (
              <div className="s-spin" style={{ margin: "0 auto" }} />
            ) : (
              <>
                <IconUpload />
                <div>
                  <strong>Yangi rasm yuklang</strong> yoki bu yerga torting
                </div>
              </>
            )}
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
            />
          </div>
          {loading ? (
            <div className="s-empty">Yuklanmoqda…</div>
          ) : (
            <div className="s-gallery">
              {items.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className="s-gtile"
                  style={{ textAlign: "left", cursor: "pointer", padding: 0 }}
                  onClick={() =>
                    onPick({ id: m.id, url: m.url, filename: m.filename })
                  }
                >
                  <div className="s-gtile__img">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {m.url && <img src={m.url} alt={m.alt ?? ""} />}
                  </div>
                  <div className="s-gtile__body">
                    <span className="s-gtile__name">{m.filename}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
