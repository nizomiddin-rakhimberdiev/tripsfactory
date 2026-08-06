import Link from "next/link";
import { getPayloadClient } from "@/lib/studio/auth";

export const dynamic = "force-dynamic";

export default async function StudioRegionsPage() {
  const payload = await getPayloadClient();
  const res = await payload.find({
    collection: "regions",
    limit: 200,
    depth: 0,
    sort: "name",
    locale: "en",
  });

  return (
    <>
      <div className="s-pagehead">
        <div className="s-pagehead__text">
          <h1>Mintaqalar</h1>
          <p>
            {res.totalDocs} ta mintaqa — davlatlar shularga biriktiriladi.
            {res.totalDocs > res.docs.length &&
              ` Quyida dastlabki ${res.docs.length} tasi.`}
          </p>
        </div>
        <div className="s-pagehead__actions">
          <Link href="/studio/regions/new" className="s-btn s-btn--primary">
            Yangi mintaqa
          </Link>
        </div>
      </div>
      {res.docs.length === 0 ? (
        <div className="s-table-wrap">
          <div className="s-empty">Hozircha mintaqa yo&apos;q.</div>
        </div>
      ) : (
        <div className="s-table-wrap">
          <table className="s-table">
            <thead>
              <tr>
                <th>Nomi</th>
                <th>Manzil (slug)</th>
              </tr>
            </thead>
            <tbody>
              {res.docs.map((r) => (
                <tr key={r.id}>
                  <td>
                    <Link
                      href={`/studio/regions/${r.id}`}
                      className="s-rowlink"
                    >
                      {r.name ?? r.slug}
                    </Link>
                  </td>
                  <td style={{ color: "var(--s-fg-muted)" }}>{r.slug}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
