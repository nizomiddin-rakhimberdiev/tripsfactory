import Link from "next/link";
import { connection } from "next/server";
import { getPayloadClient } from "@/lib/studio/auth";

export const dynamic = "force-dynamic";

/** dd.mm.yyyy — a session date, not a timestamp. */
function shortDate(iso?: string | null): string {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}.${m}.${y}`;
}

export default async function StudioMasterclassesPage() {
  // Reads the clock to decide which session is still ahead — see the note on
  // the dashboard.
  await connection();
  const payload = await getPayloadClient();
  const res = await payload.find({
    collection: "masterclasses",
    limit: 200,
    depth: 1,
    sort: "createdAt",
    locale: "en",
  });

  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <div className="s-pagehead">
        <div className="s-pagehead__text">
          <h1>Masterklasslar</h1>
          <p>
            {res.totalDocs} ta masterklass — sanalar, video va mijoz fikrlari
            bilan.
            {res.totalDocs > res.docs.length &&
              ` Quyida dastlabki ${res.docs.length} tasi.`}
          </p>
        </div>
        <div className="s-pagehead__actions">
          <Link
            href="/studio/masterclasses/new"
            className="s-btn s-btn--primary"
          >
            Yangi masterklass
          </Link>
        </div>
      </div>
      {res.docs.length === 0 ? (
        <div className="s-table-wrap">
          <div className="s-empty">Hozircha masterklass yo&apos;q.</div>
        </div>
      ) : (
        <div className="s-table-wrap">
          <table className="s-table">
            <thead>
              <tr>
                <th style={{ width: 60 }}>
                  <span className="s-visually-hidden">Rasm</span>
                </th>
                <th>Nomi</th>
                <th>Shahar</th>
                <th>Narxi</th>
                <th>Keyingi patok</th>
                <th>Holat</th>
              </tr>
            </thead>
            <tbody>
              {res.docs.map((x) => {
                const img = x.heroImage;
                const url = img && typeof img === "object" ? img.url : null;
                const city = x.city;
                const cityName =
                  city && typeof city === "object" ? city.name : "—";
                // The same rule the site uses: soonest run still ahead that
                // has a seat left.
                const next = (x.sessions ?? [])
                  .filter(
                    (s) =>
                      s.date.slice(0, 10) >= today &&
                      (s.capacity ?? 0) - (s.booked ?? 0) > 0,
                  )
                  .sort((a, b) => a.date.localeCompare(b.date))[0];
                return (
                  <tr key={x.id}>
                    <td>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {url && <img className="s-thumb" src={url} alt="" />}
                    </td>
                    <td>
                      <Link
                        href={`/studio/masterclasses/${x.id}`}
                        className="s-rowlink"
                      >
                        {x.title}
                      </Link>
                    </td>
                    <td>{cityName}</td>
                    <td>${x.priceUsd}</td>
                    <td>
                      {next ? (
                        <>
                          {shortDate(next.date)}
                          <span
                            style={{
                              color: "var(--s-fg-muted)",
                              marginLeft: 6,
                              fontSize: 12,
                            }}
                          >
                            {(next.capacity ?? 0) - (next.booked ?? 0)}/
                            {next.capacity} bo&apos;sh
                          </span>
                        </>
                      ) : (
                        <span style={{ color: "var(--s-fg-muted)" }}>
                          sana yo&apos;q
                        </span>
                      )}
                    </td>
                    <td>
                      <span
                        className={`s-badge ${x.published ? "s-badge--green" : "s-badge--gray"}`}
                      >
                        {x.published ? "Saytda" : "Qoralama"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
