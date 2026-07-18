import { getPayloadClient } from "@/lib/studio/auth";
import { ToastProvider } from "@/components/studio/ui";
import { ContentEditor } from "@/components/studio/ContentEditor";
import type { LocaleMap, MediaRef } from "@/components/studio/fields";

export const dynamic = "force-dynamic";

type RawHero = { image?: unknown; title?: unknown; subtitle?: unknown };

function toHero(raw: RawHero | undefined) {
  const img = raw?.image as
    | { id: number; url?: string | null; filename?: string | null }
    | number
    | null
    | undefined;
  const image: MediaRef =
    img && typeof img === "object"
      ? { id: img.id, url: img.url, filename: img.filename }
      : null;
  return {
    image,
    title: (raw?.title as LocaleMap) ?? {},
    subtitle: (raw?.subtitle as LocaleMap) ?? {},
  };
}

export default async function StudioContentPage() {
  const payload = await getPayloadClient();
  const doc = (await payload.findGlobal({
    slug: "site-content",
    locale: "all",
    depth: 1,
  })) as unknown as { hero?: RawHero; premiumHero?: RawHero };

  return (
    <ToastProvider>
      <div className="s-pagehead">
        <div className="s-pagehead__text">
          <h1>Bosh sahifa</h1>
          <p>Bosh sahifa va Premium bo'lim uchun hero rasm va matnlar.</p>
        </div>
      </div>
      <ContentEditor
        initialHero={toHero(doc.hero)}
        initialPremium={toHero(doc.premiumHero)}
      />
    </ToastProvider>
  );
}
