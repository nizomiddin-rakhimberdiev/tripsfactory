import Link from "next/link";
import { getPayloadClient } from "@/lib/studio/auth";
import { formatUsd } from "@/lib/currency";
import { ToastProvider } from "@/components/studio/ui";
import { PartnerBatch } from "@/components/studio/PartnerBatch";

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
  const all = await payload.find({
    collection: "partners",
    limit: 300,
    depth: 0,
    sort: "code",
  });

  // Two different things, deliberately shown apart: hotels that send guests,
  // and codes waiting on a contract. Mixed together, forty banners in stock
  // bury the handful that are actually earning.
  const partners = { docs: all.docs.filter((p) => p.assigned !== false) };
  const stock = all.docs.filter((p) => p.assigned === false);

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
            and: [
              { partner: { equals: p.id } },
              // Money in, by either route: the button that confirms a payment
              // sets "paid", and an operator who settles offline closes it.
              { status: { in: ["paid", "closed"] } },
            ],
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
    <ToastProvider>
      <div className="s-pagehead">
        <div className="s-pagehead__text">
          <h1>Hamkorlar</h1>
          <p>
            Mijoz olib keladigan mehmonxonalar, platformalar va turoperatorlar.
            Har biriga QR kod beriladi.
          </p>
        </div>
        <div className="s-pagehead__actions">
          <PartnerBatch />
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
            <div className="s-stat__top">To&apos;langan</div>
            <div className="s-stat__value">{totals.closed}</div>
            <div className="s-stat__sub">to&apos;lovi tasdiqlangan</div>
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
            Hozircha biriktirilgan hamkor yo&apos;q. Mehmonxona bilan shartnoma
            tuzilgach, zaxiradagi QR kodlardan birini unga biriktiring.
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
                <th>To&apos;langan</th>
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

      <div
        className="s-section-title"
        style={{
          marginTop: 30,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        Zaxiradagi QR kodlar
        <Link
          href="/studio/partners/print?only=stock"
          className="s-btn s-btn--sm"
          style={{ marginLeft: "auto", fontWeight: 400 }}
        >
          Chop etishga tayyorlash
        </Link>
      </div>
      <p
        style={{
          margin: "0 0 12px",
          fontSize: 12.5,
          color: "var(--s-fg-muted)",
          lineHeight: 1.7,
          maxWidth: 640,
        }}
      >
        Chop etilgan, lekin hali hech kimga berilmagan kodlar. Ular{" "}
        <strong>bugundan ishlaydi</strong> — bannerni mehmonxonaga bergan
        zahoti skanlar hisoblana boshlaydi. Shartnoma tuzilgach kodni ochib,
        nomini mehmonxona nomiga o&apos;zgartiring va «Mehmonxonaga
        biriktirilgan» katagini belgilang. Banner qayta chop etilmaydi.
      </p>
      {stock.length === 0 ? (
        <div className="s-table-wrap">
          <div className="s-empty">
            Zaxirada kod yo&apos;q. «QR partiyasi» bilan bir yo&apos;la 40 ta
            yarating va chop etishga bering.
          </div>
        </div>
      ) : (
        <div className="s-table-wrap">
          <table className="s-table">
            <thead>
              <tr>
                <th>Kod</th>
                <th>Havola</th>
                <th style={{ width: 140 }}>
                  <span className="s-visually-hidden">Amal</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {stock.map((p) => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600, letterSpacing: ".04em" }}>
                    {p.code.toUpperCase()}
                  </td>
                  <td style={{ color: "var(--s-fg-muted)" }}>/r/{p.code}</td>
                  <td>
                    <Link
                      href={`/studio/partners/${p.id}`}
                      className="s-btn s-btn--sm"
                    >
                      Mehmonxonaga biriktirish
                    </Link>
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
        Cashback <strong>to&apos;langan</strong> so&apos;rovlar bo&apos;yicha
        hisoblanadi — skan uchun emas. So&apos;rov ochilganda «To&apos;lov
        qabul qilindi» tugmasini bosing: mijozga tasdiq xati ketadi va holat
        o&apos;zi o&apos;zgaradi.
      </p>
    </ToastProvider>
  );
}
