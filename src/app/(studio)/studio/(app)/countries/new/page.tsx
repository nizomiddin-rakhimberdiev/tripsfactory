import { getPayloadClient } from "@/lib/studio/auth";
import { ToastProvider } from "@/components/studio/ui";
import { NewDoc } from "@/components/studio/NewDoc";

export const dynamic = "force-dynamic";

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
          <h1>Yangi davlat</h1>
          <p>Davlat sahifasi yaratish uchun quyidagilar shart.</p>
        </div>
      </div>
      <NewDoc
        collection="countries"
        title="Yangi davlat"
        slugFrom="name"
        fixed={{ published: false }}
        fields={[
          { name: "name", label: "Nomi (inglizcha)", kind: "text" },
          { name: "intro", label: "Qisqa tavsif", kind: "textarea" },
          {
            name: "region",
            label: "Mintaqa",
            kind: "select",
            options: regions.docs.map((r) => ({
              value: r.id,
              label: String(r.name ?? r.slug),
            })),
          },
          { name: "heroImage", label: "Asosiy rasm", kind: "media" },
        ]}
      />
    </ToastProvider>
  );
}
