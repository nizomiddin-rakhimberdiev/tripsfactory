import Link from "next/link";
import { getPayloadClient } from "@/lib/studio/auth";
import { ToastProvider } from "@/components/studio/ui";
import {
  MasterclassEditor,
  type MasterclassInitial,
} from "@/components/studio/MasterclassEditor";
import { IconChevron } from "@/components/studio/icons";

export const dynamic = "force-dynamic";

/** `id: null` is what tells the editor to create rather than update on save. */
const EMPTY: MasterclassInitial = {
  id: null,
  city: null,
  durationHours: 2,
  priceUsd: 0,
  youtubeUrl: "",
  published: false,
  heroImage: null,
  gallery: [],
  title: {},
  tagline: {},
  summary: {},
  description: {},
  included: {},
  reviews: {},
  sessions: [],
};

export default async function NewMasterclassPage() {
  const payload = await getPayloadClient();
  const cities = await payload.find({
    collection: "cities",
    limit: 200,
    depth: 0,
    locale: "en",
    sort: "name",
  });

  return (
    <ToastProvider>
      <div className="s-pagehead">
        <div className="s-pagehead__text">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              color: "var(--s-fg-muted)",
              fontSize: 13,
              marginBottom: 2,
            }}
          >
            <Link
              href="/studio/masterclasses"
              style={{ color: "inherit", textDecoration: "none" }}
            >
              Masterklasslar
            </Link>
            <IconChevron width={14} height={14} />
          </div>
          <h1>Yangi masterklass</h1>
        </div>
      </div>
      <MasterclassEditor
        initial={EMPTY}
        cities={cities.docs.map((c) => ({
          id: c.id,
          name: String(c.name ?? c.slug),
        }))}
      />
    </ToastProvider>
  );
}
