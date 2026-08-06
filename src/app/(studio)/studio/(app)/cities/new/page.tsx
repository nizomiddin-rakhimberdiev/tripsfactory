import { getPayloadClient } from "@/lib/studio/auth";
import { ToastProvider } from "@/components/studio/ui";
import { NewDoc } from "@/components/studio/NewDoc";

export const dynamic = "force-dynamic";

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
          <h1>Yangi shahar</h1>
          <p>Shahar sahifasi yaratish uchun quyidagilar shart.</p>
        </div>
      </div>
      <NewDoc
        collection="cities"
        title="Yangi shahar"
        slugFrom="name"
        fields={[
          { name: "name", label: "Nomi (inglizcha)", kind: "text" },
          { name: "intro", label: "Qisqa tavsif", kind: "textarea" },
          {
            name: "country",
            label: "Davlat",
            kind: "select",
            options: countries.docs.map((c) => ({
              value: c.id,
              label: String(c.name ?? c.slug),
            })),
          },
          {
            name: "recommendedNights",
            label: "Tavsiya etilgan kechalar",
            kind: "number",
            min: 1,
          },
          { name: "image", label: "Rasm", kind: "media" },
        ]}
      />
    </ToastProvider>
  );
}
