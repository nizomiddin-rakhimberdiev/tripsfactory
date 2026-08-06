import Link from "next/link";
import { getPayloadClient } from "@/lib/studio/auth";
import { ToastProvider } from "@/components/studio/ui";
import { CityEditor, type CityInitial } from "@/components/studio/CityEditor";
import { IconChevron } from "@/components/studio/icons";

export const dynamic = "force-dynamic";

/** `id: null` is what tells the editor to create rather than update on save. */
const EMPTY: CityInitial = {
  id: null,
  country: null,
  recommendedNights: 1,
  lat: null,
  lng: null,
  gallery: [],
  image: null,
  name: {},
  intro: {},
  attractions: {},
};

export default async function NewCityPage() {
  const payload = await getPayloadClient();
  const countries = await payload.find({
    collection: "countries",
    limit: 200,
    depth: 0,
    locale: "en",
    sort: "name",
  });

  return (
    <ToastProvider>
      <div className="s-pagehead">
        <div className="s-pagehead__text">
          <div style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--s-fg-muted)", fontSize: 13, marginBottom: 2 }}>
            <Link href="/studio/cities" style={{ color: "inherit", textDecoration: "none" }}>Shaharlar</Link>
            <IconChevron width={14} height={14} />
          </div>
          <h1>Yangi shahar</h1>
        </div>
      </div>
      <CityEditor
        initial={EMPTY}
        countries={countries.docs.map((c) => ({ id: c.id, name: String(c.name ?? c.slug) }))}
      />
    </ToastProvider>
  );
}
