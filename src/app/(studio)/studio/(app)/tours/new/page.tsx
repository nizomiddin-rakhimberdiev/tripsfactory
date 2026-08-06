import { getPayloadClient } from "@/lib/studio/auth";
import { ToastProvider } from "@/components/studio/ui";
import { NewDoc } from "@/components/studio/NewDoc";

export const dynamic = "force-dynamic";

export default async function NewTourPage() {
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
          <h1>Yangi tur</h1>
          <p>Tur yaratish uchun quyidagilar shart.</p>
        </div>
      </div>
      <NewDoc
        collection="tours"
        title="Yangi tur"
        slugFrom="title"
        fixed={{ tier: "standard", published: false }}
        fields={[
          { name: "title", label: "Tur nomi (inglizcha)", kind: "text" },
          { name: "summary", label: "Qisqa tavsif", kind: "textarea" },
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
            name: "type",
            label: "Turi",
            kind: "select",
            options: [
              { value: "group", label: "Guruh turi" },
              { value: "private", label: "Individual tur" },
              { value: "custom", label: "Buyurtma tur" },
            ],
          },
          {
            name: "durationDays",
            label: "Davomiyligi (kun)",
            kind: "number",
            min: 1,
          },
          { name: "heroImage", label: "Asosiy rasm", kind: "media" },
        ]}
      />
    </ToastProvider>
  );
}
