"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  IconGrid,
  IconCompass,
  IconPin,
  IconBook,
  IconHome,
  IconImage,
  IconInbox,
  IconGlobe,
  IconChevron,
  IconExternal,
  IconLogout,
} from "./icons";

type NavItem = {
  href: string;
  label: string;
  Icon: (p: React.SVGProps<SVGSVGElement>) => React.ReactElement;
  badgeKey?: "leads";
};

/**
 * Explicit groups rather than a flat list with a running "last group" marker —
 * the shape of the navigation is now visible in the data.
 */
const GROUPS: { id: string; label: string | null; items: NavItem[] }[] = [
  {
    id: "overview",
    label: null,
    items: [{ href: "/studio", label: "Boshqaruv", Icon: IconGrid }],
  },
  {
    id: "content",
    label: "Kontent",
    items: [
      { href: "/studio/tours", label: "Turlar", Icon: IconCompass },
      { href: "/studio/countries", label: "Davlatlar", Icon: IconGlobe },
      { href: "/studio/cities", label: "Shaharlar", Icon: IconPin },
      { href: "/studio/guides", label: "Qo'llanmalar", Icon: IconBook },
      { href: "/studio/content", label: "Bosh sahifa", Icon: IconHome },
    ],
  },
  {
    id: "media",
    label: "Media",
    items: [{ href: "/studio/media", label: "Rasmlar", Icon: IconImage }],
  },
  {
    id: "clients",
    label: "Mijozlar",
    items: [
      {
        href: "/studio/leads",
        label: "So'rovlar",
        Icon: IconInbox,
        badgeKey: "leads",
      },
    ],
  },
];

const TITLES: Record<string, string> = {
  "/studio": "Boshqaruv paneli",
  "/studio/tours": "Turlar",
  "/studio/countries": "Davlatlar",
  "/studio/cities": "Shaharlar",
  "/studio/guides": "Qo'llanmalar",
  "/studio/content": "Bosh sahifa",
  "/studio/media": "Rasmlar",
  "/studio/leads": "So'rovlar",
};

export function Shell({
  email,
  newLeads,
  children,
}: {
  email: string;
  newLeads: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const isActive = (href: string) =>
    href === "/studio" ? pathname === "/studio" : pathname.startsWith(href);

  const title =
    TITLES[
      Object.keys(TITLES)
        .filter((h) => (h === "/studio" ? pathname === h : pathname.startsWith(h)))
        .sort((a, b) => b.length - a.length)[0] ?? "/studio"
    ] ?? "Studio";

  async function logout() {
    await fetch("/api/users/logout", {
      method: "POST",
      credentials: "include",
    });
    router.replace("/studio/login");
    router.refresh();
  }

  return (
    <div className="s-shell">
      <aside className="s-sidebar">
        <div className="s-brand">
          <span className="s-brand__mark">TF</span>
          Trips<span className="s-brand__accent">Factory</span>
        </div>

        <nav className="s-nav">
          {GROUPS.map((group) => {
            const isCollapsed = collapsed[group.id] ?? false;
            // A collapsed group still shows the page you are on, so the
            // sidebar never hides your own location.
            const holdsActive = group.items.some((i) => isActive(i.href));
            const visible =
              isCollapsed && !holdsActive
                ? []
                : isCollapsed
                  ? group.items.filter((i) => isActive(i.href))
                  : group.items;

            return (
              <div key={group.id} className="s-nav__group">
                {group.label && (
                  <button
                    type="button"
                    className="s-nav__label"
                    aria-expanded={!isCollapsed}
                    onClick={() =>
                      setCollapsed((c) => ({ ...c, [group.id]: !isCollapsed }))
                    }
                  >
                    {group.label}
                    <IconChevron
                      width={12}
                      height={12}
                      className={`s-nav__chev ${isCollapsed ? "" : "s-nav__chev--open"}`}
                    />
                  </button>
                )}
                {visible.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isActive(item.href) ? "page" : undefined}
                    className={`s-nav__item ${isActive(item.href) ? "s-nav__item--active" : ""}`}
                  >
                    <item.Icon />
                    {item.label}
                    {item.badgeKey === "leads" && newLeads > 0 && (
                      <span className="s-nav__badge">{newLeads}</span>
                    )}
                  </Link>
                ))}
              </div>
            );
          })}
        </nav>

        <div className="s-sidebar__foot">
          <a href="/" target="_blank" rel="noreferrer" className="s-nav__item">
            <IconExternal />
            Saytni ochish
          </a>
          <div className="s-user">
            <span className="s-user__avatar">
              {email.slice(0, 1).toUpperCase()}
            </span>
            <span className="s-user__email">{email}</span>
            <button
              className="s-btn s-btn--icon s-btn--ghost"
              onClick={logout}
              title="Chiqish"
              aria-label="Chiqish"
              style={{ marginLeft: "auto" }}
            >
              <IconLogout />
            </button>
          </div>
        </div>
      </aside>

      <div className="s-main">
        <header className="s-topbar">
          <span className="s-topbar__title">{title}</span>
        </header>
        <main className="s-content">{children}</main>
      </div>
    </div>
  );
}
