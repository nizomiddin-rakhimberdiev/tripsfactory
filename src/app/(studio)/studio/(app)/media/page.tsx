import { ToastProvider } from "@/components/studio/ui";
import { MediaManager } from "@/components/studio/MediaManager";

export const dynamic = "force-dynamic";

export default function StudioMediaPage() {
  return (
    <ToastProvider>
      <div className="s-pagehead">
        <div className="s-pagehead__text">
          <h1>Rasmlar</h1>
          <p>Media kutubxonasi — rasm yuklash, ko'rish va o'chirish.</p>
        </div>
      </div>
      <MediaManager />
    </ToastProvider>
  );
}
