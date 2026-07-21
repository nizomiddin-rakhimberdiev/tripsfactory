import Link from "next/link";
import { notFound } from "next/navigation";
import { getPayloadClient } from "@/lib/studio/auth";
import { ToastProvider } from "@/components/studio/ui";
import { CityEditor, type CityInitial } from "@/components/studio/CityEditor";
import type { MediaRef } from "@/components/studio/fields";
import { IconChevron } from "@/components/studio/icons";

export const dynamic = "force-dynamic";

type Ref = { id: number; url?: string | null; filename?: string | null };
type RawCity = {
  id: number;
  country?: Ref | number | null;
  recommendedNights: number;
  lat?: number | null;
  lng?: number | null;
  image?: Ref | number | null;
  gallery?: { id: number; url: string }[] | null;
  name?: Record<string, string>;
  intro?: Record<string, string>;
  attractions?: Record<string, { text: string }[]>;
};

export default async function StudioCityEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const payload = await getPayloadClient();
  const raw = (await payload
    .findByID({ collection: "cities", id, locale: "all", depth: 1 })
    .catch(() => null)) as RawCity | null;
  if (!raw) notFound();

  const countries = await payload.find({
    collection: "countries",
    limit: 100,
    depth: 0,
    locale: "en",
  });

  const country = raw.country;
  const image = raw.image;
  const initial: CityInitial = {
    id: raw.id,
    country: country == null ? null : typeof country === "object" ? country.id : country,
    recommendedNights: raw.recommendedNights,
    lat: raw.lat ?? null,
    lng: raw.lng ?? null,
    gallery: Array.isArray(raw.gallery) ? raw.gallery : [],
    image:
      image && typeof image === "object"
        ? ({ id: image.id, url: image.url, filename: image.filename } as MediaRef)
        : null,
    name: raw.name ?? {},
    intro: raw.intro ?? {},
    attractions: raw.attractions ?? {},
  };

  return (
    <ToastProvider>
      <div className="s-pagehead">
        <div className="s-pagehead__text">
          <div style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--s-fg-muted)", fontSize: 13, marginBottom: 2 }}>
            <Link href="/studio/cities" style={{ color: "inherit", textDecoration: "none" }}>Shaharlar</Link>
            <IconChevron width={14} height={14} />
          </div>
          <h1>{raw.name?.en ?? raw.name?.uz ?? "Shahar"}</h1>
        </div>
      </div>
      <CityEditor
        initial={initial}
        countries={countries.docs.map((c) => ({ id: c.id, name: c.name }))}
      />
    </ToastProvider>
  );
}
