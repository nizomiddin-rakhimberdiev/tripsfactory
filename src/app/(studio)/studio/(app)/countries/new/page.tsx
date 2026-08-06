import Link from "next/link";
import { getPayloadClient } from "@/lib/studio/auth";
import { ToastProvider } from "@/components/studio/ui";
import { CountryEditor, type CountryInitial } from "@/components/studio/CountryEditor";
import { IconChevron } from "@/components/studio/icons";

export const dynamic = "force-dynamic";

/** `id: null` is what tells the editor to create rather than update on save. */
const EMPTY: CountryInitial = {
  id: null,
  region: null,
  published: false,
  heroImage: null,
  gallery: [],
  name: {},
  intro: {},
  body: {},
};

export default async function NewCountryPage() {
  const payload = await getPayloadClient();
  const regions = await payload.find({
    collection: "regions",
    limit: 100,
    depth: 0,
    locale: "en",
    sort: "name",
  });

  return (
    <ToastProvider>
      <div className="s-pagehead">
        <div className="s-pagehead__text">
          <div style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--s-fg-muted)", fontSize: 13, marginBottom: 2 }}>
            <Link href="/studio/countries" style={{ color: "inherit", textDecoration: "none" }}>Davlatlar</Link>
            <IconChevron width={14} height={14} />
          </div>
          <h1>Yangi davlat</h1>
        </div>
      </div>
      <CountryEditor
        initial={EMPTY}
        regions={regions.docs.map((r) => ({ id: r.id, name: String(r.name ?? r.slug) }))}
      />
    </ToastProvider>
  );
}
