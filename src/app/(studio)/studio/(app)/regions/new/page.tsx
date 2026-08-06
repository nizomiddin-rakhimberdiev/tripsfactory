import { ToastProvider } from "@/components/studio/ui";
import { NewDoc } from "@/components/studio/NewDoc";

export const dynamic = "force-dynamic";

export default function NewRegionPage() {
  return (
    <ToastProvider>
      <div className="s-pagehead">
        <div className="s-pagehead__text">
          <h1>Yangi mintaqa</h1>
          <p>Davlatlar shu mintaqaga biriktiriladi.</p>
        </div>
      </div>
      <NewDoc
        collection="regions"
        title="Yangi mintaqa"
        slugFrom="name"
        fields={[{ name: "name", label: "Nomi (inglizcha)", kind: "text" }]}
      />
    </ToastProvider>
  );
}
