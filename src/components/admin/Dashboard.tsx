/* Custom dashboard shown above Payload's default collection list.
 * Friendly Uzbek greeting + quick-action cards for the common tasks. */
import React from "react";
import Link from "next/link";

const cards: {
  href: string;
  emoji: string;
  title: string;
  desc: string;
}[] = [
  {
    href: "/admin/collections/tours",
    emoji: "🧭",
    title: "Turlar",
    desc: "Tur nomi, narx, sana, marshrut — tahrirlash va yangi qo'shish",
  },
  {
    href: "/admin/globals/site-content",
    emoji: "🏔️",
    title: "Bosh sahifa",
    desc: "Bosh sahifa va Premium hero rasmi hamda matni",
  },
  {
    href: "/admin/collections/media",
    emoji: "🖼️",
    title: "Rasmlar",
    desc: "Rasm yuklash va boshqarish (Media kutubxonasi)",
  },
  {
    href: "/admin/collections/cities",
    emoji: "📍",
    title: "Shaharlar",
    desc: "Shahar qo'llanmalari va diqqatga sazovor joylar",
  },
  {
    href: "/admin/collections/guides",
    emoji: "📖",
    title: "Qo'llanmalar",
    desc: "Viza, mavsum, taomlar kabi maqolalar",
  },
  {
    href: "/admin/collections/leads",
    emoji: "📩",
    title: "So'rovlar",
    desc: "Saytdan kelgan mijoz so'rovlari (yangi / bog'lanildi / yopildi)",
  },
];

export default function Dashboard() {
  return (
    <div className="tf-dashboard">
      <div className="tf-dashboard__head">
        <h2>Assalomu alaykum! 👋</h2>
        <p>
          Nima o'zgartiramiz? Quyidan kerakli bo'limni tanlang. Har bir matnni 8
          tilda tahrirlash mumkin — maydon ustidagi til tugmasidan tilni
          almashtiring. O'zgarishlar saytda ~5 daqiqada ko'rinadi.
        </p>
      </div>
      <div className="tf-dashboard__grid">
        {cards.map((c) => (
          <Link key={c.href} href={c.href} className="tf-card">
            <span className="tf-card__emoji">{c.emoji}</span>
            <span className="tf-card__title">{c.title}</span>
            <span className="tf-card__desc">{c.desc}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
