import Link from "next/link";
import { getPayloadClient } from "@/lib/studio/auth";
import { ToastProvider } from "@/components/studio/ui";
import {
  ExcursionEditor,
  type ExcursionInitial,
} from "@/components/studio/ExcursionEditor";
import { IconChevron } from "@/components/studio/icons";

export const dynamic = "force-dynamic";

/** `id: null` is what tells the editor to create rather than update on save. */
const EMPTY: ExcursionInitial = {
  id: null,
  city: null,
  durationHours: 4,
  priceUsd: 0,
  published: false,
  heroImage: null,
  gallery: [],
  title: {},
  description: {},
  included: {},
};

export default async function NewExcursionPage() {
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
              href="/studio/excursions"
              style={{ color: "inherit", textDecoration: "none" }}
            >
              Ekskursiyalar
            </Link>
            <IconChevron width={14} height={14} />
          </div>
          <h1>Yangi ekskursiya</h1>
        </div>
      </div>
      <ExcursionEditor
        initial={EMPTY}
        cities={cities.docs.map((c) => ({
          id: c.id,
          name: String(c.name ?? c.slug),
        }))}
      />
    </ToastProvider>
  );
}
