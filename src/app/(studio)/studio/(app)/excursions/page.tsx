import Link from "next/link";
import { getPayloadClient } from "@/lib/studio/auth";

export const dynamic = "force-dynamic";

export default async function StudioExcursionsPage() {
  const payload = await getPayloadClient();
  const res = await payload.find({
    collection: "excursions",
    limit: 200,
    depth: 1,
    sort: "createdAt",
    locale: "en",
  });

  return (
    <>
      <div className="s-pagehead">
        <div className="s-pagehead__text">
          <h1>Ekskursiyalar</h1>
          <p>
            {res.totalDocs} ta ekskursiya — saytdagi «Events» bo&apos;limi.
            {res.totalDocs > res.docs.length &&
              ` Quyida dastlabki ${res.docs.length} tasi.`}
          </p>
        </div>
        <div className="s-pagehead__actions">
          <Link href="/studio/excursions/new" className="s-btn s-btn--primary">
            Yangi ekskursiya
          </Link>
        </div>
      </div>
      {res.docs.length === 0 ? (
        <div className="s-table-wrap">
          <div className="s-empty">Hozircha ekskursiya yo&apos;q.</div>
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
                <th>Davomiyligi</th>
                <th>Narxi</th>
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
                return (
                  <tr key={x.id}>
                    <td>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {url && <img className="s-thumb" src={url} alt="" />}
                    </td>
                    <td>
                      <Link
                        href={`/studio/excursions/${x.id}`}
                        className="s-rowlink"
                      >
                        {x.title}
                      </Link>
                    </td>
                    <td>{cityName}</td>
                    <td>{x.durationHours} soat</td>
                    <td>${x.priceUsd}</td>
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
