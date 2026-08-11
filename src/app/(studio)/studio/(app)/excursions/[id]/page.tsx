import Link from "next/link";
import { notFound } from "next/navigation";
import { getPayloadClient } from "@/lib/studio/auth";
import { ToastProvider } from "@/components/studio/ui";
import { DeleteDoc } from "@/components/studio/DeleteDoc";
import {
  ExcursionEditor,
  type ExcursionInitial,
} from "@/components/studio/ExcursionEditor";
import type { MediaRef } from "@/components/studio/fields";
import { IconChevron } from "@/components/studio/icons";

export const dynamic = "force-dynamic";

type Ref = { id: number; url?: string | null; filename?: string | null };
type RawExcursion = {
  id: number;
  city?: Ref | number | null;
  durationHours: number;
  priceUsd: number;
  published?: boolean | null;
  heroImage?: Ref | number | null;
  gallery?: { id: number; url: string }[] | null;
  title?: Record<string, string>;
  description?: Record<string, string>;
  included?: Record<string, { text: string }[]>;
};

export default async function StudioExcursionEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const payload = await getPayloadClient();
  const raw = (await payload
    .findByID({ collection: "excursions", id, locale: "all", depth: 1 })
    .catch(() => null)) as RawExcursion | null;
  if (!raw) notFound();

  const cities = await payload.find({
    collection: "cities",
    limit: 200,
    depth: 0,
    locale: "en",
    sort: "name",
  });

  const city = raw.city;
  const hero = raw.heroImage;
  const name = raw.title?.en ?? raw.title?.uz ?? "Ekskursiya";
  const initial: ExcursionInitial = {
    id: raw.id,
    city: city == null ? null : typeof city === "object" ? city.id : city,
    durationHours: raw.durationHours,
    priceUsd: raw.priceUsd,
    published: Boolean(raw.published),
    gallery: Array.isArray(raw.gallery) ? raw.gallery : [],
    heroImage:
      hero && typeof hero === "object"
        ? ({ id: hero.id, url: hero.url, filename: hero.filename } as MediaRef)
        : null,
    title: raw.title ?? {},
    description: raw.description ?? {},
    included: raw.included ?? {},
  };

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
              href="/studio/excursions"
              style={{ color: "inherit", textDecoration: "none" }}
            >
              Ekskursiyalar
            </Link>
            <IconChevron width={14} height={14} />
          </div>
          <h1>{name}</h1>
        </div>
        <div className="s-pagehead__actions">
          <DeleteDoc collection="excursions" id={raw.id} label={name} />
        </div>
      </div>
      <ExcursionEditor
        initial={initial}
        cities={cities.docs.map((c) => ({
          id: c.id,
          name: String(c.name ?? c.slug),
        }))}
      />
    </ToastProvider>
  );
}
