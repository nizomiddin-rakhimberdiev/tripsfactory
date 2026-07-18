import Link from "next/link";
import { notFound } from "next/navigation";
import { getPayloadClient } from "@/lib/studio/auth";
import { ToastProvider } from "@/components/studio/ui";
import { CountryEditor, type CountryInitial } from "@/components/studio/CountryEditor";
import type { MediaRef } from "@/components/studio/fields";
import { IconChevron } from "@/components/studio/icons";

export const dynamic = "force-dynamic";

type Ref = { id: number; url?: string | null; filename?: string | null };
type RawCountry = {
  id: number;
  region?: Ref | number | null;
  published?: boolean | null;
  heroImage?: Ref | number | null;
  name?: Record<string, string>;
  intro?: Record<string, string>;
  body?: Record<string, string>;
};

export default async function StudioCountryEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const payload = await getPayloadClient();
  const raw = (await payload
    .findByID({ collection: "countries", id, locale: "all", depth: 1 })
    .catch(() => null)) as RawCountry | null;
  if (!raw) notFound();

  const regions = await payload.find({
    collection: "regions",
    limit: 100,
    depth: 0,
    locale: "en",
  });

  const region = raw.region;
  const image = raw.heroImage;
  const initial: CountryInitial = {
    id: raw.id,
    region: region == null ? null : typeof region === "object" ? region.id : region,
    published: Boolean(raw.published),
    heroImage:
      image && typeof image === "object"
        ? ({ id: image.id, url: image.url, filename: image.filename } as MediaRef)
        : null,
    name: raw.name ?? {},
    intro: raw.intro ?? {},
    body: raw.body ?? {},
  };

  return (
    <ToastProvider>
      <div className="s-pagehead">
        <div className="s-pagehead__text">
          <div style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--s-fg-muted)", fontSize: 13, marginBottom: 2 }}>
            <Link href="/studio/countries" style={{ color: "inherit", textDecoration: "none" }}>Davlatlar</Link>
            <IconChevron width={14} height={14} />
          </div>
          <h1>{raw.name?.en ?? raw.name?.uz ?? "Davlat"}</h1>
        </div>
      </div>
      <CountryEditor
        initial={initial}
        regions={regions.docs.map((r) => ({ id: r.id, name: r.name }))}
      />
    </ToastProvider>
  );
}
