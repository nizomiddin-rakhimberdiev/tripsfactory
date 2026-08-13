import Link from "next/link";
import { getPayloadClient } from "@/lib/studio/auth";
import { formatUsd } from "@/lib/currency";

export const dynamic = "force-dynamic";

const TYPE_LABEL: Record<string, string> = {
  hotel: "Mehmonxona",
  ota: "OTA",
  tour_operator: "Turoperator",
  other: "Boshqa",
};

/**
 * Who is sending guests, and what they have earned.
 *
 * The numbers are counted here rather than stored on the partner: a stored
 * total is a second copy of the truth that drifts the first time a lead is
 * deleted or a status corrected, and this is the table a cashback conversation
 * is held over.
 */
export default async function StudioPartnersPage() {
  const payload = await getPayloadClient();
  const partners = await payload.find({
    collection: "partners",
    limit: 200,
    depth: 0,
    sort: "name",
  });

  const rows = await Promise.all(
    partners.docs.map(async (p) => {
      const [scans, enquiries, closed] = await Promise.all([
        payload.count({
          collection: "partner-visits",
          where: { partner: { equals: p.id } },
        }),
        payload.count({
          collection: "leads",
          where: { partner: { equals: p.id } },
        }),
        payload.count({
          collection: "leads",
          where: {
            and: [{ partner: { equals: p.id } }, { status: { equals: "closed" } }],
          },
        }),
      ]);
      return {
        ...p,
        scans: scans.totalDocs,
        enquiries: enquiries.totalDocs,
        closed: closed.totalDocs,
      };
    }),
  );

  const totals = rows.reduce(
    (acc, r) => ({
      scans: acc.scans + r.scans,
      enquiries: acc.enquiries + r.enquiries,
      closed: acc.closed + r.closed,
      owed: acc.owed + r.closed * (r.commissionUsd ?? 0),
    }),
    { scans: 0, enquiries: 0, closed: 0, owed: 0 },
  );

  return (
    <>
      <div className="s-pagehead">
        <div className="s-pagehead__text">
          <h1>Hamkorlar</h1>
          <p>
            Mijoz olib keladigan mehmonxonalar, platformalar va turoperatorlar.
            Har biriga QR kod beriladi.
          </p>
        </div>
        <div className="s-pagehead__actions">
          <Link href="/studio/partners/new" className="s-btn s-btn--primary">
            Yangi hamkor
          </Link>
        </div>
      </div>

      {rows.length > 0 && (
        <div className="s-stats" style={{ marginBottom: 20 }}>
          <div className="s-stat">
            <div className="s-stat__top">QR skanlari</div>
            <div className="s-stat__value">{totals.scans}</div>
            <div className="s-stat__sub">jami</div>
          </div>
          <div className="s-stat">
            <div className="s-stat__top">So&apos;rovlar</div>
            <div className="s-stat__value s-stat__value--accent">
              {totals.enquiries}
            </div>
            <div className="s-stat__sub">
              {totals.scans > 0
                ? `${Math.round((totals.enquiries / totals.scans) * 100)}% skanlardan`
                : "hali yo'q"}
            </div>
          </div>
          <div className="s-stat">
            <div className="s-stat__top">Yakunlangan</div>
            <div className="s-stat__value">{totals.closed}</div>
            <div className="s-stat__sub">to&apos;langan deb belgilangan</div>
          </div>
          <div className="s-stat">
            <div className="s-stat__top">Cashback</div>
            <div className="s-stat__value s-stat__value--gold">
              {formatUsd(totals.owed)}
            </div>
            <div className="s-stat__sub">jami hisoblangan</div>
          </div>
        </div>
      )}

      {rows.length === 0 ? (
        <div className="s-table-wrap">
          <div className="s-empty">
            Hozircha hamkor yo&apos;q. «Yangi hamkor» bilan birinchisini
            qo&apos;shing — QR kod avtomatik yaratiladi.
          </div>
        </div>
      ) : (
        <div className="s-table-wrap">
          <table className="s-table">
            <thead>
              <tr>
                <th>Nomi</th>
                <th>Turi</th>
                <th>Kod</th>
                <th>Skanlar</th>
                <th>So&apos;rovlar</th>
                <th>Yakunlangan</th>
                <th>Cashback</th>
                <th>Holat</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id}>
                  <td>
                    <Link
                      href={`/studio/partners/${p.id}`}
                      className="s-rowlink"
                    >
                      {p.name}
                    </Link>
                  </td>
                  <td>{TYPE_LABEL[p.type] ?? p.type}</td>
                  <td style={{ color: "var(--s-fg-muted)" }}>/r/{p.code}</td>
                  <td>{p.scans}</td>
                  <td>{p.enquiries}</td>
                  <td>{p.closed}</td>
                  <td>{formatUsd(p.closed * (p.commissionUsd ?? 0))}</td>
                  <td>
                    <span
                      className={`s-badge ${p.active ? "s-badge--green" : "s-badge--gray"}`}
                    >
                      {p.active ? "Faol" : "To'xtatilgan"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p
        style={{
          marginTop: 14,
          fontSize: 12.5,
          color: "var(--s-fg-muted)",
          lineHeight: 1.7,
        }}
      >
        Cashback <strong>yakunlangan</strong> so&apos;rovlar bo&apos;yicha
        hisoblanadi — skan uchun emas. So&apos;rovni to&apos;lov tushgach
        «Yopildi» holatiga o&apos;tkazing.
      </p>
    </>
  );
}
