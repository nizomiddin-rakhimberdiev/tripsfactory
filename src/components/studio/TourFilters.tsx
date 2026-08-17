"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { IconX } from "./icons";

export type FilterOption = { value: string; label: string };

/**
 * The filter bar over the tour list.
 *
 * Seventy-six tours in one feed is a list you scroll, not a list you use. The
 * state lives in the URL rather than in this component: a filtered view is
 * then something an operator can bookmark, send to a colleague, or come back
 * to with the browser's back button — and the server does the filtering, so
 * the page never holds seventy-six rows in order to show four.
 */
export function TourFilters({
  regions,
  countries,
  cities,
  total,
  shown,
}: {
  regions: FilterOption[];
  countries: FilterOption[];
  cities: FilterOption[];
  total: number;
  shown: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const [query, setQuery] = useState(params.get("q") ?? "");
  const typed = useRef<ReturnType<typeof setTimeout> | null>(null);

  // The select values come from the URL, so the back button and a pasted link
  // both restore the view exactly.
  const value = (key: string) => params.get(key) ?? "";

  /**
   * Changing a filter clears the narrower ones under it.
   *
   * Otherwise the selects disagree with each other: pick Uzbekistan, pick
   * Samarkand, then switch to China — the city list is now Chinese, but
   * `city=samarkand` is still in the URL and the page returns nothing, with
   * the select showing a city that is not in its own options.
   */
  const CLEARS: Record<string, string[]> = {
    region: ["country", "city"],
    country: ["city"],
  };

  function apply(next: Record<string, string>) {
    const merged = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v) merged.set(k, v);
      else merged.delete(k);
      for (const narrower of CLEARS[k] ?? []) merged.delete(narrower);
    }
    router.replace(`${pathname}?${merged.toString()}`, { scroll: false });
  }

  /** Typing filters as you go, but not once per keystroke. */
  useEffect(() => {
    if (query === (params.get("q") ?? "")) return;
    if (typed.current) clearTimeout(typed.current);
    typed.current = setTimeout(() => apply({ q: query.trim() }), 350);
    return () => {
      if (typed.current) clearTimeout(typed.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const active = ["q", "region", "country", "city", "type", "tier", "status"]
    .map((k) => params.get(k))
    .filter(Boolean).length;

  const select = (
    key: string,
    label: string,
    options: FilterOption[],
    anyLabel: string,
  ) => (
    <label className="s-filter">
      <span className="s-filter__label">{label}</span>
      <select
        className="s-select"
        value={value(key)}
        onChange={(e) => apply({ [key]: e.target.value })}
      >
        <option value="">{anyLabel}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <div className="s-filters">
      <div className="s-filters__row">
        <label className="s-filter s-filter--search">
          <span className="s-filter__label">Qidirish</span>
          <input
            className="s-input"
            type="search"
            value={query}
            placeholder="Tur nomi yoki manzili…"
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>

        {select("region", "Yo'nalish", regions, "Barcha yo'nalishlar")}
        {select("country", "Davlat", countries, "Barcha davlatlar")}
        {select("city", "Shahar", cities, "Barcha shaharlar")}
        {select(
          "type",
          "Turi",
          [
            { value: "group", label: "Guruh" },
            { value: "private", label: "Individual" },
            { value: "custom", label: "Buyurtma" },
          ],
          "Barcha turlar",
        )}
        {select(
          "tier",
          "Daraja",
          [
            { value: "standard", label: "Oddiy" },
            { value: "premium", label: "Premium" },
          ],
          "Barchasi",
        )}
        {select(
          "status",
          "Holat",
          [
            { value: "published", label: "Saytda" },
            { value: "draft", label: "Qoralama" },
          ],
          "Saytda va qoralama",
        )}
      </div>

      <div className="s-filters__foot">
        <span>
          {active > 0 ? (
            <>
              <strong>{shown}</strong> ta tur topildi ({total} tadan)
            </>
          ) : (
            <>Jami {total} ta tur</>
          )}
        </span>
        {active > 0 && (
          <button
            type="button"
            className="s-btn s-btn--sm"
            onClick={() => router.replace(pathname, { scroll: false })}
          >
            <IconX width={14} height={14} /> Filtrlarni tozalash
          </button>
        )}
      </div>
    </div>
  );
}
