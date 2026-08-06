import Link from "next/link";
import { getPayloadClient } from "@/lib/studio/auth";
import { ToastProvider } from "@/components/studio/ui";
import { TourEditor, type TourInitial } from "@/components/studio/TourEditor";
import { IconChevron } from "@/components/studio/icons";

export const dynamic = "force-dynamic";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://tripsfactory.com";

/**
 * A new tour opens the same editor an existing one does.
 *
 * The first version of this was a short form asking only for what Payload
 * refuses to create a record without, which then handed over to the real
 * editor. It worked, and it was the wrong shape: someone adding a tour met one
 * interface, someone changing a tour met another, and nothing explained why.
 *
 * So the draft below is simply an empty tour — `id: null` is what tells the
 * editor to create rather than update on save. The required fields are the
 * same ones marked with an asterisk everywhere else, and Payload rejects a
 * save that is missing them with those fields named.
 */
const EMPTY: TourInitial = {
  id: null,
  slug: "",
  type: "group",
  tier: "standard",
  durationDays: 1,
  priceFromUsd: null,
  singleSupplementUsd: null,
  featured: false,
  published: false,
  country: null,
  cities: [],
  heroImage: null,
  title: {},
  summary: {},
  itinerary: {},
  included: {},
  excluded: {},
  departures: [],
  route: [],
  gallery: [],
};

export default async function NewTourPage() {
  const payload = await getPayloadClient();
  const [countriesRes, citiesRes] = await Promise.all([
    payload.find({ collection: "countries", limit: 100, depth: 0, locale: "en" }),
    payload.find({ collection: "cities", limit: 200, depth: 0, locale: "en" }),
  ]);

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
            <Link
              href="/studio/tours"
              style={{ color: "inherit", textDecoration: "none" }}
            >
              Turlar
            </Link>
            <IconChevron width={14} height={14} />
          </div>
          <h1>Yangi tur</h1>
        </div>
      </div>
      <TourEditor
        initial={EMPTY}
        countries={countriesRes.docs.map((c) => ({
          id: c.id,
          name: String(c.name ?? c.slug),
        }))}
        cities={citiesRes.docs.map((c) => ({
          id: c.id,
          name: String(c.name ?? c.slug),
        }))}
        previewUrl={`${SITE_URL}/uz/tours`}
      />
    </ToastProvider>
  );
}
