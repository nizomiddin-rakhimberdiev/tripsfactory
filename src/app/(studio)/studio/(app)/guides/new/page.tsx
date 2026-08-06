import Link from "next/link";
import { getPayloadClient } from "@/lib/studio/auth";
import { ToastProvider } from "@/components/studio/ui";
import { GuideEditor, type GuideInitial } from "@/components/studio/GuideEditor";
import { IconChevron } from "@/components/studio/icons";

export const dynamic = "force-dynamic";

/** `id: null` is what tells the editor to create rather than update on save. */
const EMPTY: GuideInitial = { id: null, country: null, title: {}, sections: {} };

export default async function NewGuidePage() {
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
            <Link href="/studio/guides" style={{ color: "inherit", textDecoration: "none" }}>Qo&apos;llanmalar</Link>
            <IconChevron width={14} height={14} />
          </div>
          <h1>Yangi maqola</h1>
        </div>
      </div>
      <GuideEditor
        initial={EMPTY}
        countries={countries.docs.map((c) => ({ id: c.id, name: String(c.name ?? c.slug) }))}
      />
    </ToastProvider>
  );
}
