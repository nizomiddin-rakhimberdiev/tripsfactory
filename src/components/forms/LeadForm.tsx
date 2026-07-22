"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";

type Status = "idle" | "sending" | "success" | "error";

export function LeadForm({ tourSlug }: { tourSlug?: string }) {
  const t = useTranslations("form");
  const locale = useLocale();
  const [status, setStatus] = useState<Status>("idle");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    setStatus("sending");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, tourSlug, locale }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setStatus("success");
      form.reset();
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <p className="tf-headline rounded-2xl border border-primary/25 bg-primary/5 p-10 text-center text-xl text-primary">
        {t("success")}
      </p>
    );
  }

  const inputClass =
    "w-full rounded-xl border border-transparent bg-surface-muted px-4 py-3.5 text-sm transition-colors duration-300 focus:border-primary focus:bg-background";
  const labelClass = "mb-1.5 block text-sm text-muted";

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <h2 className="tf-headline text-2xl sm:text-3xl">{t("title")}</h2>
      {/* Honeypot: bots fill it, humans never see it */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className={labelClass}>{t("name")}</span>
          <input name="name" required maxLength={100} className={inputClass} />
        </label>
        <label className="block">
          <span className={labelClass}>{t("email")}</span>
          <input
            name="email"
            type="email"
            required
            maxLength={200}
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className={labelClass}>{t("phone")}</span>
          <input name="phone" maxLength={50} className={inputClass} />
        </label>
        <label className="block">
          <span className={labelClass}>{t("date")}</span>
          <input name="date" type="date" className={inputClass} />
        </label>
        <label className="block">
          <span className={labelClass}>{t("pax")}</span>
          <input
            name="pax"
            type="number"
            min={1}
            max={50}
            defaultValue={2}
            className={inputClass}
          />
        </label>
      </div>
      <label className="block">
        <span className={labelClass}>{t("message")}</span>
        <textarea
          name="message"
          rows={4}
          maxLength={2000}
          className={inputClass}
        />
      </label>
      <button
        type="submit"
        disabled={status === "sending"}
        className="tf-btn tf-btn-primary w-full disabled:opacity-60 sm:w-auto"
      >
        {status === "sending" ? t("sending") : t("submit")}
      </button>
      {status === "error" && (
        <p className="text-sm text-danger">{t("error")}</p>
      )}
    </form>
  );
}
