"use client";

import { useRef, useState } from "react";
import { Link } from "@/i18n/navigation";

export type NavCountry = { slug: string; regionSlug: string; name: string };
export type NavRegion = { slug: string; name: string; countries: NavCountry[] };

type Labels = {
  tours: string;
  allTours: string;
  group: string;
  private: string;
  destinations: string;
  guide: string;
  about: string;
  contact: string;
  premium: string;
  menu: string;
};

/**
 * Top-level desktop nav. Deliberately sentence case: uppercase is a Latin-only
 * device — it does nothing in ja/zh and reads as shouting in Cyrillic — and at
 * this size it costs legibility for no elegance.
 */
const NAV_LINK =
  "text-sm text-muted transition-colors duration-300 hover:text-foreground";

function Caret({ open }: { open: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={`transition-transform ${open ? "rotate-180" : ""}`}
    >
      <path
        d="m6 9 6 6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Dropdown({
  label,
  children,
  width = "min-w-[220px]",
}: {
  label: string;
  children: React.ReactNode;
  width?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = () => {
    if (timer.current) clearTimeout(timer.current);
    setOpen(true);
  };
  const hide = () => {
    timer.current = setTimeout(() => setOpen(false), 120);
  };

  return (
    <div ref={ref} className="relative" onMouseEnter={show} onMouseLeave={hide}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1 ${NAV_LINK} ${open ? "text-foreground" : ""}`}
      >
        {label}
        <Caret open={open} />
      </button>
      <div
        className={`absolute left-1/2 top-full z-50 -translate-x-1/2 pt-3 transition-all ${
          open
            ? "visible translate-y-0 opacity-100"
            : "invisible translate-y-1 opacity-0"
        }`}
      >
        <div
          className={`${width} overflow-hidden rounded-xl border border-border bg-surface shadow-[0_12px_32px_rgb(0_0_0/0.10)]`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export function MainNav({
  labels,
  regions,
  premium,
  localeSwitcher,
}: {
  labels: Labels;
  regions: NavRegion[];
  premium: boolean;
  localeSwitcher: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeRegions = regions.filter((r) => r.countries.length > 0);

  const toursMenu = (
    <div className="p-2">
      <Link
        href="/tours"
        className="block rounded-lg px-3 py-2 font-medium hover:bg-surface-muted"
      >
        {labels.allTours}
      </Link>
      <Link
        href="/tours/group"
        className="block rounded-lg px-3 py-2 font-medium hover:bg-surface-muted"
      >
        {labels.group}
      </Link>
      <Link
        href="/tours/private"
        className="block rounded-lg px-3 py-2 font-medium hover:bg-surface-muted"
      >
        {labels.private}
      </Link>
    </div>
  );

  const destinationsMenu = (
    <div className="grid gap-4 p-4 sm:grid-cols-2">
      {activeRegions.map((r) => (
        <div key={r.slug}>
          <p className="tf-eyebrow mb-2 text-[11px] text-muted">{r.name}</p>
          <ul className="space-y-1">
            {r.countries.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/destinations/${c.regionSlug}/${c.slug}`}
                  className="block rounded-md px-2 py-1 text-sm hover:bg-surface-muted hover:text-primary"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );

  return (
    <>
      {/* desktop */}
      <nav className="hidden items-center gap-7 md:flex">
        <Dropdown label={labels.tours}>{toursMenu}</Dropdown>
        <Dropdown label={labels.destinations} width="min-w-[420px]">
          {destinationsMenu}
        </Dropdown>
        <Link href="/guide" className={NAV_LINK}>
          {labels.guide}
        </Link>
        <Link href="/about" className={NAV_LINK}>
          {labels.about}
        </Link>
        <Link href="/contact" className={NAV_LINK}>
          {labels.contact}
        </Link>
        <div className="ml-1 flex items-center gap-3">
          {localeSwitcher}
          {premium && (
            <Link
              href="/premium"
              className="rounded-full border border-accent/45 px-5 py-2 text-sm text-accent transition-colors duration-300 hover:border-accent hover:bg-accent/10"
            >
              {labels.premium}
            </Link>
          )}
        </div>
      </nav>

      {/* mobile trigger */}
      <div className="flex items-center gap-2 md:hidden">
        {localeSwitcher}
        <button
          type="button"
          aria-label={labels.menu}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((o) => !o)}
          className="rounded-md border border-border p-2"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d={mobileOpen ? "M6 6l12 12M18 6 6 18" : "M4 7h16M4 12h16M4 17h16"}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      {/* mobile panel — tapping any link closes it (navigation is client-side) */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="absolute inset-x-0 top-full max-h-[80vh] overflow-auto border-b border-border bg-surface p-4 shadow-lg md:hidden"
        >
          <p className="tf-eyebrow mb-1 text-[11px] text-muted">{labels.tours}</p>
          <div className="mb-4 flex flex-col gap-1">
            <Link
              href="/tours"
              className="rounded-md px-2 py-1.5 hover:bg-surface-muted"
            >
              {labels.allTours}
            </Link>
            <Link
              href="/tours/group"
              className="rounded-md px-2 py-1.5 hover:bg-surface-muted"
            >
              {labels.group}
            </Link>
            <Link
              href="/tours/private"
              className="rounded-md px-2 py-1.5 hover:bg-surface-muted"
            >
              {labels.private}
            </Link>
          </div>
          <p className="tf-eyebrow mb-1 text-[11px] text-muted">
            {labels.destinations}
          </p>
          <div className="mb-4 flex flex-col gap-1">
            {activeRegions.flatMap((r) =>
              r.countries.map((c) => (
                <Link
                  key={c.slug}
                  href={`/destinations/${c.regionSlug}/${c.slug}`}
                  className="rounded-md px-2 py-1.5 hover:bg-surface-muted"
                >
                  {c.name}
                </Link>
              )),
            )}
          </div>
          <div className="flex flex-col gap-1">
            <Link
              href="/guide"
              className="rounded-md px-2 py-1.5 hover:bg-surface-muted"
            >
              {labels.guide}
            </Link>
            <Link
              href="/about"
              className="rounded-md px-2 py-1.5 hover:bg-surface-muted"
            >
              {labels.about}
            </Link>
            <Link
              href="/contact"
              className="rounded-md px-2 py-1.5 hover:bg-surface-muted"
            >
              {labels.contact}
            </Link>
            {premium && (
              <Link
                href="/premium"
                className="mt-2 rounded-full border border-accent/45 px-3 py-2 text-center text-accent"
              >
                {labels.premium}
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}
