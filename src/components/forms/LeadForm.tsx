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
      <p className="rounded-xl border border-primary bg-surface p-6 text-center font-medium">
        {t("success")}
      </p>
    );
  }

  const inputClass =
    "w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none";

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <h2 className="text-2xl font-bold">{t("title")}</h2>
      {/* Honeypot: bots fill it, humans never see it */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block text-muted">{t("name")}</span>
          <input name="name" required maxLength={100} className={inputClass} />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-muted">{t("email")}</span>
          <input
            name="email"
            type="email"
            required
            maxLength={200}
            className={inputClass}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-muted">{t("phone")}</span>
          <input name="phone" maxLength={50} className={inputClass} />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-muted">{t("date")}</span>
          <input name="date" type="date" className={inputClass} />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-muted">{t("pax")}</span>
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
      <label className="block text-sm">
        <span className="mb-1 block text-muted">{t("message")}</span>
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
        className="rounded-full bg-primary px-8 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-60"
      >
        {status === "sending" ? t("sending") : t("submit")}
      </button>
      {status === "error" && (
        <p className="text-sm text-red-600">{t("error")}</p>
      )}
    </form>
  );
}
