"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { IconMapPin, IconCompass, IconSearch } from "@/components/icons";

export type HeroSearchCountry = {
  slug: string;
  regionSlug: string;
  name: string;
};

export type HeroSearchLabels = {
  destination: string;
  allDestinations: string;
  tourType: string;
  allTours: string;
  group: string;
  private: string;
  search: string;
};

/**
 * Hero search — a real navigator, not decoration. Destination routes to a
 * country page; tour type routes to the matching listing. Destination wins
 * when both are set. Every control leads somewhere that exists.
 */
export function HeroSearch({
  countries,
  labels,
}: {
  countries: HeroSearchCountry[];
  labels: HeroSearchLabels;
}) {
  const router = useRouter();
  const [destination, setDestination] = useState("");
  const [type, setType] = useState("/tours");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    router.push(destination || type);
  }

  const fieldClass =
    "flex flex-1 items-center gap-3 px-5 py-3 text-left text-foreground";

  return (
    <form
      onSubmit={submit}
      className="tf-glass mx-auto flex max-w-2xl flex-col items-stretch gap-2 rounded-3xl p-2 shadow-xl md:flex-row md:items-center md:gap-0 md:rounded-full"
    >
      <label className={`${fieldClass} md:border-r md:border-border`}>
        <IconMapPin className="text-lg text-primary" />
        <span className="sr-only">{labels.destination}</span>
        <select
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          className="w-full cursor-pointer bg-transparent text-sm outline-none"
        >
          <option value="">{labels.allDestinations}</option>
          {countries.map((c) => (
            <option key={c.slug} value={`/destinations/${c.regionSlug}/${c.slug}`}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      <label className={fieldClass}>
        <IconCompass className="text-lg text-primary" />
        <span className="sr-only">{labels.tourType}</span>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full cursor-pointer bg-transparent text-sm outline-none"
        >
          <option value="/tours">{labels.allTours}</option>
          <option value="/tours/group">{labels.group}</option>
          <option value="/tours/private">{labels.private}</option>
        </select>
      </label>

      <button
        type="submit"
        aria-label={labels.search}
        className="flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 font-medium text-primary-foreground transition-all hover:bg-primary-hover active:scale-95 md:h-12 md:w-12 md:p-0"
      >
        <IconSearch className="text-lg" />
        <span className="md:hidden">{labels.search}</span>
      </button>
    </form>
  );
}
