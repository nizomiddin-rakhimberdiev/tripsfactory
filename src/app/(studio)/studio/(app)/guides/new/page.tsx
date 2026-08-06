import { getPayloadClient } from "@/lib/studio/auth";
import { ToastProvider } from "@/components/studio/ui";
import { NewDoc } from "@/components/studio/NewDoc";

export const dynamic = "force-dynamic";

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
          <h1>Yangi maqola</h1>
          <p>Qo&apos;llanma maqolasi yaratish uchun quyidagilar shart.</p>
        </div>
      </div>
      <NewDoc
        collection="guides"
        title="Yangi maqola"
        slugFrom="title"
        fields={[
          { name: "title", label: "Sarlavha (inglizcha)", kind: "text" },
          {
            name: "country",
            label: "Davlat",
            kind: "select",
            options: countries.docs.map((c) => ({
              value: c.id,
              label: String(c.name ?? c.slug),
            })),
          },
        ]}
      />
    </ToastProvider>
  );
}
