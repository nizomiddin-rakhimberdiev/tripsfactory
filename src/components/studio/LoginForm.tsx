"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { IconLock } from "./icons";

export function LoginForm() {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");
  /**
   * Whether the handler below is actually attached yet.
   *
   * Until React hydrates, this is plain HTML: a form with no action and no
   * method, so pressing the button makes the browser submit it as a GET to
   * the current URL — and the password goes into the address bar, the
   * browser's history and every access log on the way. Caught on the live
   * site, where hydration is slow enough to beat a fast typist; locally it
   * never happened.
   *
   * Disabling the button until then removes the pre-hydration path entirely.
   * `useSyncExternalStore` is how React itself answers "am I on the client
   * yet" — the server snapshot is false, the client snapshot is true, and it
   * costs no extra render.
   */
  const ready = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

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
        {/* Belt as well as braces: if the button is ever reachable before
            hydration, POST at least keeps the credentials out of the URL. */}
        <form className="s-form" method="post" onSubmit={onSubmit}>
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
            disabled={status === "loading" || !ready}
            style={{ height: 42, width: "100%", marginTop: 4 }}
          >
            {status === "loading" || !ready ? (
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
