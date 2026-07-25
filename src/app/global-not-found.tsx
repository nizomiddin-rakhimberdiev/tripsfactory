/* eslint-disable @next/next/no-html-link-for-pages --
   Next serves this page for URLs that matched no route and, in its own words,
   "skips rendering" the app to do so. There is no router on the page, so a
   next/link would have nothing to navigate with; leaving the 404 requires a
   real document load either way. */
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

/**
 * The site's 404.
 *
 * This is `global-not-found` rather than a `not-found.tsx` under [locale]
 * because of how this app is shaped: the root layout lives in a top-level
 * dynamic segment and there are three root layouts ([locale], payload, studio).
 * Next documents that combination as exactly the case a route-level not-found
 * cannot serve — verified here, where both a [locale]-level and a
 * segment-level not-found.tsx were bypassed in favour of the bare error shell.
 *
 * This file renders outside the normal tree, so it brings its own html/body,
 * its own stylesheet, and one font rather than the site's two. It also has no
 * locale to read, which is why the copy is English — noted as a limitation
 * rather than solved, since guessing a language from a URL that matched no
 * route would be worse than a language the visitor can at least navigate.
 */
const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "Page not found — TripsFactory",
  robots: { index: false, follow: true },
};

export default function GlobalNotFound() {
  return (
    <html lang="en" className={`${inter.className} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <main className="flex flex-1 items-center justify-center px-4 py-20">
          <div className="mx-auto max-w-lg text-center">
            <p className="tf-eyebrow mb-4 text-xs text-primary">404</p>
            <h1 className="tf-display tf-display-2 text-primary">
              TripsFactory
            </h1>
            <p className="tf-lead mx-auto mt-6 max-w-sm">
              We couldn&rsquo;t find that page. The link may be out of date, or
              the page may have moved.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <a href="/en" className="tf-btn tf-btn-primary">
                Home
              </a>
              <a href="/en/tours" className="tf-btn tf-btn-ghost">
                Tours
              </a>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
