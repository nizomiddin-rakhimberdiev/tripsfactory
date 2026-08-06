import Link from "next/link";
import { getPayloadClient } from "@/lib/studio/auth";

export const dynamic = "force-dynamic";

export default async function StudioGuidesPage() {
  const payload = await getPayloadClient();
  const res = await payload.find({
    collection: "guides",
    limit: 200,
    depth: 1,
    sort: "createdAt",
    locale: "en",
  });

  return (
    <>
      <div className="s-pagehead">
        <div className="s-pagehead__text">
          <h1>Qo&apos;llanmalar</h1>
          <p>
            {res.totalDocs} ta maqola — viza, mavsum, taomlar. Tahrirlash uchun
            bosing.
            {res.totalDocs > res.docs.length &&
              ` Quyida dastlabki ${res.docs.length} tasi.`}
          </p>
        </div>
        <div className="s-pagehead__actions">
          <Link href="/studio/guides/new" className="s-btn s-btn--primary">
            Yangi maqola
          </Link>
        </div>
      </div>
      {res.docs.length === 0 ? (
        <div className="s-table-wrap">
          <div className="s-empty">Hozircha maqola yo&apos;q.</div>
        </div>
      ) : (
        <div className="s-table-wrap">
          <table className="s-table">
            <thead>
              <tr>
                <th>Sarlavha</th>
                <th>Davlat</th>
              </tr>
            </thead>
            <tbody>
              {res.docs.map((g) => {
                const country = g.country;
                const cname =
                  country && typeof country === "object" ? country.name : "—";
                return (
                  <tr key={g.id}>
                    <td>
                      <Link
                        href={`/studio/guides/${g.id}`}
                        className="s-rowlink"
                      >
                        {g.title}
                      </Link>
                    </td>
                    <td>{cname}</td>
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
