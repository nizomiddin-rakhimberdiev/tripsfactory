"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  GUESTS_DROPDOWN_MAX,
  MAX_GUESTS,
  isValidEmail,
  isValidPhone,
} from "@/lib/validate";

type Status = "idle" | "sending" | "success" | "error";
type Field = "name" | "email" | "phone" | "pax";

export function LeadForm({
  tourSlug,
  kind = "tour",
  compact = false,
  heading,
  sessionDate,
  requirePhone = false,
  askGuests = false,
}: {
  tourSlug?: string;
  /** Which catalogue `tourSlug` names, so the Studio can say what was asked for. */
  kind?: "tour" | "excursion" | "masterclass";
  /**
   * Drops the travel-date input. A master class is booked for an announced
   * session on a fixed date, so asking a visitor to pick one is asking a
   * question that has already been answered above the form.
   */
  compact?: boolean;
  /** Overrides the "Request This Tour" heading where that is not what it is. */
  heading?: string;
  /** The session the page was showing when they wrote — recorded, not asked. */
  sessionDate?: string;
  /**
   * A booking is confirmed by phone, so for one the number is not optional.
   * An enquiry about an itinerary is a conversation that can start by email,
   * and demanding a phone number there costs enquiries.
   */
  requirePhone?: boolean;
  /** Show the party-size picker. Seats are what a master class sells. */
  askGuests?: boolean;
}) {
  const t = useTranslations("form");
  const locale = useLocale();
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});

  /**
   * Party size, in two parts.
   *
   * A dropdown of one to ten covers essentially every booking and is one tap.
   * Above that it stops being a seat count and becomes a conversation — a
   * private session, a coach party — so "more than 10" opens a plain number
   * field rather than a list nobody wants to scroll.
   */
  const [guests, setGuests] = useState("1");
  const [guestsMore, setGuestsMore] = useState("");
  const partySize = guests === "more" ? Number(guestsMore) : Number(guests);

  /** Runs on submit and again on every edit once a field has been marked. */
  function validate(data: {
    name: string;
    email: string;
    phone: string;
  }): Partial<Record<Field, string>> {
    const found: Partial<Record<Field, string>> = {};
    if (!data.name.trim()) found.name = t("errName");
    if (!isValidEmail(data.email)) found.email = t("errEmail");
    if (!data.phone.trim()) {
      if (requirePhone) found.phone = t("errPhoneRequired");
    } else if (!isValidPhone(data.phone)) {
      found.phone = t("errPhone");
    }
    if (askGuests) {
      if (!Number.isInteger(partySize) || partySize < 1 || partySize > MAX_GUESTS) {
        found.pax = t("errPeople");
      }
    }
    return found;
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries()) as Record<
      string,
      string
    >;

    const found = validate({
      name: data.name ?? "",
      email: data.email ?? "",
      phone: data.phone ?? "",
    });
    setErrors(found);
    if (Object.keys(found).length) {
      // Put the visitor where the problem is rather than leaving them to hunt.
      const first = (["name", "email", "phone", "pax"] as Field[]).find(
        (f) => found[f],
      );
      form.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }

    setStatus("sending");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          ...(askGuests ? { pax: partySize } : {}),
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
      setGuests("1");
      setGuestsMore("");
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
  const errorClass =
    "w-full rounded-xl border border-danger bg-surface-muted px-4 py-3.5 text-sm transition-colors duration-300 focus:border-danger focus:bg-background";
  const labelClass = "mb-1.5 block text-sm text-muted";

  /** Clears a field's error as soon as it is edited, never adds one mid-typing. */
  const clear = (field: Field) => () =>
    setErrors((e) => (e[field] ? { ...e, [field]: undefined } : e));

  /** Not a component — a helper that returns markup, so React never treats
      it as a new type on every render. */
  const fieldError = (field: Field) =>
    errors[field] ? (
      <span className="mt-1.5 block text-sm text-danger">{errors[field]}</span>
    ) : null;

  return (
    // noValidate: the browser's own bubbles are unstyled, English-only and
    // stop at the first field. The rules below are the same ones the server
    // applies, and they can speak the visitor's language.
    <form onSubmit={onSubmit} noValidate className="space-y-6">
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
            aria-invalid={Boolean(errors.name)}
            onChange={clear("name")}
            className={errors.name ? errorClass : inputClass}
          />
          {fieldError("name")}
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
            aria-invalid={Boolean(errors.email)}
            onChange={clear("email")}
            className={errors.email ? errorClass : inputClass}
          />
          {fieldError("email")}
        </label>
        <label className="block">
          <span className={labelClass}>
            {t("phone")}
            {requirePhone && <span className="text-danger"> *</span>}
          </span>
          <input
            name="phone"
            type="tel"
            required={requirePhone}
            maxLength={50}
            autoComplete="tel"
            inputMode="tel"
            placeholder="+998 90 123 45 67"
            aria-invalid={Boolean(errors.phone)}
            onChange={clear("phone")}
            className={errors.phone ? errorClass : inputClass}
          />
          {fieldError("phone")}
        </label>

        {askGuests && (
          <label className="block">
            <span className={labelClass}>{t("people")}</span>
            <select
              value={guests}
              onChange={(e) => {
                setGuests(e.target.value);
                clear("pax")();
              }}
              className={errors.pax && guests !== "more" ? errorClass : inputClass}
            >
              {Array.from({ length: GUESTS_DROPDOWN_MAX }, (_, i) => i + 1).map(
                (n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ),
              )}
              <option value="more">{t("peopleMore")}</option>
            </select>
            {guests !== "more" && fieldError("pax")}
          </label>
        )}

        {askGuests && guests === "more" && (
          <label className="block">
            <span className={labelClass}>{t("peopleExact")}</span>
            <input
              name="pax"
              type="number"
              min={GUESTS_DROPDOWN_MAX + 1}
              max={MAX_GUESTS}
              inputMode="numeric"
              value={guestsMore}
              onChange={(e) => {
                setGuestsMore(e.target.value);
                clear("pax")();
              }}
              aria-invalid={Boolean(errors.pax)}
              className={errors.pax ? errorClass : inputClass}
            />
            {fieldError("pax")}
          </label>
        )}

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
            {!askGuests && (
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
            )}
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
