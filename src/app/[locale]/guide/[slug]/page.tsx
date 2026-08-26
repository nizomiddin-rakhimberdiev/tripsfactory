import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getGuide, getGuides } from "@/lib/content";
import { pageMeta } from "@/lib/seo";
import { locales } from "@/i18n/routing";
import { skipPrerender } from "@/lib/prerender";
import { flags } from "@/lib/flags";
import { redirect } from "@/i18n/navigation";

type Params = { locale: string; slug: string };

// ISR safety net only: every Studio save triggers on-demand revalidation
// (revalidateSite in payload.config.ts), so content is never this stale. The
// window exists for edits made outside a Next request — seed scripts, raw SQL.
export const revalidate = 86400;

export async function generateStaticParams() {
  if (skipPrerender) return [];
  const guideList = await getGuides();
  return locales.flatMap((locale) =>
    guideList.map((g) => ({ locale, slug: g.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale, slug } = await params;
  const guide = await getGuide(slug, locale);
  if (!guide) return {};
  return pageMeta({
    locale,
    path: `/guide/${slug}`,
    title: guide.title,
    description: guide.sections[0]?.body,
  });
}

export default async function GuidePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  // Hidden, not deleted — see the note in flags.ts. An old link lands on the
  // home page rather than a 404, and works again the moment the flag flips.
  if (!flags.guide) redirect({ href: "/", locale });
  const guide = await getGuide(slug, locale);
  if (!guide) notFound();

  return (
    <article className="tf-section mx-auto max-w-3xl px-4 md:px-6">
      <h1 className="tf-display tf-display-2 mb-10">{guide.title}</h1>
      {guide.sections.map((s) => (
        <section key={s.heading} className="mb-10">
          <h2 className="tf-headline mb-3 text-2xl">{s.heading}</h2>
          <p className="leading-relaxed text-muted">{s.body}</p>
        </section>
      ))}
    </article>
  );
}
