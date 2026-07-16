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
