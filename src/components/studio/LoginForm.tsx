"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconLock } from "./icons";

export function LoginForm() {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setStatus("loading");
    setError("");
    try {
      const res = await fetch("/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: form.get("email"),
          password: form.get("password"),
        }),
      });
      if (!res.ok) {
        setStatus("error");
        setError("Email yoki parol noto'g'ri.");
        return;
      }
      router.replace("/studio");
      router.refresh();
    } catch {
      setStatus("error");
      setError("Ulanishda xatolik. Qayta urinib ko'ring.");
    }
  }

  return (
    <div className="s-login">
      <div className="s-login__card">
        <div className="s-login__brand">
          <span className="s-brand__mark">TF</span>
          Trips<span className="s-brand__accent">Factory</span>
        </div>
        <p className="s-login__sub">Boshqaruv paneliga kirish</p>
        {status === "error" && <div className="s-login__error">{error}</div>}
        <form className="s-form" onSubmit={onSubmit}>
          <div className="s-field">
            <label className="s-field__label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="s-input"
              placeholder="siz@tripsfactory.uz"
            />
          </div>
          <div className="s-field">
            <label className="s-field__label" htmlFor="password">
              Parol
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="s-input"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            className="s-btn s-btn--primary"
            disabled={status === "loading"}
            style={{ height: 42, width: "100%", marginTop: 4 }}
          >
            {status === "loading" ? (
              <span className="s-spin" />
            ) : (
              <>
                <IconLock />
                Kirish
              </>
            )}
          </button>
        </form>
        <p className="s-login__foot">TripsFactory Studio</p>
      </div>
    </div>
  );
}
