import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

/**
 * The site had no 404 of its own, so a stale link landed on Next's raw
 * "This page could not be found." — English, unstyled, and with no way back
 * into the site. Broken links and old shared URLs are ordinary traffic; this
 * gives them the site's own voice and a route onward.
 *
 * Renders when a segment calls notFound(): a tour slug that no longer exists,
 * a deleted country or guide. Those are the cases real visitors hit.
 */
export default async function NotFound() {
  const [t, nav] = await Promise.all([
    getTranslations("error"),
    getTranslations("nav"),
  ]);

  return (
    <div className="tf-section mx-auto max-w-2xl px-4 text-center md:px-6">
      <p className="tf-eyebrow mb-4 text-xs text-primary">404</p>
      <h1 className="tf-display tf-display-2">{t("notFoundTitle")}</h1>
      <p className="tf-lead mx-auto mt-5 max-w-md">{t("notFoundBody")}</p>
      <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
        <Link href="/" className="tf-btn tf-btn-primary">
          {nav("home")}
        </Link>
        <Link href="/tours" className="tf-btn tf-btn-ghost">
          {nav("tours")}
        </Link>
      </div>
    </div>
  );
}
