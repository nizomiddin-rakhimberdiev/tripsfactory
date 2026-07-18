import Link from "next/link";
import { getPayloadClient } from "@/lib/studio/auth";

export const dynamic = "force-dynamic";

const typeLabel: Record<string, string> = {
  group: "Guruh",
  private: "Individual",
  custom: "Buyurtma",
};

export default async function StudioToursPage() {
  const payload = await getPayloadClient();
  const res = await payload.find({
    collection: "tours",
    limit: 200,
    depth: 1,
    sort: "createdAt",
    locale: "en",
  });

  return (
    <>
      <div className="s-pagehead">
        <div className="s-pagehead__text">
          <h1>Turlar</h1>
          <p>Barcha turlar — tahrirlash uchun bosing.</p>
        </div>
      </div>

      <div className="s-table-wrap">
        <table className="s-table">
          <thead>
            <tr>
              <th style={{ width: 60 }}></th>
              <th>Nomi</th>
              <th>Turi</th>
              <th>Daraja</th>
              <th>Narx</th>
              <th>Holat</th>
            </tr>
          </thead>
          <tbody>
            {res.docs.map((t) => {
              const hero = t.heroImage;
              const url = hero && typeof hero === "object" ? hero.url : null;
              return (
                <tr key={t.id}>
                  <td>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {url && <img className="s-thumb" src={url} alt="" />}
                  </td>
                  <td>
                    <Link href={`/studio/tours/${t.id}`} className="s-rowlink">
                      {t.title}
                    </Link>
                  </td>
                  <td>{typeLabel[t.type] ?? t.type}</td>
                  <td>
                    {t.tier === "premium" ? (
                      <span className="s-badge s-badge--amber">Premium</span>
                    ) : (
                      <span className="s-badge s-badge--gray">Oddiy</span>
                    )}
                  </td>
                  <td>{t.priceFromUsd ? `$${t.priceFromUsd}` : "So'rov bo'yicha"}</td>
                  <td>
                    {t.published ? (
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
