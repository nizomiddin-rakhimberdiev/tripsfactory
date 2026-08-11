"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Field, useToast } from "./ui";
import { IconTrash } from "./icons";
import { formatDateTime } from "@/lib/studio/datetime";
import { fieldErrors } from "@/lib/studio/slug";

export type StudioUser = { id: number; email: string; createdAt?: string };

/**
 * Accounts that can sign in to the Studio.
 *
 * The last screen that still required the Payload admin. Everything else moved
 * here; this closes it, so there is one panel rather than two.
 *
 * Payload owns the password: it is written through the API and hashed there,
 * never read back. Changing one is therefore "set a new value", not "edit the
 * old one", and this screen says so.
 */
export function UsersManager({
  initial,
  currentEmail,
}: {
  initial: StudioUser[];
  /** Whoever is signed in — they may not delete themselves. */
  currentEmail: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [users, setUsers] = useState(initial);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [resetFor, setResetFor] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  async function create() {
    if (!email.trim() || password.length < 8) {
      toast("Email va kamida 8 belgili parol kerak", "error");
      return;
    }
    setBusy(true);
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email: email.trim(), password }),
    }).catch(() => null);
    setBusy(false);

    if (!res?.ok) {
      // Payload reports a duplicate email as a nested validation error whose
      // outer message is "The following field is invalid: email" — English,
      // and it does not say what is wrong. The nested `path` does, so the one
      // failure an editor will actually hit gets a sentence of its own.
      // fieldErrors returns the on-screen label ("Email"), not the schema path.
      const paths = await fieldErrors(res);
      toast(
        paths.toLowerCase().includes("email")
          ? "Bu email allaqachon ro'yxatdan o'tgan"
          : paths
            ? `Yaratilmadi — to'ldiring: ${paths}`
            : "Yaratilmadi",
        "error",
      );
      return;
    }
    const d = (await res.json()) as { doc: StudioUser };
    setUsers((u) => [...u, d.doc]);
    setEmail("");
    setPassword("");
    toast("Foydalanuvchi qo'shildi");
    router.refresh();
  }

  async function setPasswordFor(id: number) {
    if (newPassword.length < 8) {
      toast("Parol kamida 8 belgi bo'lsin", "error");
      return;
    }
    setBusy(true);
    const res = await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ password: newPassword }),
    }).catch(() => null);
    setBusy(false);
    setResetFor(null);
    setNewPassword("");
    toast(res?.ok ? "Parol yangilandi" : "Parol yangilanmadi", res?.ok ? "ok" : "error");
  }

  async function remove(id: number) {
    setBusy(true);
    const res = await fetch(`/api/users/${id}`, {
      method: "DELETE",
      credentials: "include",
    }).catch(() => null);
    setBusy(false);
    setConfirmDelete(null);
    if (!res?.ok) {
      toast("O'chirilmadi", "error");
      return;
    }
    setUsers((u) => u.filter((x) => x.id !== id));
    toast("O'chirildi");
    router.refresh();
  }

  return (
    <>
      <div className="s-table-wrap">
        <table className="s-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Qo&apos;shilgan</th>
              <th style={{ width: 200 }}>
                <span className="s-visually-hidden">Amallar</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>
                  {u.email}
                  {u.email === currentEmail && (
                    <span className="s-badge s-badge--gray" style={{ marginLeft: 8 }}>
                      siz
                    </span>
                  )}
                </td>
                <td style={{ color: "var(--s-fg-muted)" }}>
                  {formatDateTime(u.createdAt)}
                </td>
                <td>
                  {resetFor === u.id ? (
                    <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                      <input
                        className="s-input"
                        type="password"
                        placeholder="Yangi parol"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        style={{ width: 150 }}
                      />
                      <button
                        type="button"
                        className="s-btn s-btn--sm s-btn--primary"
                        disabled={busy}
                        onClick={() => setPasswordFor(u.id)}
                      >
                        Saqlash
                      </button>
                      <button
                        type="button"
                        className="s-btn s-btn--sm"
                        onClick={() => { setResetFor(null); setNewPassword(""); }}
                      >
                        Bekor
                      </button>
                    </span>
                  ) : confirmDelete === u.id ? (
                    <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                      <span style={{ fontSize: 13, color: "var(--s-fg-secondary)" }}>
                        O&apos;chirilsinmi?
                      </span>
                      <button
                        type="button"
                        className="s-btn s-btn--sm s-btn--danger"
                        disabled={busy}
                        onClick={() => remove(u.id)}
                      >
                        Ha
                      </button>
                      <button
                        type="button"
                        className="s-btn s-btn--sm"
                        onClick={() => setConfirmDelete(null)}
                      >
                        Yo&apos;q
                      </button>
                    </span>
                  ) : (
                    <span style={{ display: "inline-flex", gap: 6 }}>
                      <button
                        type="button"
                        className="s-btn s-btn--sm"
                        onClick={() => setResetFor(u.id)}
                      >
                        Parolni almashtirish
                      </button>
                      {/* Deleting the account you are signed in with locks you
                          out of the panel you are standing in. */}
                      {u.email !== currentEmail && (
                        <button
                          type="button"
                          className="s-btn s-btn--sm s-btn--icon s-btn--danger"
                          aria-label={`${u.email} — o'chirish`}
                          onClick={() => setConfirmDelete(u.id)}
                        >
                          <IconTrash />
                        </button>
                      )}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="s-card" style={{ padding: 20, marginTop: 20, maxWidth: 560 }}>
        <h2 style={{ margin: "0 0 14px", fontSize: 16, fontWeight: 600 }}>
          Yangi foydalanuvchi
        </h2>
        <Field label="Email" required>
          <input
            className="s-input"
            type="email"
            autoComplete="off"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field
          label="Parol"
          required
          help="Kamida 8 belgi. Parol saqlangach qayta ko'rsatilmaydi — uni hoziroq yozib oling."
        >
          <input
            className="s-input"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        <button
          type="button"
          className="s-btn s-btn--primary"
          disabled={busy}
          onClick={create}
          style={{ marginTop: 6 }}
        >
          {busy ? "Qo'shilmoqda…" : "Qo'shish"}
        </button>
      </div>
    </>
  );
}
