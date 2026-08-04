# Architecture Decision Records

## ADR-001: Next.js (App Router) — 2026-07-14
SEO-kritik, kontent-og'ir sayt. SSG/ISR + RSC → tezlik va yuklamaga chidamlilik arxitektura darajasida hal bo'ladi. Bitta til/repo — kam harakatlanuvchi qism.

## ADR-002: Kontent qatlami avval fayl-asosli, CMS keyin — 2026-07-14
Payload CMS rejada qoladi, lekin MVP kontenti typed repository (`lib/content`) orqali fayllardan o'qiladi. Sabab: (1) mijoz DB/hosting shartnomalari hal bo'lmagan, (2) sahifa kodi repository interfeysiga qaraydi — Payload ulanashi implementatsiya almashinuvi bo'ladi, sahifalar o'zgarmaydi. Bu bosqichni sotib olish (defer) qarori, voz kechish emas.

## ADR-003: Bazaviy kontent tili — EN — 2026-07-14
AI-tarjima sifati EN juftliklarida eng yuqori; xalqaro auditoriya asosiy bozor. UZ/RU shu jumladan tarjima qatlamidan keladi.

## ADR-004: Narxlar faqat USD'da saqlanadi — 2026-07-14
Boshqa valyutalar — ko'rsatish qatlamidagi konvertatsiya (taxminiy, kunlik kurs). Buxgalteriya va to'lov USD/UZS'da. Advantour va boshqa operatorlar amaliyoti.

## ADR-005: Premium — alohida kolleksiya emas, `tier` maydoni — 2026-07-14
Bitta Tour modeli, `tier: standard|premium`. Premium sahifalar tier bo'yicha filtrlaydi va alohida temada ko'rsatadi. Ikki model dublikatsiyasining oldini oladi.

## ADR-006: To'lov MVP'da so'rov-modeli — 2026-07-14
Stripe O'zbekistonda mavjud emas; lokal xalqaro ekvayring bank shartnomasini talab qiladi. MVP: lead → menejer invoice/link yuboradi. `PaymentProvider` abstraksiyasi kelajakdagi integratsiya uchun.

## ADR-007: Payload CMS integratsiyasi (ADR-002 bajarildi) — 2026-07-16
Kontent endi to'liq Payload 3'dan boshqariladi (/admin): turlar, shaharlar, davlatlar, qo'llanmalar, rasmlar (Media), hero matn/rasmlari (site-content global) va leadlar. Repository interfeysi o'zgarmadi — sahifalar kodi CMS almashinuvini sezmadi. DB: lokal sqlite (payload.db), prodda DATABASE_URL (Neon Postgres); media prodda Vercel Blob (BLOB_READ_WRITE_TOKEN). Sahifalar ISR (revalidate=300) — admin tahriri 5 daqiqada saytga chiqadi.

## ADR-009: Hosting — Cloudflare Workers + Neon, ISR oynasi 24 soat — 2026-07-29

**Kontekst.** Sayt mijozga topshiriladi. Auditoriya global (8 til; Yaponiya, Germaniya, Ispaniya, Rossiya, Xitoy), trafik 5–10K tashrif/oy. Bitta dasturchi qo'llab-quvvatlaydi.

**Qaror.** Cloudflare Workers (OpenNext) + R2 (media) + Neon Postgres (Hyperdrive orqali, scale-to-zero yoniq). ISR oynasi 300s → 86400s.

**Sabablar.**
- **Vercel Hobby tijoriy foydalanish uchun ToS bo'yicha taqiqlangan** — "receiving payment to create, update, or host the site" tijoriy hisoblanadi. Vercel'da qolish Pro'ni ($20/oy/seat) majburiy qilardi.
- Workers'da cold start yo'q (V8 isolate) — Payload/Studio adminka serverless cold start muammosidan xoli. Vercel'da bu warm-ping cron bilan yumshatilardi.
- R2 nol egress + `/cdn-cgi/image/` yetkazishda o'lchamlash → rasm trafigi bepul.
- Xarajat: $45–64/oy → $7–13/oy.

**ISR oynasi haqida (ADR-007 dagi `revalidate=300` bandini bekor qiladi).**
`revalidateSite()` (payload.config.ts) har bir Studio saqlashida `revalidatePath()` chaqiradi — ya'ni kontent **darhol** chiqadi, vaqt oynasiga bog'liq emas. 300s oynaning yagona ta'siri — 200 ta yo'lni doimiy qayta render qilib, Neon compute'ini kun bo'yi uyg'oq tutish edi (~90 CU-soat/oy). 86400 ga uzaytirish uni ~15 CU-soatga tushiradi va bazani always-on ($19.4/oy) tutish zaruratini yo'q qiladi. Oyna endi faqat Next so'rovi tashqarisidagi o'zgarishlar uchun zaxira — `scripts/` va to'g'ridan-to'g'ri SQL.

**Rad etilgan variantlar.**
- *Hetzner/DO VPS*: Payload uchun tezroq (doimiy protsess), lekin uptime javobgarligi bitta dasturchida qoladi; 2026-yildagi narx oshishi (CPX +144%, CCX +169%) narx ustunligini yo'qotdi.
- *Railway / Render*: doimiy konteyner beradi, lekin global CDN yo'q va narx Vercel bilan teng yoki qimmat.
- *Fly.io*: rasmiy uptime kafolati yo'q; 2025–26 insidentlari Postgres koordinatsiya qatlamiga (Consul/Corrosion) tegishli.
- *PlanetScale + MySQL*: **Payload'da MySQL adapteri yo'q** (rasmiy ro'yxat: MongoDB, Postgres, SQLite) — texnik jihatdan imkonsiz. PlanetScale'da bepul tarif ham yo'q.
- *D1 (SQLite)*: eng arzon ($5–6/oy), lekin Neon'dan yiliga atigi ~$60 tejaydi va 67 tur + 8 til + qo'lda yozilgan SQL migratsiyasini talab qiladi. Sayt Workers'da barqarorlashgandan keyin qayta ko'riladi. Foydali holat: `@payloadcms/db-sqlite` allaqachon bog'liqlikda va lokalda ishlatiladi.

**Bajarish rejasi:** `UPDATE.md`.

## ADR-008: Bespoke Studio (/studio) — 2026-07-18
Mijoz Payload adminka UI/UX'idan qoniqmadi ("detskiy", "o'lik"). Payload qobig'ining dizayn shifti bor. Yechim: Payload backend/API sifatida qoladi, ustiga /studio da o'zimizning premium adminka qurildi (Vercel/Stripe uslubi, yorug', real SVG ikonkalar, jonli mikro-animatsiyalar). Auth Payload sessiyasidan (cookie). Kunlik ishlar Studio'da: dashboard, turlar, shaharlar, qo'llanmalar, bosh sahifa (hero), rasmlar, so'rovlar — 8 til localized tahrirlash, rasm yuklash/almashtirish. Yozuvlar Payload REST orqali per-locale PATCH. Eski /admin fallback sifatida qoladi. MUHIM: /api/leads bizning maxsus POST route bilan band — Studio leadlarni server-side (local API) yuklaydi, GET /api/leads emas.
