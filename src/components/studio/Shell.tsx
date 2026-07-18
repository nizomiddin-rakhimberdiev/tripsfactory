"use client";

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
  IconLogout,
} from "./icons";

const NAV: {
  href: string;
  label: string;
  Icon: (p: React.SVGProps<SVGSVGElement>) => React.ReactElement;
  group: string;
  badgeKey?: "leads";
}[] = [
  { href: "/studio", label: "Boshqaruv", Icon: IconGrid, group: "" },
  { href: "/studio/tours", label: "Turlar", Icon: IconCompass, group: "Kontent" },
  { href: "/studio/cities", label: "Shaharlar", Icon: IconPin, group: "Kontent" },
  { href: "/studio/guides", label: "Qo'llanmalar", Icon: IconBook, group: "Kontent" },
  { href: "/studio/content", label: "Bosh sahifa", Icon: IconHome, group: "Kontent" },
  { href: "/studio/media", label: "Rasmlar", Icon: IconImage, group: "Media" },
  {
    href: "/studio/leads",
    label: "So'rovlar",
    Icon: IconInbox,
    group: "Mijozlar",
    badgeKey: "leads",
  },
];

const TITLES: Record<string, string> = {
  "/studio": "Boshqaruv paneli",
  "/studio/tours": "Turlar",
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

  let lastGroup = "";
  return (
    <div className="s-shell">
      <aside className="s-sidebar">
        <div className="s-brand">
          <span className="s-brand__mark">TF</span>
          Trips<span className="s-brand__accent">Factory</span>
        </div>
        <nav className="s-nav">
          {NAV.map((item) => {
            const showGroup = item.group && item.group !== lastGroup;
            lastGroup = item.group || lastGroup;
            return (
              <div key={item.href}>
                {showGroup && <div className="s-nav__label">{item.group}</div>}
                <Link
                  href={item.href}
                  className={`s-nav__item ${isActive(item.href) ? "s-nav__item--active" : ""}`}
                >
                  <item.Icon />
                  {item.label}
                  {item.badgeKey === "leads" && newLeads > 0 && (
                    <span className="s-nav__badge">{newLeads}</span>
                  )}
                </Link>
              </div>
            );
          })}
        </nav>
        <div className="s-sidebar__foot">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="s-nav__item"
          >
            <IconGlobe />
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
