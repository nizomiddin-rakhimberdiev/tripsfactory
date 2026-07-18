import Link from "next/link";
import { getPayloadClient } from "@/lib/studio/auth";

export const dynamic = "force-dynamic";

export default async function StudioCitiesPage() {
  const payload = await getPayloadClient();
  const res = await payload.find({
    collection: "cities",
    limit: 200,
    depth: 1,
    sort: "createdAt",
    locale: "en",
  });

  return (
    <>
      <div className="s-pagehead">
        <div className="s-pagehead__text">
          <h1>Shaharlar</h1>
          <p>Shahar qo'llanmalari — tahrirlash uchun bosing.</p>
        </div>
      </div>
      <div className="s-table-wrap">
        <table className="s-table">
          <thead>
            <tr>
              <th style={{ width: 60 }}></th>
              <th>Nomi</th>
              <th>Davlat</th>
              <th>Kechalar</th>
            </tr>
          </thead>
          <tbody>
            {res.docs.map((c) => {
              const img = c.image;
              const url = img && typeof img === "object" ? img.url : null;
              const country = c.country;
              const cname =
                country && typeof country === "object" ? country.name : "—";
              return (
                <tr key={c.id}>
                  <td>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {url && <img className="s-thumb" src={url} alt="" />}
                  </td>
                  <td>
                    <Link href={`/studio/cities/${c.id}`} className="s-rowlink">
                      {c.name}
                    </Link>
                  </td>
                  <td>{cname}</td>
                  <td>{c.recommendedNights}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
