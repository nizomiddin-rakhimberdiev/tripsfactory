import Link from "next/link";
import { ToastProvider } from "@/components/studio/ui";
import { RegionEditor, type RegionInitial } from "@/components/studio/RegionEditor";
import { IconChevron } from "@/components/studio/icons";

export const dynamic = "force-dynamic";

/** `id: null` is what tells the editor to create rather than update on save. */
const EMPTY: RegionInitial = { id: null, slug: "", name: {} };

export default function NewRegionPage() {
  return (
    <ToastProvider>
      <div className="s-pagehead">
        <div className="s-pagehead__text">
          <div style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--s-fg-muted)", fontSize: 13, marginBottom: 2 }}>
            <Link href="/studio/regions" style={{ color: "inherit", textDecoration: "none" }}>Mintaqalar</Link>
            <IconChevron width={14} height={14} />
          </div>
          <h1>Yangi mintaqa</h1>
        </div>
      </div>
      <RegionEditor initial={EMPTY} />
    </ToastProvider>
  );
}
