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
          <h1>Qo'llanmalar</h1>
          <p>Viza, mavsum, taomlar kabi maqolalar — tahrirlash uchun bosing.</p>
        </div>
      </div>
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
                    <Link href={`/studio/guides/${g.id}`} className="s-rowlink">
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
    </>
  );
}
