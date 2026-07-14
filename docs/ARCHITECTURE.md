# TripsFactory — Arxitektura

> Advantour modelidan ilhomlangan, zamonaviy stekda qurilgan ko'p davlatli tur-agentlik platformasi.

## Stek

| Qatlam | Texnologiya |
|---|---|
| Framework | Next.js 16 (App Router, RSC), TypeScript strict |
| UI | Tailwind CSS 4, dizayn-tokenlar (`globals.css`) |
| i18n | next-intl — 8 til: uz, en, ru, ja, zh, es, it, de |
| Kontent | `src/lib/content` — typed repository qatlami (hozir fayl-asosli, 2-bosqichda Payload CMS'ga almashadi, sahifa kodi o'zgarmaydi) |
| Validatsiya | Zod (lead forma, API) |
| Hosting | Vercel (vendor-lock'siz standart Next.js) |

## Geografiya modeli

`Region → Country → City` iyerarxiyasi. Tur davlatga va shaharlarga bog'lanadi.
URL: `/{locale}/destinations/{region}/{country}` va `/{locale}/tours/{country}/{tourSlug}`.

## Rendering strategiyasi

Barcha kontent sahifalari — SSG (`generateStaticParams`). CMS ulanganida ISR + webhook revalidation.
Dinamik qism faqat: lead-forma API (`/api/leads`).

## Tillar

- Bazaviy til: **EN**. Kontent EN'da yoziladi; boshqa tillar tarjima qatlami orqali to'ladi (AI-tarjima pipeline — 2-bosqich, `translationStatus: auto|reviewed` qoidasi bilan).
- Tarjimasi yo'q kontent EN'ga fallback qiladi.
- UI matnlari: `src/i18n/messages/*.json` — 8 tilda to'liq.

## Tema tizimi

Ranglar/typography faqat CSS token orqali. Ikki dunyo:
- **default** — yorug', zamonaviy (asosiy sayt)
- **premium** — `data-theme="premium"`: to'q fon, oltin aksent, serif displey shrift. `/premium` route group'ida layout darajasida yoqiladi.

## Feature flags

`src/lib/flags.ts` — `excursions: false` (kod tayyor, navbar/route yashirin). Ochish = bitta qiymat.

## To'lovlar (2-bosqich)

MVP: booking = so'rov (lead) → menejer to'lov havolasi yuboradi.
Narxlar USD'da saqlanadi; UI'da mijoz valyutasida taxminiy ko'rsatish (kunlik kurs, "billed in USD" izohi).
`PaymentProvider` interfeysi ostida OCTO/Payme/Stripe almashinadigan qilib qurilyapti.

## Papka strukturasi

```
src/
├── app/[locale]/            # barcha sahifalar (8 locale)
│   ├── page.tsx             # bosh sahifa
│   ├── tours/               # katalog + [country]/[slug] detail
│   ├── destinations/        # [region]/[country] qo'llanmalar
│   ├── guide/[slug]/        # viza, mavsum, FAQ...
│   ├── premium/             # alohida tema dunyosi
│   ├── excursions/          # flag ostida
│   ├── about/ contact/
├── app/api/leads/           # lead qabul qilish
├── components/              # layout/, tours/, forms/, premium/
├── i18n/                    # routing, request, messages/
└── lib/
    ├── content/             # types + data + repository API
    ├── flags.ts
    └── seo.ts
```

## Sifat qoidalari

- TypeScript strict, `any` taqiqlangan
- Har muhim qaror `docs/DECISIONS.md`da
- Conventional commits
- Lighthouse ≥ 95, LCP < 2s byudjet
