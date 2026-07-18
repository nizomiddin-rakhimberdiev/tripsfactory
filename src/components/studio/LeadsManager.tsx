"use client";

import { useState } from "react";
import { useToast } from "./ui";
import { IconTrash } from "./icons";

type Lead = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  tourSlug?: string | null;
  pax?: number | null;
  message?: string | null;
  status?: string | null;
  createdAt?: string;
};

const STATUS = [
  { value: "new", label: "Yangi" },
  { value: "contacted", label: "Bog'lanildi" },
  { value: "closed", label: "Yopildi" },
];

function fmt(d?: string) {
  return d
    ? new Intl.DateTimeFormat("uz-UZ", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(d))
    : "—";
}

export function LeadsManager({ initial }: { initial: Lead[] }) {
  const toast = useToast();
  const [leads, setLeads] = useState<Lead[]>(initial);
  const [open, setOpen] = useState<Lead | null>(null);

  async function setStatus(id: number, status: string) {
    setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, status } : l)));
    await fetch(`/api/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status }),
    });
  }

  async function remove(id: number) {
    if (!confirm("So'rovni o'chirasizmi?")) return;
    const res = await fetch(`/api/leads/${id}`, { method: "DELETE", credentials: "include" });
    if (res.ok) {
      setLeads((ls) => ls.filter((l) => l.id !== id));
      toast("O'chirildi");
    }
  }

  if (leads.length === 0)
    return (
      <div className="s-card">
        <div className="s-empty">Hozircha so'rovlar yo'q.</div>
      </div>
    );

  return (
    <>
      <div className="s-table-wrap">
        <table className="s-table">
          <thead>
            <tr>
              <th>Ism</th>
              <th>Aloqa</th>
              <th>Tur</th>
              <th>Holat</th>
              <th>Sana</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {leads.map((l) => (
              <tr key={l.id}>
                <td>
                  <button
                    className="s-rowlink"
                    style={{ background: "none", border: 0, cursor: "pointer", padding: 0 }}
                    onClick={() => setOpen(l)}
                  >
                    {l.name}
                  </button>
                </td>
                <td>
                  <div>{l.email}</div>
                  {l.phone && (
                    <div style={{ color: "var(--s-fg-muted)", fontSize: 12 }}>{l.phone}</div>
                  )}
                </td>
                <td>{l.tourSlug ?? "—"}</td>
                <td>
                  <select
                    className="s-select"
                    style={{ width: "auto", height: 30, padding: "2px 8px" }}
                    value={l.status ?? "new"}
                    onChange={(e) => setStatus(l.id, e.target.value)}
                  >
                    {STATUS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td style={{ color: "var(--s-fg-muted)" }}>{fmt(l.createdAt)}</td>
                <td>
                  <button
                    className="s-btn s-btn--icon s-btn--ghost s-btn--sm s-btn--danger"
                    onClick={() => remove(l.id)}
                    title="O'chirish"
                  >
                    <IconTrash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="s-modal-backdrop" onClick={() => setOpen(null)}>
          <div className="s-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="s-modal__head">{open.name}</div>
            <div className="s-modal__body">
              <div className="s-form">
                <div><strong>Email:</strong> {open.email}</div>
                {open.phone && <div><strong>Telefon:</strong> {open.phone}</div>}
                {open.tourSlug && <div><strong>Tur:</strong> {open.tourSlug}</div>}
                {open.pax != null && <div><strong>Kishilar:</strong> {open.pax}</div>}
                {open.message && (
                  <div>
                    <strong>Xabar:</strong>
                    <p style={{ marginTop: 6, color: "var(--s-fg-secondary)" }}>{open.message}</p>
                  </div>
                )}
                <a className="s-btn s-btn--primary" href={`mailto:${open.email}`}>
                  Email yozish
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
