import type { Metadata } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { routing, locales } from "@/i18n/routing";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SITE_URL } from "@/lib/seo";
import "../globals.css";
import "leaflet/dist/leaflet.css";
import { skipPrerender } from "@/lib/prerender";

/**
 * Subsets are "latin" and "cyrillic" only. latin-ext was declared but is used
 * by nothing: 434 KB of CMS content across all four collections and all eight
 * locales contains not one character from that range, and neither do the UI
 * strings. German umlauts, Spanish and Italian accents and Turkish "ü" all live
 * in the basic latin subset. Dropping it takes the fonts fetched on every page
 * from nine files to six.
 *
 * The trade: content added later in Polish, Czech or Turkish (ł, ř, İ) would
 * fall back to a system face for those glyphs. Put "latin-ext" back on both
 * declarations if that happens.
 */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
});

// Editorial display face. Chosen over Playfair for two reasons: it carries
// Cyrillic (so ru/uz headings keep the brand voice instead of falling back to
// Inter), and it reads as couture rather than as a default web serif.
/**
 * `preload: false` is deliberate, and measured rather than assumed.
 *
 * Two weights x two styles x two subsets is eight faces, and next/font
 * preloads every declared face on every page. Instrumenting the homepage
 * showed the browser actually *uses* three: Cormorant normal 600 in two
 * subsets, and Inter. The rest — every italic, every 500, the Cyrillic cuts on
 * an English page — were fetched and left `unloaded`.
 *
 * That is roughly half of 185KB of fonts downloading in parallel with the LCP
 * element, which is the hero image. The image is 23KB and still took 2.2s to
 * arrive, because it was queuing behind fonts nothing on the page would render.
 *
 * Dropping the preload hint does not remove a single face: the CSS still
 * declares all eight, and the browser fetches whichever ones a page's text
 * actually matches. Inter keeps its preload — body copy is on every page and
 * is what paints first.
 */
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin", "cyrillic"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
  preload: false,
});

/**
 * Site-wide defaults. The description was a hard-coded English sentence, which
 * meant an Uzbek or Japanese page carried an English summary into search
 * results. It now comes from the same translated line the homepage hero uses,
 * so every locale describes itself in its own language.
 *
 * `metadataBase` is what lets the per-page canonical and share tags resolve to
 * absolute URLs; without it Next emits relative ones and neither Google nor
 * Telegram can use them.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "home" });

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: "TripsFactory — Silk Road Tours & Travel",
      template: "%s | TripsFactory",
    },
    description: t("heroSubtitle"),
  };
}

export function generateStaticParams() {
  if (skipPrerender) return [];
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("common");

  return (
    <html
      lang={locale}
      className={`${inter.variable} ${cormorant.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <NextIntlClientProvider>
          {/* Keyboard users land here first and can jump past the navigation. */}
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-100 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
          >
            {t("skipToContent")}
          </a>
          <Header />
          <main id="main" className="flex-1">
            {children}
          </main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
