import Link from "next/link";
import { notFound } from "next/navigation";
import { getPayloadClient } from "@/lib/studio/auth";
import { ToastProvider } from "@/components/studio/ui";
import { DeleteDoc } from "@/components/studio/DeleteDoc";
import {
  MasterclassEditor,
  type MasterclassInitial,
  type Review,
  type Session,
} from "@/components/studio/MasterclassEditor";
import type { MediaRef } from "@/components/studio/fields";
import { IconChevron } from "@/components/studio/icons";

export const dynamic = "force-dynamic";

type Ref = { id: number; url?: string | null; filename?: string | null };
type RawMasterclass = {
  id: number;
  city?: Ref | number | null;
  durationHours: number;
  priceUsd: number;
  youtubeUrl?: string | null;
  published?: boolean | null;
  heroImage?: Ref | number | null;
  gallery?: { id: number; url: string }[] | null;
  sessions?: (Session & { id?: string })[] | null;
  title?: Record<string, string>;
  tagline?: Record<string, string>;
  summary?: Record<string, string>;
  description?: Record<string, string>;
  included?: Record<string, { text: string }[]>;
  reviews?: Record<string, Review[]>;
};

export default async function StudioMasterclassEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const payload = await getPayloadClient();
  const raw = (await payload
    .findByID({ collection: "masterclasses", id, locale: "all", depth: 1 })
    .catch(() => null)) as RawMasterclass | null;
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
  const name = raw.title?.en ?? raw.title?.uz ?? "Masterklass";
  const initial: MasterclassInitial = {
    id: raw.id,
    city: city == null ? null : typeof city === "object" ? city.id : city,
    durationHours: raw.durationHours,
    priceUsd: raw.priceUsd,
    youtubeUrl: raw.youtubeUrl ?? "",
    published: Boolean(raw.published),
    gallery: Array.isArray(raw.gallery) ? raw.gallery : [],
    heroImage:
      hero && typeof hero === "object"
        ? ({ id: hero.id, url: hero.url, filename: hero.filename } as MediaRef)
        : null,
    // Row ids are dropped: Payload assigns its own, and sending the old one
    // back on a write is what once collided with the primary key.
    sessions: (raw.sessions ?? []).map((s) => ({
      date: s.date?.slice(0, 10) ?? "",
      capacity: s.capacity,
      booked: s.booked ?? 0,
    })),
    title: raw.title ?? {},
    tagline: raw.tagline ?? {},
    summary: raw.summary ?? {},
    description: raw.description ?? {},
    included: raw.included ?? {},
    reviews: raw.reviews ?? {},
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
              href="/studio/masterclasses"
              style={{ color: "inherit", textDecoration: "none" }}
            >
              Masterklasslar
            </Link>
            <IconChevron width={14} height={14} />
          </div>
          <h1>{name}</h1>
        </div>
        <div className="s-pagehead__actions">
          <DeleteDoc collection="masterclasses" id={raw.id} label={name} />
        </div>
      </div>
      <MasterclassEditor
        initial={initial}
        cities={cities.docs.map((c) => ({
          id: c.id,
          name: String(c.name ?? c.slug),
        }))}
      />
    </ToastProvider>
  );
}
