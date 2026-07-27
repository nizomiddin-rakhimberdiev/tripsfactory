import { ToastProvider } from "@/components/studio/ui";
import { ImportPanel } from "@/components/studio/ImportPanel";

export const dynamic = "force-dynamic";

export default function StudioImportPage() {
  return (
    <ToastProvider>
      <div className="s-pagehead">
        <div className="s-pagehead__text">
          <h1>Google Sheets&apos;dan import</h1>
          <p>
            Mijoz to&apos;ldirgan jadvaldagi turlarni bazaga yozadi. Avval
            tekshiriladi — tasdiqlamaguningizcha hech narsa o&apos;zgarmaydi.
          </p>
        </div>
      </div>
      <ImportPanel />
    </ToastProvider>
  );
}
