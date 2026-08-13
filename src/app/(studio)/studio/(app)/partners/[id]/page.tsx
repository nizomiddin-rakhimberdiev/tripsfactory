import Link from "next/link";
import { notFound } from "next/navigation";
import { getPayloadClient } from "@/lib/studio/auth";
import { ToastProvider } from "@/components/studio/ui";
import { DeleteDoc } from "@/components/studio/DeleteDoc";
import {
  PartnerEditor,
  type PartnerInitial,
} from "@/components/studio/PartnerEditor";
import { IconChevron } from "@/components/studio/icons";
import { formatDateTime } from "@/lib/studio/datetime";
import { formatUsd } from "@/lib/currency";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  new: "Yangi",
  contacted: "Bog'lanildi",
  paid: "To'landi",
  closed: "Yopildi",
};

export default async function StudioPartnerEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const payload = await getPayloadClient();
  const raw = await payload
    .findByID({ collection: "partners", id, depth: 0 })
    .catch(() => null);
  if (!raw) notFound();

  const [scans, leads] = await Promise.all([
    payload.count({
      collection: "partner-visits",
      where: { partner: { equals: raw.id } },
    }),
    payload.find({
      collection: "leads",
      where: { partner: { equals: raw.id } },
      limit: 100,
      depth: 0,
      sort: "-createdAt",
    }),
  ]);

  const closed = leads.docs.filter(
    (l) => l.status === "paid" || l.status === "closed",
  ).length;
  const owed = closed * (raw.commissionUsd ?? 0);

  const initial: PartnerInitial = {
    id: raw.id,
    name: raw.name,
    code: raw.code,
    type: raw.type,
    commissionUsd: raw.commissionUsd,
    contactName: raw.contactName ?? "",
    contactPhone: raw.contactPhone ?? "",
    contactEmail: raw.contactEmail ?? "",
    active: Boolean(raw.active),
    assigned: raw.assigned !== false,
    notes: raw.notes ?? "",
  };

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
              href="/studio/partners"
              style={{ color: "inherit", textDecoration: "none" }}
            >
              Hamkorlar
            </Link>
            <IconChevron width={14} height={14} />
          </div>
          <h1>{raw.name}</h1>
        </div>
        <div className="s-pagehead__actions">
          <DeleteDoc collection="partners" id={raw.id} label={raw.name} />
        </div>
      </div>

      <div className="s-stats" style={{ marginBottom: 20 }}>
        <div className="s-stat">
          <div className="s-stat__top">QR skanlari</div>
          <div className="s-stat__value">{scans.totalDocs}</div>
          <div className="s-stat__sub">jami</div>
        </div>
        <div className="s-stat">
          <div className="s-stat__top">So&apos;rovlar</div>
          <div className="s-stat__value s-stat__value--accent">
            {leads.totalDocs}
          </div>
          <div className="s-stat__sub">
            {scans.totalDocs > 0
              ? `${Math.round((leads.totalDocs / scans.totalDocs) * 100)}% skanlardan`
              : "hali yo'q"}
          </div>
        </div>
        <div className="s-stat">
          <div className="s-stat__top">To&apos;langan</div>
          <div className="s-stat__value">{closed}</div>
          <div className="s-stat__sub">to&apos;lovi tasdiqlangan</div>
        </div>
        <div className="s-stat">
          <div className="s-stat__top">Cashback</div>
          <div className="s-stat__value s-stat__value--gold">
            {formatUsd(owed)}
          </div>
          <div className="s-stat__sub">
            {closed} × {formatUsd(raw.commissionUsd ?? 0)}
          </div>
        </div>
      </div>

      <PartnerEditor initial={initial} />

      <div className="s-section-title" style={{ marginTop: 28 }}>
        Shu hamkordan kelgan so&apos;rovlar
      </div>
      {leads.docs.length === 0 ? (
        <div className="s-table-wrap">
          <div className="s-empty">
            Hozircha bu hamkordan so&apos;rov kelmagan.
          </div>
        </div>
      ) : (
        <div className="s-table-wrap">
          <table className="s-table">
            <thead>
              <tr>
                <th>Ism</th>
                <th>Email</th>
                <th>Nima</th>
                <th>Holat</th>
                <th>Sana</th>
              </tr>
            </thead>
            <tbody>
              {leads.docs.map((l) => (
                <tr key={l.id}>
                  <td>{l.name}</td>
                  <td style={{ color: "var(--s-fg-muted)" }}>{l.email}</td>
                  <td>{l.tourSlug ?? "—"}</td>
                  <td>
                    <span
                      className={`s-badge ${l.status === "paid" || l.status === "closed" ? "s-badge--green" : "s-badge--gray"}`}
                    >
                      {STATUS_LABEL[l.status ?? "new"] ?? l.status}
                    </span>
                  </td>
                  <td style={{ color: "var(--s-fg-muted)" }}>
                    {formatDateTime(l.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </ToastProvider>
  );
}
