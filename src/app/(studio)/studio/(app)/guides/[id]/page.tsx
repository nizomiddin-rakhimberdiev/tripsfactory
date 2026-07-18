import Link from "next/link";
import { notFound } from "next/navigation";
import { getPayloadClient } from "@/lib/studio/auth";
import { ToastProvider } from "@/components/studio/ui";
import { GuideEditor, type GuideInitial } from "@/components/studio/GuideEditor";
import { IconChevron } from "@/components/studio/icons";

export const dynamic = "force-dynamic";

type Ref = { id: number };
type RawGuide = {
  id: number;
  country?: Ref | number | null;
  title?: Record<string, string>;
  sections?: Record<string, { heading: string; body: string }[]>;
};

export default async function StudioGuideEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const payload = await getPayloadClient();
  const raw = (await payload
    .findByID({ collection: "guides", id, locale: "all", depth: 1 })
    .catch(() => null)) as RawGuide | null;
  if (!raw) notFound();

  const countries = await payload.find({
    collection: "countries",
    limit: 100,
    depth: 0,
    locale: "en",
  });

  const country = raw.country;
  const initial: GuideInitial = {
    id: raw.id,
    country: country == null ? null : typeof country === "object" ? country.id : country,
    title: raw.title ?? {},
    sections: raw.sections ?? {},
  };

  return (
    <ToastProvider>
      <div className="s-pagehead">
        <div className="s-pagehead__text">
          <div style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--s-fg-muted)", fontSize: 13, marginBottom: 2 }}>
            <Link href="/studio/guides" style={{ color: "inherit", textDecoration: "none" }}>Qo'llanmalar</Link>
            <IconChevron width={14} height={14} />
          </div>
          <h1>{raw.title?.en ?? raw.title?.uz ?? "Qo'llanma"}</h1>
        </div>
      </div>
      <GuideEditor
        initial={initial}
        countries={countries.docs.map((c) => ({ id: c.id, name: c.name }))}
      />
    </ToastProvider>
  );
}
