import Link from "next/link";
import { getPayloadClient } from "@/lib/studio/auth";
import {
  IconCompass,
  IconImage,
  IconInbox,
  IconCheck,
  IconArrowRight,
  IconHome,
  IconPin,
  IconBook,
  IconGlobe,
} from "@/components/studio/icons";

export const dynamic = "force-dynamic";

function fmtDateTime(d: string) {
  return new Intl.DateTimeFormat("uz-UZ", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(d));
}

/** "3 daqiqa oldin" style — faster to scan than a timestamp. */
function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return "hozir";
  if (min < 60) return `${min} daq oldin`;
  const hrs = Math.round(min / 60);
  if (hrs < 24) return `${hrs} soat oldin`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days} kun oldin`;
  return fmtDateTime(iso);
}

const leadBadge: Record<string, string> = {
  new: "s-badge--accent",
  contacted: "s-badge--gold",
  closed: "s-badge--gray",
};
const leadLabel: Record<string, string> = {
  new: "Yangi",
  contacted: "Bog'lanildi",
  closed: "Yopildi",
};

export default async function StudioDashboard() {
  const payload = await getPayloadClient();

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [
    todayLeads,
    newLeads,
    published,
    drafts,
    countries,
    cities,
    media,
    recentLeads,
    recentTours,
    recentCountries,
    recentCities,
  ] = await Promise.all([
    payload.count({
      collection: "leads",
      where: { createdAt: { greater_than_equal: startOfToday.toISOString() } },
    }),
    payload.count({ collection: "leads", where: { status: { equals: "new" } } }),
    payload.count({
      collection: "tours",
      where: { published: { equals: true } },
    }),
    payload.count({
      collection: "tours",
      where: { published: { not_equals: true } },
    }),
    payload.count({ collection: "countries" }),
    payload.count({ collection: "cities" }),
    payload.count({ collection: "media" }),
    payload.find({ collection: "leads", limit: 6, sort: "-createdAt", depth: 0 }),
    payload.find({
      collection: "tours",
      limit: 5,
      sort: "-updatedAt",
      depth: 0,
      locale: "en",
    }),
    payload.find({
      collection: "countries",
      limit: 5,
      sort: "-updatedAt",
      depth: 0,
      locale: "en",
    }),
    payload.find({
      collection: "cities",
      limit: 5,
      sort: "-updatedAt",
      depth: 0,
      locale: "en",
    }),
  ]);

  const stats = [
    {
      href: "/studio/leads",
      label: "Bugungi so'rovlar",
      value: todayLeads.totalDocs,
      sub: `${newLeads.totalDocs} ta javob kutmoqda`,
      Icon: IconInbox,
      tone: "s-stat__value--accent",
    },
    {
      href: "/studio/tours",
      label: "Saytdagi turlar",
      value: published.totalDocs,
      sub: "e'lon qilingan",
      Icon: IconCheck,
    },
    {
      href: "/studio/tours",
      label: "Qoralama turlar",
      value: drafts.totalDocs,
      sub: "hali chiqmagan",
      Icon: IconCompass,
      tone: "s-stat__value--gold",
    },
    {
      href: "/studio/countries",
      label: "Davlatlar",
      value: countries.totalDocs,
      sub: "yo'nalishlar",
      Icon: IconGlobe,
    },
    {
      href: "/studio/cities",
      label: "Shaharlar",
      value: cities.totalDocs,
      sub: "joylar",
      Icon: IconPin,
    },
    {
      href: "/studio/media",
      label: "Rasmlar",
      value: media.totalDocs,
      sub: "kutubxonada",
      Icon: IconImage,
    },
  ];

  const quick = [
    { href: "/studio/tours", t: "Turlarni tahrirlash", d: "Narx, sana, marshrut", Icon: IconCompass },
    { href: "/studio/content", t: "Bosh sahifa", d: "Hero rasm va matn", Icon: IconHome },
    { href: "/studio/media", t: "Rasm yuklash", d: "Media kutubxonasi", Icon: IconImage },
    { href: "/studio/guides", t: "Qo'llanmalar", d: "Viza, mavsum, taomlar", Icon: IconBook },
  ];

  // Cross-collection "recently edited" feed, built from updatedAt on records
  // that already exist — no activity log, nothing invented.
  const activity = [
    ...recentTours.docs.map((d) => ({
      id: `tour-${d.id}`,
      href: `/studio/tours/${d.id}`,
      title: String(d.title ?? "Tur"),
      kind: "Tur",
      at: d.updatedAt as string,
      Icon: IconCompass,
    })),
    ...recentCountries.docs.map((d) => ({
      id: `country-${d.id}`,
      href: `/studio/countries/${d.id}`,
      title: String(d.name ?? "Davlat"),
      kind: "Davlat",
      at: d.updatedAt as string,
      Icon: IconGlobe,
    })),
    ...recentCities.docs.map((d) => ({
      id: `city-${d.id}`,
      href: `/studio/cities/${d.id}`,
      title: String(d.name ?? "Shahar"),
      kind: "Shahar",
      at: d.updatedAt as string,
      Icon: IconPin,
    })),
  ]
    .filter((a) => a.at)
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 7);

  return (
    <>
      <div className="s-pagehead">
        <div className="s-pagehead__text">
          <h1>Boshqaruv paneli</h1>
          <p>Saytning umumiy holati va tezkor amallar.</p>
        </div>
      </div>

      <div className="s-stats">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="s-stat s-stat--link">
            <div className="s-stat__top">
              <span className="s-stat__icon">
                <s.Icon />
              </span>
              {s.label}
            </div>
            <div className={`s-stat__value ${s.tone ?? ""}`}>{s.value}</div>
            <div className="s-stat__sub">{s.sub}</div>
          </Link>
        ))}
      </div>

      <div className="s-section-title">Tezkor amallar</div>
      <div className="s-quick">
        {quick.map((q) => (
          <Link key={q.href} href={q.href} className="s-quick__item">
            <span className="s-quick__icon">
              <q.Icon />
            </span>
            <span>
              <span className="s-quick__t">{q.t}</span>
              <span className="s-quick__d">{q.d}</span>
            </span>
            <IconArrowRight className="s-quick__arrow" width={16} height={16} />
          </Link>
        ))}
      </div>

      <div className="s-section-title">Sohaviy ko&apos;rinish</div>
      <div className="s-cols">
        <div className="s-module">
          <div className="s-module__head">
            <span className="s-module__title">Oxirgi so&apos;rovlar</span>
            <Link href="/studio/leads" className="s-module__link">
              Barchasi
            </Link>
          </div>
          {recentLeads.docs.length === 0 ? (
            <div className="s-empty">Hozircha so&apos;rovlar yo&apos;q.</div>
          ) : (
            <div className="s-list">
              {recentLeads.docs.map((l) => (
                <Link key={l.id} href="/studio/leads" className="s-list__item">
                  <span className="s-list__icon">
                    <IconInbox />
                  </span>
                  <span className="s-list__body">
                    <span className="s-list__t">{l.name}</span>
                    <span className="s-list__d">
                      {l.email}
                      {l.tourSlug ? ` · ${l.tourSlug}` : ""}
                    </span>
                  </span>
                  <span
                    className={`s-badge ${leadBadge[l.status ?? "new"] ?? "s-badge--gray"}`}
                  >
                    {leadLabel[l.status ?? "new"] ?? l.status}
                  </span>
                  <span className="s-list__meta">
                    {l.createdAt ? timeAgo(l.createdAt) : "—"}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="s-module">
          <div className="s-module__head">
            <span className="s-module__title">Oxirgi tahrirlar</span>
          </div>
          {activity.length === 0 ? (
            <div className="s-empty">Hozircha tahrirlar yo&apos;q.</div>
          ) : (
            <div className="s-list">
              {activity.map((a) => (
                <Link key={a.id} href={a.href} className="s-list__item">
                  <span className="s-list__icon">
                    <a.Icon />
                  </span>
                  <span className="s-list__body">
                    <span className="s-list__t">{a.title}</span>
                    <span className="s-list__d">{a.kind}</span>
                  </span>
                  <span className="s-list__meta">{timeAgo(a.at)}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
