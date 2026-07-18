import Link from "next/link";
import { notFound } from "next/navigation";
import { getPayloadClient } from "@/lib/studio/auth";
import { ToastProvider } from "@/components/studio/ui";
import { TourEditor, type TourInitial } from "@/components/studio/TourEditor";
import type { MediaRef } from "@/components/studio/fields";
import { IconChevron } from "@/components/studio/icons";

export const dynamic = "force-dynamic";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://tripsfactory.vercel.app";

type Ref = { id: number; url?: string | null; filename?: string | null; slug?: string };
type RawTour = {
  id: number;
  slug: string;
  type: string;
  tier: string;
  durationDays: number;
  priceFromUsd?: number | null;
  singleSupplementUsd?: number | null;
  featured?: boolean | null;
  published?: boolean | null;
  country?: Ref | number | null;
  cities?: (Ref | number)[] | null;
  heroImage?: Ref | number | null;
  title?: Record<string, string>;
  summary?: Record<string, string>;
  itinerary?: Record<string, { title: string; description: string }[]>;
  included?: Record<string, { text: string }[]>;
  excluded?: Record<string, { text: string }[]>;
  departures?: { date: string; priceUsd: number; status: string }[] | null;
};

function refId(r: Ref | number | null | undefined): number | null {
  if (r == null) return null;
  return typeof r === "object" ? r.id : r;
}
function mediaRef(r: Ref | number | null | undefined): MediaRef {
  return r && typeof r === "object"
    ? { id: r.id, url: r.url, filename: r.filename }
    : null;
}

export default async function StudioTourEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const payload = await getPayloadClient();

  const raw = (await payload
    .findByID({ collection: "tours", id, locale: "all", depth: 1 })
    .catch(() => null)) as RawTour | null;
  if (!raw) notFound();

  const [countriesRes, citiesRes] = await Promise.all([
    payload.find({ collection: "countries", limit: 100, depth: 0, locale: "en" }),
    payload.find({ collection: "cities", limit: 200, depth: 0, locale: "en" }),
  ]);

  const initial: TourInitial = {
    id: raw.id,
    slug: raw.slug,
    type: raw.type,
    tier: raw.tier,
    durationDays: raw.durationDays,
    priceFromUsd: raw.priceFromUsd ?? null,
    singleSupplementUsd: raw.singleSupplementUsd ?? null,
    featured: Boolean(raw.featured),
    published: Boolean(raw.published),
    country: refId(raw.country),
    cities: (raw.cities ?? []).map(refId).filter((x): x is number => x != null),
    heroImage: mediaRef(raw.heroImage),
    title: raw.title ?? {},
    summary: raw.summary ?? {},
    itinerary: raw.itinerary ?? {},
    included: raw.included ?? {},
    excluded: raw.excluded ?? {},
    departures: (raw.departures ?? []).map((d) => ({
      date: d.date,
      priceUsd: d.priceUsd,
      status: d.status,
    })),
  };

  const countrySlug =
    raw.country && typeof raw.country === "object" ? raw.country.slug : "";
  const previewUrl =
    countrySlug && raw.slug
      ? `${SITE_URL}/uz/tours/${countrySlug}/${raw.slug}`
      : `${SITE_URL}/uz/tours`;

  const title = raw.title?.en ?? raw.title?.uz ?? "Tur";

  return (
    <ToastProvider>
      <div className="s-pagehead">
        <div className="s-pagehead__text">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              color: "var(--s-fg-muted)",
              fontSize: 13,
              marginBottom: 2,
            }}
          >
            <Link href="/studio/tours" style={{ color: "inherit", textDecoration: "none" }}>
              Turlar
            </Link>
            <IconChevron width={14} height={14} />
          </div>
          <h1>{title}</h1>
        </div>
      </div>
      <TourEditor
        initial={initial}
        countries={countriesRes.docs.map((c) => ({ id: c.id, name: c.name }))}
        cities={citiesRes.docs.map((c) => ({ id: c.id, name: c.name }))}
        previewUrl={previewUrl}
      />
    </ToastProvider>
  );
}
