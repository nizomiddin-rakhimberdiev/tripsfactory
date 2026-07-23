"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { IconMapPin, IconCompass, IconSearch } from "@/components/icons";
import { SelectMenu } from "@/components/SelectMenu";

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

  const destinationOptions = [
    { value: "", label: labels.allDestinations },
    ...countries.map((c) => ({
      value: `/destinations/${c.regionSlug}/${c.slug}`,
      label: c.name,
    })),
  ];

  const typeOptions = [
    { value: "/tours", label: labels.allTours },
    { value: "/tours/group", label: labels.group },
    { value: "/tours/private", label: labels.private },
  ];

  return (
    <form
      onSubmit={submit}
      className="mx-auto flex max-w-2xl flex-col items-stretch gap-2 rounded-3xl border border-border bg-card p-2 md:flex-row md:items-center md:gap-0 md:rounded-full"
    >
      <SelectMenu
        label={labels.destination}
        value={destination}
        onChange={setDestination}
        options={destinationOptions}
        icon={<IconMapPin className="shrink-0 text-lg text-primary" />}
        className="flex-1 md:border-r md:border-border"
      />

      <SelectMenu
        label={labels.tourType}
        value={type}
        onChange={setType}
        options={typeOptions}
        icon={<IconCompass className="shrink-0 text-lg text-primary" />}
        className="flex-1"
      />

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
