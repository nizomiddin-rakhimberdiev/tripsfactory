"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";

type Status = "idle" | "sending" | "success" | "error";

export function LeadForm({
  tourSlug,
  kind = "tour",
  compact = false,
  heading,
  sessionDate,
}: {
  tourSlug?: string;
  /** Which catalogue `tourSlug` names, so the Studio can say what was asked for. */
  kind?: "tour" | "excursion" | "masterclass";
  /**
   * Drops the travel-date and party-size inputs. A master class is booked for
   * an announced session on a fixed date, so asking a visitor to pick one is
   * asking a question that has already been answered above the form.
   */
  compact?: boolean;
  /** Overrides the "Request This Tour" heading where that is not what it is. */
  heading?: string;
  /** The session the page was showing when they wrote — recorded, not asked. */
  sessionDate?: string;
}) {
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
        body: JSON.stringify({
          ...data,
          ...(sessionDate && !data.date ? { date: sessionDate } : {}),
          tourSlug,
          kind,
          locale,
          // Referral fallback. The QR redirect sets a server cookie, which is
          // what normally carries this; ?ref= covers a browser that refuses
          // cookies and a link somebody shared by hand. Read at submit time
          // rather than through useSearchParams, which would force a Suspense
          // boundary onto every statically rendered page carrying this form.
          ...(typeof window !== "undefined"
            ? (() => {
                const ref = new URLSearchParams(window.location.search).get(
                  "ref",
                );
                return ref ? { ref } : {};
              })()
            : {}),
        }),
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
      // role="status" so a screen reader announces the outcome; without it the
      // form simply vanished and a non-sighted visitor had no idea whether the
      // enquiry had been sent.
      <p
        role="status"
        className="tf-headline rounded-2xl border border-primary/25 bg-primary/5 p-8 text-center text-xl text-primary sm:p-10 sm:text-2xl"
      >
        {t("success")}
      </p>
    );
  }

  // Today, for the date field's min. Computed per render rather than at module
  // scope so a long-lived tab does not keep yesterday's date as the floor.
  const today = new Date().toISOString().slice(0, 10);

  const inputClass =
    "w-full rounded-xl border border-transparent bg-surface-muted px-4 py-3.5 text-sm transition-colors duration-300 focus:border-primary focus:bg-background";
  const labelClass = "mb-1.5 block text-sm text-muted";

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* "Request This Tour" is only true when there is a tour. On /contact the
          same form carried that heading under an h1 reading "Contact Us", which
          told the visitor they were requesting something they had not chosen.
          The page's own header already introduces the form there, so the
          heading is shown only where it is accurate — no new copy invented, and
          the tour pages are unchanged. */}
      {(heading || tourSlug) && (
        <h2 className="tf-headline text-2xl sm:text-3xl">
          {heading ?? t("title")}
        </h2>
      )}
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
          <input
            name="name"
            required
            maxLength={100}
            autoComplete="name"
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className={labelClass}>{t("email")}</span>
          <input
            name="email"
            type="email"
            required
            maxLength={200}
            autoComplete="email"
            inputMode="email"
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className={labelClass}>{t("phone")}</span>
          <input
            name="phone"
            type="tel"
            maxLength={50}
            autoComplete="tel"
            inputMode="tel"
            className={inputClass}
          />
        </label>
        {!compact && (
          <>
            <label className="block">
              <span className={labelClass}>{t("date")}</span>
              <input
                name="date"
                type="date"
                min={today}
                className={inputClass}
              />
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
          </>
        )}
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
      {/* aria-live on a permanent node, not on the message itself: a region
          inserted at the same moment it gains content is often missed. Empty
          until there is something to say. */}
      <p role="alert" aria-live="assertive" className="text-sm text-danger">
        {status === "error" ? t("error") : ""}
      </p>
    </form>
  );
}
