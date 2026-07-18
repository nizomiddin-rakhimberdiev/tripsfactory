"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useToast } from "./ui";
import { IconTrash, IconUpload } from "./icons";

type MediaDoc = { id: number; url?: string | null; filename?: string | null; alt?: string };

export function MediaManager() {
  const toast = useToast();
  const [items, setItems] = useState<MediaDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/media?limit=300&depth=0&sort=-createdAt", {
      credentials: "include",
    });
    const data = await res.json();
    setItems(data.docs ?? []);
    setLoading(false);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  async function uploadFiles(files: FileList) {
    setUploading(true);
    for (const file of Array.from(files)) {
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
      if (!res.ok) toast(`«${file.name}» yuklanmadi`, "error");
    }
    setUploading(false);
    toast("Rasm(lar) yuklandi");
    load();
  }

  async function remove(id: number) {
    if (!confirm("Rasmni o'chirasizmi? Bu rasm ishlatilayotgan joylardan yo'qoladi."))
      return;
    const res = await fetch(`/api/media/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (res.ok) {
      setItems((it) => it.filter((m) => m.id !== id));
      toast("O'chirildi");
    } else {
      toast("O'chirib bo'lmadi (rasm ishlatilayotgan bo'lishi mumkin)", "error");
    }
  }

  return (
    <>
      <div
        className={`s-dropzone ${drag ? "s-dropzone--drag" : ""}`}
        style={{ marginBottom: 22 }}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
        }}
      >
        {uploading ? (
          <div className="s-spin" style={{ margin: "0 auto" }} />
        ) : (
          <>
            <IconUpload />
            <div>
              <strong>Rasm yuklang</strong> yoki bu yerga tortib tashlang (bir
              nechta bo'lishi mumkin)
            </div>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => e.target.files?.length && uploadFiles(e.target.files)}
        />
      </div>

      {loading ? (
        <div className="s-card">
          <div className="s-empty">Yuklanmoqda…</div>
        </div>
      ) : items.length === 0 ? (
        <div className="s-card">
          <div className="s-empty">Hozircha rasm yo'q. Yuqoridan yuklang.</div>
        </div>
      ) : (
        <div className="s-gallery">
          {items.map((m) => (
            <div key={m.id} className="s-gtile">
              <div className="s-gtile__img">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {m.url && <img src={m.url} alt={m.alt ?? ""} />}
              </div>
              <div className="s-gtile__body">
                <span className="s-gtile__name">{m.filename}</span>
                <div className="s-gtile__actions">
                  <button
                    className="s-btn s-btn--icon s-btn--ghost s-btn--sm s-btn--danger"
                    onClick={() => remove(m.id)}
                    title="O'chirish"
                  >
                    <IconTrash />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
