import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { flags } from "@/lib/flags";
import { LocaleSwitcher } from "./LocaleSwitcher";

export async function Header() {
  const t = await getTranslations("nav");

  const links: { href: string; label: string }[] = [
    { href: "/tours", label: t("tours") },
    { href: "/destinations", label: t("destinations") },
    { href: "/guide", label: t("guide") },
    ...(flags.excursions
      ? [{ href: "/excursions", label: t("excursions") }]
      : []),
    { href: "/about", label: t("about") },
    { href: "/contact", label: t("contact") },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="text-lg font-bold tracking-tight">
          Trips<span className="text-primary">Factory</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-muted transition-colors hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
          {flags.premium && (
            <Link
              href="/premium"
              className="rounded-full border border-accent px-3 py-1 font-medium text-accent transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              {t("premium")}
            </Link>
          )}
        </nav>
        <LocaleSwitcher />
      </div>
    </header>
  );
}
