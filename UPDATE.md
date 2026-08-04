# UPDATE.md — Cloudflare'ga ko'chish (qisqartirilgan reja)

> 2026-07-29 · Tanlangan yo'nalish: Vercel → Cloudflare Workers
> **Jami ish: ~2.5–3 kun.** Natija: **$7–13/oy** (hozirgi $45–64 o'rniga)

---

## Nega ro'yxat qisqardi

Cloudflare'ga o'tish qarori avvalgi rejadagi ishlarning **yarmini keraksiz qiladi**:

| Avvalgi vazifa | Holat |
|---|---|
| Vercel Pro Team ($20/oy) | ❌ **kerak emas** — Vercel'da qolmaymiz |
| Vercel Spend Management | ❌ kerak emas |
| Vercel Log Drain | ❌ kerak emas |
| Warm-ping cron | ❌ kerak emas — Workers'da cold start yo'q |
| Neon region tekshiruvi | ❌ kerak emas |
| Neon tarif/pooler sozlash | ⚠️ soddalashdi — Hyperdrive o'zi pool qiladi |
| Haftalik `pg_dump` + tiklash testi | ⚠️ soddalashdi (pastga qarang) |

**Backup deyarli bepul hal bo'ldi:** agar keyinchalik D1'ga o'tsangiz, **Time Travel** doimo yoniq, **30 kunlik** nuqtaviy tiklash beradi va **qo'shimcha to'lov yo'q**. Neon'da qolsangiz — Launch'ning 7 kunlik PITR'i yetadi.

---

## Nega D1 (eng arzon) emas, Neon qoladi

| | Workers + Neon | Workers + D1 |
|---|---|---|
| Oylik | $7–13 | $5–6 |
| **Yillik farq** | — | **$60 tejaydi** |
| Qo'shimcha ish | — | **+1–2 hafta** |
| Ma'lumot migratsiyasi | yo'q | 67 tur + 8 til + qo'lda SQL |

$60/yil uchun 1–2 hafta ishlash va ma'lumot yo'qotish riskini olish mantiqiy emas.

**D1'ni keyinroq qiling** — sayt Cloudflare'da barqaror ishlagandan 1 oy keyin, xotirjam holda. Uni oxirida ixtiyoriy bo'lim sifatida qoldirdim.

---

# MAJBURIY ishlar

## 1. Sirlarni rotatsiya qilish · 30 daqiqa

Ishlab chiqish jarayonida oshkor bo'lgan. Topshiruvdan oldin shart.

- [ ] `PAYLOAD_SECRET` — yangi tasodifiy qiymat (barcha sessiyalar bekor bo'ladi, bu normal)
- [ ] `GEMINI_API_KEY` + `ANTHROPIC_API_KEY` — revoke + yangi
- [ ] `TELEGRAM_BOT_TOKEN` — @BotFather orqali revoke + yangi
- [ ] Neon baza paroli — reset
- [ ] `admin@tripsfactory.uz` paroli almashtirilsin, mijozga **alohida** hisob ochilsin

`BLOB_READ_WRITE_TOKEN` ni rotatsiya qilmang — u 3-qadamda butunlay olib tashlanadi.

---

## 2. Kesh oynasini uzaytirish · 10 daqiqa

On-demand revalidation allaqachon ishlaydi (`src/payload.config.ts:44`), shuning uchun bu xavfsiz va kontent baribir darhol yangilanadi.

- [x] ✅ **BAJARILDI (2026-07-29)** — 10 ta faylda `export const revalidate = 300` → `86400`, izoh bilan. `npx tsc --noEmit` toza.

```
src/app/[locale]/page.tsx:9
src/app/[locale]/guide/page.tsx:10
src/app/[locale]/guide/[slug]/page.tsx:10
src/app/[locale]/tours/page.tsx:10
src/app/[locale]/tours/group/page.tsx:8
src/app/[locale]/tours/private/page.tsx:8
src/app/[locale]/tours/[country]/[slug]/page.tsx:27
src/app/[locale]/destinations/page.tsx:10
src/app/[locale]/destinations/[region]/[country]/page.tsx:22
src/app/[locale]/premium/page.tsx:8
```

- [ ] **Tekshiruv:** Studio'da tur nomini o'zgartiring → jonli sahifada **darhol** ko'rinsin

---

## 3. Cloudflare Workers'ga ko'chish · ~2 kun

### 3.1 Tayyorgarlik · 1 soat
- [ ] Cloudflare akkaunt + **Workers Paid ($5/oy)**
  - Bepul tarif yaramaydi: bundle 3 MB, CPU 10 ms — Next.js sig'maydi
- [ ] `@opennextjs/cloudflare` o'rnating, `wrangler.jsonc` yarating, `nodejs_compat` yoqing
- [ ] **Bundle hajmini o'lchang — limit 10 MB siqilgan**
  - Oshsa: `exceljs` ni `src/app/api/studio/import/route.ts` ichida dinamik import qiling
  - ⚠️ **Eng katta hissa — Payload `/admin` bundle'i.** Sig'masa: `/admin` ni butunlay olib tashlash mumkin, chunki kundalik ish `/studio` da ketadi va `/admin` faqat zaxira. Bu qaror bundle o'lchovidan keyin qabul qilinadi
- [ ] ⚠️ **Cloudflare to'lov kartasi** — Uzcard/Humo qabul qilinmaydi, xalqaro Visa/MC kerak. Akkaunt kimniki bo'lishini (siz yoki mijoz) oldindan hal qiling

### 3.2 R2 (media) · 2–3 soat
- [ ] R2 bucket yarating (10 GB bepul, egress $0)
- [ ] `payload.config.ts:775` — `vercelBlobStorage` → `@payloadcms/storage-s3` (R2 S3-mos)
- [ ] Media'ni ko'chiring (~13 MB) + DB'dagi URL'larni yangilang
- [ ] `next.config.ts:88` `remotePatterns` → R2 domeni
- [ ] `next.config.ts:60,64` CSP — `img-src` va `connect-src` dagi `*.public.blob.vercel-storage.com` → R2 domeni
- [ ] `npx payload generate:importmap` ni **yangi plugin yoniq holda** qayta ishga tushiring
  - ⚠️ Aks holda `/admin` jimgina bo'sh render bo'ladi — avval boshdan kechirilgan

### 3.3 Rasmlar · 2–3 soat
Loyihada `imageSizes` ishlatilmaydi (`crop: false`, `focalPoint: false`) — shuning uchun `sharp` muammosi yo'q, faqat yetkazish qatlami o'zgaradi.

- [ ] `next/image` uchun custom loader: `/cdn-cgi/image/width=...,format=auto/<R2 URL>`
- [ ] `next.config.ts` da `images.loader: "custom"` + `loaderFile`
- [ ] Unikal transformatsiyalar ~1 600–4 000/oy → **5 000 bepul limitdan past**, qo'shimcha to'lov yo'q

### 3.4 Baza · 1 soat
- [ ] Cloudflare **Hyperdrive** yarating, Neon connection string bilan
- [ ] `payload.config.ts:770` — Hyperdrive binding'idan olsin
- [ ] Neon **pooler'ni o'chiring** (Hyperdrive o'zi pool qiladi)
- [ ] Neon: **Launch** tarifi, **scale-to-zero yoniq**, autoscale max 1 CU

### 3.5 ISR · 1 soat
- [ ] OpenNext incremental cache'ni R2 yoki KV ga sozlang
- [ ] ⚠️ **`revalidatePath()` Workers'da ishlashini tasdiqlang** — butun kontent oqimi shunga tayanadi

### 3.6 Env va deploy oqimi · 1 soat

**Barcha sirlarni Cloudflare'ga ko'chiring** (`wrangler secret put`):

| O'zgaruvchi | Manba |
|---|---|
| `PAYLOAD_SECRET` | 1-qadamda rotatsiya qilingan yangi qiymat |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | lead bildirishnomalari |
| `NEXT_PUBLIC_SITE_URL` | `https://tripsfactory.uz` |
| R2 kalitlari | S3 adapter uchun |
| `DATABASE_URL` | ❌ **kerak emas** — Hyperdrive binding o'rnini bosadi |

- [ ] ⚠️ **`scripts/` lokal ishlaydi va Hyperdrive'ni ko'rmaydi.** `seed.ts`, `reset-content.ts`, `translate-content.ts` uchun lokal `.env` da **to'g'ridan-to'g'ri Neon connection string** saqlanishi kerak
- [ ] `vercel.json` ni o'chiring
- [ ] **Deploy oqimini o'rnating** — Vercel'dagi "git push → avtomatik deploy" yo'qoladi:
  - [x] ✅ **Workflow tayyor:** `.github/workflows/deploy.yml` — `CLOUDFLARE_API_TOKEN` secret qo'yilmaguncha **jim o'tkazib yuboriladi** (push'lar yashil qoladi). Akkaunt ochilgach secretlarni qo'shsangiz o'zi ishlay boshlaydi
  - ⚠️ Workflow ichida importMap ogohlantirishi bor — storage env'larini Deploy qadamiga qo'shishni unutmang
- [ ] Preview muhiti: Vercel bepul preview deploy berardi. Workers'da alohida environment kerak — kamida bitta `staging` worker qo'ying

---

## 4. Test va o'tish · 0.5 kun

- [ ] Avval **`*.workers.dev`** domenida deploy qiling
- [ ] Tekshiring: 8 til · Studio CRUD · lead formasi + Telegram · xarita · xlsx import
- [ ] `/sitemap.xml` va bir sahifaning `<link rel="canonical">` to'g'ri domenni ko'rsatishini tasdiqlang
- [ ] Rasm yuklash → R2'ga tushishini va saytda ko'rinishini tekshiring (`rasm-qoshilmagan.png` placeholder ham)
- [ ] Unsplash rasmlaridan foydalanilsa — custom image loader ularni ham to'g'ri qayta ishlashini tekshiring (`next.config.ts` da `images.unsplash.com` remotePattern bor)
- [ ] `tripsfactory.uz` ni **mijoz nomiga** ro'yxatdan o'tkazing (cctld.uz)
- [ ] DNS Cloudflare'da, Workers'ga yo'naltiring, `www` → apex redirect
- [ ] `NEXT_PUBLIC_SITE_URL=https://tripsfactory.uz` env'ga qo'ying
  - ⚠️ `payload.config.ts:22` fallback `vercel.app` — qo'yilmasa sitemap/canonical noto'g'ri chiqadi
- [ ] **Vercel loyihasini 2 hafta o'chirmang** — orqaga qaytish yo'li

---

## 5. Monitoring · 15 daqiqa

- [ ] UptimeRobot yoki Better Stack (bepul): `/` va `/studio`, 5 daqiqalik interval
- [ ] Ogohlantirish **sizning** Telegram'ingizga

---

## 6. Topshiruv · 1–2 soat

Bu deploy emas, lekin loyihaning bir qismi — mijozga topshirilgach kerak bo'ladi.

- [x] ✅ **BAJARILDI** — mijoz qo'llanmasi: `docs/MIJOZ-QOLLANMA.md`
- [x] ✅ **BAJARILDI** — operatsion/tiklash qo'llanmasi: `docs/TIKLASH.md` (kvadrat qavslardagi joylarni deploy paytida to'ldiring)
- [x] ✅ **BAJARILDI** — `docs/DECISIONS.md` ga **ADR-009** yozildi (ADR-007 dagi `revalidate=300` bandini bekor qiladi)
- [ ] Akkaunt egaligi yozma kelishuv: Cloudflare + Neon kimning nomida, oylik to'lov kim tomonidan

**D1'ga o'tish** (~$5/oy, +$60/yil tejash, 1–2 hafta ish)
Sayt Cloudflare'da 1 oy barqaror ishlagandan keyin ko'rib chiqing. Foydali holat: `@payloadcms/db-sqlite` allaqachon `package.json` da va lokalda ishlaydi — schema SQLite'da ishlashi tasdiqlangan. D1 **Time Travel** 30 kunlik tiklashni bepul beradi.

**Backup avtomatlashtirish** — Neon'da qolsangiz, Launch'ning 7 kunlik PITR'i topshiruv uchun yetarli. Haftalik `pg_dump` ni keyinroq qo'shing.

**Studio'dagi `<img>` teglari** — `MediaManager.tsx:117`, `GalleryPicker.tsx:64`, `fields.tsx:316,467` original rasmlarni yuklaydi. Adminka tezligi uchun, sayt uchun emas. Shoshilinch emas.

---

# Rollback

| Qadam | Orqaga qaytish | Vaqt |
|---|---|---|
| 2 (kesh) | `revalidate` → 300, deploy | 5 daq |
| 3–4 (Cloudflare) | DNS'ni Vercel'ga qaytarish | 5–30 daq |

**Qoida:** Vercel loyihasi va Neon bazasi Cloudflare 2 hafta muammosiz ishlamaguncha o'chirilmaydi.

---

# Xarajat

| | Hozirgi | Ko'chgandan keyin |
|---|---|---|
| Hosting | Vercel $20 + iste'mol | Workers **$5** |
| Baza | Neon $19.4 | Neon **$2–8** |
| Media | Blob $1–4 | R2 **$0** |
| Rasm | Vercel Image Opt | CF Transform **$0** |
| **Oylik** | **$45–64** | **$7–13** |
| **Yillik** | $540–770 | **$84–156** |
