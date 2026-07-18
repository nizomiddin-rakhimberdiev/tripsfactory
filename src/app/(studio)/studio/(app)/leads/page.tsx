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

  const leads = res.docs.map((l) => ({
    id: l.id,
    name: l.name,
    email: l.email,
    phone: l.phone ?? null,
    tourSlug: l.tourSlug ?? null,
    pax: l.pax ?? null,
    message: l.message ?? null,
    status: l.status ?? "new",
    createdAt: l.createdAt,
  }));

  return (
    <ToastProvider>
      <div className="s-pagehead">
        <div className="s-pagehead__text">
          <h1>So'rovlar</h1>
          <p>Saytdan kelgan mijoz murojaatlari.</p>
        </div>
      </div>
      <LeadsManager initial={leads} />
    </ToastProvider>
  );
}
