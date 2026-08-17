import Link from "next/link";
import { Suspense } from "react";
import type { Where } from "payload";
import { getPayloadClient } from "@/lib/studio/auth";
import { TourFilters } from "@/components/studio/TourFilters";
import { tourEditPath } from "@/lib/studio/tour-path";

export const dynamic = "force-dynamic";

const typeLabel: Record<string, string> = {
  group: "Guruh",
  private: "Individual",
  custom: "Buyurtma",
};

type Params = Promise<Record<string, string | string[] | undefined>>;

const one = (v: string | string[] | undefined) =>
  (Array.isArray(v) ? v[0] : v)?.trim() ?? "";

export default async function StudioToursPage({
  searchParams,
}: {
  searchParams: Params;
}) {
  const sp = await searchParams;
  const q = one(sp.q);
  const region = one(sp.region);
  const country = one(sp.country);
  const city = one(sp.city);
  const type = one(sp.type);
  const tier = one(sp.tier);
  const status = one(sp.status);

  const payload = await getPayloadClient();

  /**
   * Built here rather than filtered in the page: seventy-six tours is small
   * today and will not be in a year, and a list that fetches everything to
   * show four rows is a habit that only shows up as a problem later.
   */
  const conditions: Where[] = [];
  if (q) {
    // Title as an editor reads it, or the slug they know from a URL.
    conditions.push({
      or: [{ title: { like: q } }, { slug: { like: q } }],
    });
  }
  if (region) conditions.push({ "country.region": { equals: Number(region) } });
  if (country) conditions.push({ country: { equals: Number(country) } });
  if (city) conditions.push({ cities: { in: [Number(city)] } });
  if (type) conditions.push({ type: { equals: type } });
  if (tier) conditions.push({ tier: { equals: tier } });
  if (status === "published") conditions.push({ published: { equals: true } });
  if (status === "draft") conditions.push({ published: { not_equals: true } });

  /**
   * The option lists narrow with the choice above them.
   *
   * They did not, and the result read as a bug because it was one: picking
   * China left six Uzbek cities in the city list, because the list was every
   * city in the database regardless of anything else selected. A filter that
   * offers a combination returning nothing is worse than no filter — the
   * operator concludes the data is wrong rather than the question.
   */
  const countryWhere: Where | undefined = region
    ? { region: { equals: Number(region) } }
    : undefined;
  const cityWhere: Where | undefined = country
    ? { country: { equals: Number(country) } }
    : region
      ? { "country.region": { equals: Number(region) } }
      : undefined;

  const [res, total, regionDocs, countryDocs, cityDocs] = await Promise.all([
    payload.find({
      collection: "tours",
      where: conditions.length ? { and: conditions } : undefined,
      limit: 200,
      depth: 1,
      sort: "createdAt",
      locale: "en",
    }),
    payload.count({ collection: "tours" }),
    payload.find({ collection: "regions", limit: 100, depth: 0, locale: "en", sort: "name" }),
    payload.find({
      collection: "countries",
      where: countryWhere,
      limit: 100,
      depth: 0,
      locale: "en",
      sort: "name",
    }),
    payload.find({
      collection: "cities",
      where: cityWhere,
      limit: 200,
      depth: 0,
      locale: "en",
      sort: "name",
    }),
  ]);

  const options = (docs: { id: number; name: string; slug: string }[]) =>
    docs.map((d) => ({ value: String(d.id), label: d.name ?? d.slug }));

  return (
    <>
      <div className="s-pagehead">
        <div className="s-pagehead__text">
          <h1>Turlar</h1>
          <p>Tahrirlash uchun nomini bosing.</p>
        </div>
        <div className="s-pagehead__actions">
          <Link className="s-btn" href="/studio/import">
            Sheets&apos;dan import
          </Link>
          <Link className="s-btn s-btn--primary" href="/studio/tours/new">
            Yangi tur
          </Link>
        </div>
      </div>

      {/* The filters read the query string; the page is force-dynamic, so this
          boundary is belt and braces rather than a requirement. */}
      <Suspense fallback={null}>
        <TourFilters
          regions={options(regionDocs.docs)}
          countries={options(countryDocs.docs)}
          cities={options(cityDocs.docs)}
          total={total.totalDocs}
          shown={res.totalDocs}
        />
      </Suspense>

      {res.docs.length === 0 ? (
        <div className="s-table-wrap">
          <div className="s-empty">
            {conditions.length
              ? "Bu shartlarga mos tur topilmadi. Filtrlarni tozalab ko'ring."
              : "Hozircha tur yo'q."}
          </div>
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
                <th>Davlat</th>
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
                const c = t.country;
                const countryName =
                  c && typeof c === "object" ? c.name : "—";
                return (
                  <tr key={t.id}>
                    <td>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {url && <img className="s-thumb" src={url} alt="" />}
                    </td>
                    <td>
                      <Link
                        href={tourEditPath(t.type, t.id)}
                        className="s-rowlink"
                      >
                        {t.title}
                      </Link>
                    </td>
                    <td>{countryName}</td>
                    <td>{typeLabel[t.type] ?? t.type}</td>
                    <td>
                      {t.tier === "premium" ? (
                        <span className="s-badge s-badge--amber">Premium</span>
                      ) : (
                        <span className="s-badge s-badge--gray">Oddiy</span>
                      )}
                    </td>
                    <td>
                      {t.priceFromUsd
                        ? `$${t.priceFromUsd}`
                        : "So'rov bo'yicha"}
                    </td>
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
      )}
    </>
  );
}
