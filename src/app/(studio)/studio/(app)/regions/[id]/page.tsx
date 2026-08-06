import Link from "next/link";
import { notFound } from "next/navigation";
import { getPayloadClient } from "@/lib/studio/auth";
import { ToastProvider } from "@/components/studio/ui";
import { DeleteDoc } from "@/components/studio/DeleteDoc";
import { RegionEditor, type RegionInitial } from "@/components/studio/RegionEditor";
import { IconChevron } from "@/components/studio/icons";

export const dynamic = "force-dynamic";

type RawRegion = { id: number; slug: string; name?: Record<string, string> };

export default async function StudioRegionEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const payload = await getPayloadClient();

  const raw = (await payload
    .findByID({ collection: "regions", id, locale: "all", depth: 0 })
    .catch(() => null)) as RawRegion | null;
  if (!raw) notFound();

  const initial: RegionInitial = {
    id: raw.id,
    slug: raw.slug,
    name: raw.name ?? {},
  };
  const title = raw.name?.en ?? raw.name?.uz ?? "Mintaqa";

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
              href="/studio/regions"
              style={{ color: "inherit", textDecoration: "none" }}
            >
              Mintaqalar
            </Link>
            <IconChevron width={14} height={14} />
          </div>
          <h1>{title}</h1>
        </div>
        <div className="s-pagehead__actions">
          <DeleteDoc collection="regions" id={raw.id} label={title} />
        </div>
      </div>
      <RegionEditor initial={initial} />
    </ToastProvider>
  );
}
