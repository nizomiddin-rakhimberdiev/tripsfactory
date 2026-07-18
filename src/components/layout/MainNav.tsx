"use client";

import { useEffect, useRef, useState } from "react";
import { Link, usePathname } from "@/i18n/navigation";

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

function Caret() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
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
    <div
      ref={ref}
      className="relative"
      onMouseEnter={show}
      onMouseLeave={hide}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1 text-muted transition-colors hover:text-foreground ${
          open ? "text-foreground" : ""
        }`}
      >
        {label}
        <span
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        >
          <Caret />
        </span>
      </button>
      <div
        className={`absolute left-1/2 top-full z-50 -translate-x-1/2 pt-3 transition-all ${
          open
            ? "visible opacity-100 translate-y-0"
            : "invisible opacity-0 translate-y-1"
        }`}
      >
        <div
          className={`${width} overflow-hidden rounded-xl border border-border bg-background shadow-lg`}
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
  const pathname = usePathname();

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const activeRegions = regions.filter((r) => r.countries.length > 0);

  const toursMenu = (
    <div className="p-2">
      <Link
        href="/tours"
        className="block rounded-lg px-3 py-2 hover:bg-surface"
      >
        <span className="font-medium">{labels.allTours}</span>
      </Link>
      <Link
        href="/tours/group"
        className="block rounded-lg px-3 py-2 hover:bg-surface"
      >
        <span className="font-medium">{labels.group}</span>
      </Link>
      <Link
        href="/tours/private"
        className="block rounded-lg px-3 py-2 hover:bg-surface"
      >
        <span className="font-medium">{labels.private}</span>
      </Link>
    </div>
  );

  const destinationsMenu = (
    <div className="grid gap-4 p-4 sm:grid-cols-2">
      {activeRegions.map((r) => (
        <div key={r.slug}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
            {r.name}
          </p>
          <ul className="space-y-1">
            {r.countries.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/destinations/${c.regionSlug}/${c.slug}`}
                  className="block rounded-md px-2 py-1 text-sm hover:bg-surface hover:text-primary"
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
      <nav className="hidden items-center gap-6 text-sm md:flex">
        <Dropdown label={labels.tours}>{toursMenu}</Dropdown>
        <Dropdown label={labels.destinations} width="min-w-[420px]">
          {destinationsMenu}
        </Dropdown>
        <Link
          href="/guide"
          className="text-muted transition-colors hover:text-foreground"
        >
          {labels.guide}
        </Link>
        <Link
          href="/about"
          className="text-muted transition-colors hover:text-foreground"
        >
          {labels.about}
        </Link>
        <Link
          href="/contact"
          className="text-muted transition-colors hover:text-foreground"
        >
          {labels.contact}
        </Link>
        {premium && (
          <Link
            href="/premium"
            className="rounded-full border border-accent px-3 py-1 font-medium text-accent transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            {labels.premium}
          </Link>
        )}
        {localeSwitcher}
      </nav>

      {/* mobile trigger */}
      <div className="flex items-center gap-2 md:hidden">
        {localeSwitcher}
        <button
          type="button"
          aria-label={labels.menu}
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

      {/* mobile panel */}
      {mobileOpen && (
        <div className="absolute inset-x-0 top-full max-h-[80vh] overflow-auto border-b border-border bg-background p-4 shadow-lg md:hidden">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">
            {labels.tours}
          </p>
          <div className="mb-4 flex flex-col gap-1">
            <Link href="/tours" className="rounded-md px-2 py-1.5 hover:bg-surface">
              {labels.allTours}
            </Link>
            <Link href="/tours/group" className="rounded-md px-2 py-1.5 hover:bg-surface">
              {labels.group}
            </Link>
            <Link href="/tours/private" className="rounded-md px-2 py-1.5 hover:bg-surface">
              {labels.private}
            </Link>
          </div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">
            {labels.destinations}
          </p>
          <div className="mb-4 flex flex-col gap-1">
            {activeRegions.flatMap((r) =>
              r.countries.map((c) => (
                <Link
                  key={c.slug}
                  href={`/destinations/${c.regionSlug}/${c.slug}`}
                  className="rounded-md px-2 py-1.5 hover:bg-surface"
                >
                  {c.name}
                </Link>
              )),
            )}
          </div>
          <div className="flex flex-col gap-1">
            <Link href="/guide" className="rounded-md px-2 py-1.5 hover:bg-surface">
              {labels.guide}
            </Link>
            <Link href="/about" className="rounded-md px-2 py-1.5 hover:bg-surface">
              {labels.about}
            </Link>
            <Link href="/contact" className="rounded-md px-2 py-1.5 hover:bg-surface">
              {labels.contact}
            </Link>
            {premium && (
              <Link
                href="/premium"
                className="mt-1 rounded-full border border-accent px-3 py-1.5 text-center font-medium text-accent"
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
