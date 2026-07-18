"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import type { NavCountry } from "./MainNav";

export function CountryBar({
  countryName,
  toursLabel,
  citiesLabel,
  switchLabel,
  siblings,
}: {
  countryName: string;
  toursLabel: string;
  citiesLabel: string;
  switchLabel: string;
  siblings: NavCountry[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="sticky top-[57px] z-40 border-b border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-5 overflow-x-auto px-4 py-2.5 text-sm">
        <span className="flex items-center gap-2 font-semibold">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
            <path
              d="M3 12h18M12 3c2.5 2.6 2.5 15.4 0 18M12 3c-2.5 2.6-2.5 15.4 0 18"
              stroke="currentColor"
              strokeWidth="1.6"
            />
          </svg>
          {countryName}
        </span>
        <a href="#tours" className="whitespace-nowrap text-muted hover:text-primary">
          {toursLabel}
        </a>
        <a href="#cities" className="whitespace-nowrap text-muted hover:text-primary">
          {citiesLabel}
        </a>

        {siblings.length > 0 && (
          <div
            className="relative ml-auto"
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
          >
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className="flex items-center gap-1 whitespace-nowrap text-muted hover:text-foreground"
            >
              {switchLabel}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path
                  d="m6 9 6 6 6-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            {open && (
              <div className="absolute right-0 top-full z-50 min-w-[180px] overflow-hidden rounded-xl border border-border bg-background py-1 shadow-lg">
                {siblings.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/destinations/${c.regionSlug}/${c.slug}`}
                    className="block px-4 py-2 hover:bg-surface hover:text-primary"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
