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
} from "@/components/studio/icons";

export const dynamic = "force-dynamic";

function fmtDate(d: string) {
  return new Intl.DateTimeFormat("uz-UZ", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(d));
}

const leadBadge: Record<string, string> = {
  new: "s-badge--teal",
  contacted: "s-badge--amber",
  closed: "s-badge--gray",
};
const leadLabel: Record<string, string> = {
  new: "Yangi",
  contacted: "Bog'lanildi",
  closed: "Yopildi",
};

export default async function StudioDashboard() {
  const payload = await getPayloadClient();
  const [tours, published, newLeads, media, recent] = await Promise.all([
    payload.count({ collection: "tours" }),
    payload.count({ collection: "tours", where: { published: { equals: true } } }),
    payload.count({ collection: "leads", where: { status: { equals: "new" } } }),
    payload.count({ collection: "media" }),
    payload.find({
      collection: "leads",
      limit: 6,
      sort: "-createdAt",
      depth: 0,
    }),
  ]);

  const stats = [
    { label: "Turlar", value: tours.totalDocs, sub: `${published.totalDocs} ta saytda`, Icon: IconCompass },
    { label: "Yangi so'rovlar", value: newLeads.totalDocs, sub: "javob kutmoqda", Icon: IconInbox },
    { label: "Rasmlar", value: media.totalDocs, sub: "kutubxonada", Icon: IconImage },
    { label: "Saytda", value: published.totalDocs, sub: "e'lon qilingan tur", Icon: IconCheck },
  ];

  const quick = [
    { href: "/studio/tours", t: "Turlarni tahrirlash", d: "Narx, sana, marshrut", Icon: IconCompass },
    { href: "/studio/content", t: "Bosh sahifa", d: "Hero rasm va matn", Icon: IconHome },
    { href: "/studio/media", t: "Rasm yuklash", d: "Media kutubxonasi", Icon: IconImage },
    { href: "/studio/cities", t: "Shaharlar", d: "Qo'llanma va joylar", Icon: IconPin },
    { href: "/studio/guides", t: "Qo'llanmalar", d: "Viza, mavsum, taomlar", Icon: IconBook },
    { href: "/studio/leads", t: "So'rovlar", d: "Mijoz murojaatlari", Icon: IconInbox },
  ];

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
          <div key={s.label} className="s-stat">
            <div className="s-stat__top">
              <span className="s-stat__icon">
                <s.Icon />
              </span>
              {s.label}
            </div>
            <div className="s-stat__value">{s.value}</div>
            <div className="s-stat__sub">{s.sub}</div>
          </div>
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

      <div className="s-section-title">Oxirgi so'rovlar</div>
      {recent.docs.length === 0 ? (
        <div className="s-card">
          <div className="s-empty">Hozircha so'rovlar yo'q.</div>
        </div>
      ) : (
        <div className="s-table-wrap">
          <table className="s-table">
            <thead>
              <tr>
                <th>Ism</th>
                <th>Aloqa</th>
                <th>Tur</th>
                <th>Holat</th>
                <th>Sana</th>
              </tr>
            </thead>
            <tbody>
              {recent.docs.map((l) => (
                <tr key={l.id}>
                  <td>
                    <Link href="/studio/leads" className="s-rowlink">
                      {l.name}
                    </Link>
                  </td>
                  <td>{l.email}</td>
                  <td>{l.tourSlug ?? "—"}</td>
                  <td>
                    <span className={`s-badge ${leadBadge[l.status ?? "new"]}`}>
                      {leadLabel[l.status ?? "new"]}
                    </span>
                  </td>
                  <td style={{ color: "var(--s-fg-muted)" }}>
                    {l.createdAt ? fmtDate(l.createdAt) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
