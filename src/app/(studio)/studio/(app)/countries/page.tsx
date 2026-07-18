import Link from "next/link";
import { getPayloadClient } from "@/lib/studio/auth";

export const dynamic = "force-dynamic";

export default async function StudioCountriesPage() {
  const payload = await getPayloadClient();
  const res = await payload.find({
    collection: "countries",
    limit: 200,
    depth: 1,
    sort: "createdAt",
    locale: "en",
  });

  return (
    <>
      <div className="s-pagehead">
        <div className="s-pagehead__text">
          <h1>Davlatlar</h1>
          <p>Davlat sahifalari va to'liq ma'lumot — tahrirlash uchun bosing.</p>
        </div>
      </div>
      <div className="s-table-wrap">
        <table className="s-table">
          <thead>
            <tr>
              <th style={{ width: 60 }}></th>
              <th>Nomi</th>
              <th>Holat</th>
            </tr>
          </thead>
          <tbody>
            {res.docs.map((c) => {
              const img = c.heroImage;
              const url = img && typeof img === "object" ? img.url : null;
              return (
                <tr key={c.id}>
                  <td>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {url && <img className="s-thumb" src={url} alt="" />}
                  </td>
                  <td>
                    <Link href={`/studio/countries/${c.id}`} className="s-rowlink">
                      {c.name}
                    </Link>
                  </td>
                  <td>
                    {c.published ? (
                      <span className="s-badge s-badge--green">Saytda</span>
                    ) : (
                      <span className="s-badge s-badge--gray">Qoralama</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
