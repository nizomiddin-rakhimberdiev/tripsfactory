"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { IconMapPin, IconCompass, IconSearch } from "@/components/icons";

export type TourSearchCountry = {
  slug: string;
  regionSlug: string;
  name: string;
};

export type TourSearchLabels = {
  destination: string;
  allDestinations: string;
  tourType: string;
  allTours: string;
  group: string;
  private: string;
  search: string;
};

/**
 * Tour search — a real navigator, not decoration. Destination routes to a
 * country page; tour type routes to the matching listing. Destination wins
 * when both are set. Every control leads somewhere that exists.
 */
export function TourSearch({
  countries,
  labels,
}: {
  countries: TourSearchCountry[];
  labels: TourSearchLabels;
}) {
  const router = useRouter();
  const [destination, setDestination] = useState("");
  const [type, setType] = useState("/tours");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    router.push(destination || type);
  }

  // Focus lives on the field wrapper, not the bare <select>: the whole field
  // lights up, so keyboard users get a clear target without a ring cutting
  // through the glass pill.
  const fieldClass =
    "flex flex-1 items-center gap-3 rounded-full px-5 py-2.5 text-left text-foreground transition-colors focus-within:bg-white/45 focus-within:outline focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-primary";
  const fieldLabel = "tf-eyebrow block text-[10px] leading-none text-muted";
  const fieldSelect =
    "mt-1 w-full cursor-pointer truncate bg-transparent text-sm outline-none";

  return (
    <form
      onSubmit={submit}
      className="mx-auto flex max-w-2xl flex-col items-stretch gap-2 rounded-3xl border border-border bg-card p-2 md:flex-row md:items-center md:gap-0 md:rounded-full"
    >
      <label className={`${fieldClass} md:border-r md:border-border`}>
        <IconMapPin className="shrink-0 text-lg text-primary" />
        <span className="min-w-0 flex-1">
          <span className={fieldLabel}>{labels.destination}</span>
          <select
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className={fieldSelect}
          >
            <option value="">{labels.allDestinations}</option>
            {countries.map((c) => (
              <option
                key={c.slug}
                value={`/destinations/${c.regionSlug}/${c.slug}`}
              >
                {c.name}
              </option>
            ))}
          </select>
        </span>
      </label>

      <label className={fieldClass}>
        <IconCompass className="shrink-0 text-lg text-primary" />
        <span className="min-w-0 flex-1">
          <span className={fieldLabel}>{labels.tourType}</span>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className={fieldSelect}
          >
            <option value="/tours">{labels.allTours}</option>
            <option value="/tours/group">{labels.group}</option>
            <option value="/tours/private">{labels.private}</option>
          </select>
        </span>
      </label>

      <button
        type="submit"
        aria-label={labels.search}
        className="tf-btn tf-btn-primary px-6 py-3 md:h-12 md:w-12 md:p-0"
      >
        <IconSearch className="text-lg" />
        <span className="md:hidden">{labels.search}</span>
      </button>
    </form>
  );
}
