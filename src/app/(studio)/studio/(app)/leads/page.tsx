import { getPayloadClient } from "@/lib/studio/auth";
import { ToastProvider } from "@/components/studio/ui";
import { LeadsManager } from "@/components/studio/LeadsManager";

export const dynamic = "force-dynamic";

export default async function StudioLeadsPage() {
  const payload = await getPayloadClient();
  const res = await payload.find({
    collection: "leads",
    limit: 200,
    depth: 0,
    sort: "-createdAt",
  });

  /**
   * A lead stores a slug, which is not what the record is called. Three small
   * lookups turn "manti-master-class" into "Manti Master Class" for the whole
   * page — cheaper than one query per row, and the list is the screen where
   * somebody decides which enquiry to answer first.
   */
  const slugs = res.docs.map((l) => l.tourSlug).filter(Boolean) as string[];
  const titles = new Map<string, string>();
  if (slugs.length) {
    const where = { slug: { in: slugs } };
    const [tours, excursions, masterclasses] = await Promise.all([
      payload.find({ collection: "tours", where, limit: 200, depth: 0, locale: "en" }),
      payload.find({ collection: "excursions", where, limit: 200, depth: 0, locale: "en" }),
      payload.find({ collection: "masterclasses", where, limit: 200, depth: 0, locale: "en" }),
    ]);
    for (const d of [...tours.docs, ...excursions.docs, ...masterclasses.docs]) {
      if (d.slug && d.title) titles.set(d.slug, String(d.title));
    }
  }

  const leads = res.docs.map((l) => ({
    id: l.id,
    name: l.name,
    email: l.email,
    phone: l.phone ?? null,
    tourSlug: l.tourSlug ?? null,
    kind: l.kind ?? "tour",
    subject: l.tourSlug ? (titles.get(l.tourSlug) ?? l.tourSlug) : null,
    date: l.date ?? null,
    pax: l.pax ?? null,
    message: l.message ?? null,
    status: l.status ?? "new",
    createdAt: l.createdAt,
  }));

  return (
    <ToastProvider>
      <div className="s-pagehead">
        <div className="s-pagehead__text">
          <h1>So&apos;rovlar</h1>
          <p>Saytdan kelgan mijoz murojaatlari.</p>
        </div>
      </div>
      <LeadsManager initial={leads} />
    </ToastProvider>
  );
}
