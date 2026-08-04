# Operatsion qo'llanma — tiklash va xizmat ko'rsatish

Bu hujjat dasturchi uchun. Sayt buzilganda yoki loyihani boshqa dasturchi qabul qilganda birinchi o'qiladigan fayl.

> ⚠️ Kvadrat qavslardagi joylarni deploy paytida to'ldiring.

---

## 1. Infratuzilma xaritasi

| Xizmat | Nima uchun | Akkaunt | Oylik |
|---|---|---|---|
| Cloudflare Workers | Sayt hosting | `[email]` | $5 |
| Cloudflare R2 | Rasmlar ombori | (yuqoridagi bilan bir) | $0 |
| Neon | PostgreSQL baza | `[email]` | $2–8 |
| cctld.uz | `tripsfactory.uz` domeni | `[mijoz nomida]` | ~$10–30/yil |
| UptimeRobot | Uptime monitoring | `[email]` | $0 |
| Telegram Bot | Lead bildirishnomalari | @BotFather | $0 |

**To'lovni kim qiladi:** `[siz / mijoz]`
**Karta:** xalqaro Visa/MC. Uzcard va Humo qabul qilinmaydi.

---

## 2. Sirlar (secrets)

Cloudflare'da `wrangler secret put <NOM>` orqali saqlanadi. Repoda hech qachon saqlanmaydi.

| Nom | Nima uchun | Qayerdan olinadi |
|---|---|---|
| `PAYLOAD_SECRET` | Sessiya shifrlash | tasodifiy 32+ belgi |
| `TELEGRAM_BOT_TOKEN` | Lead xabarlari | @BotFather |
| `TELEGRAM_CHAT_ID` | Qaysi chatga | @BotFather / bot API |
| `NEXT_PUBLIC_SITE_URL` | Sitemap, canonical, JSON-LD | `https://tripsfactory.uz` |
| R2 kalitlari | Media yuklash | Cloudflare → R2 → API tokens |

**Baza:** `DATABASE_URL` **Cloudflare'da kerak emas** — Hyperdrive binding o'rnini bosadi.

⚠️ **Lokal ishlash uchun** `.env` da to'g'ridan-to'g'ri Neon connection string kerak — `scripts/` (seed, reset-content, translate-content) Hyperdrive'ni ko'rmaydi.

### Sirlarni rotatsiya qilish
`PAYLOAD_SECRET` almashtirilsa — barcha sessiyalar bekor bo'ladi, hamma qayta kiradi. Bu normal.

---

## 3. Bazani tiklash

### Neon PITR (asosiy usul)
Neon konsoli → loyiha → **Restore**. Oxirgi **7 kun** ichidagi istalgan nuqtaga.
Buzilgan yozuvni fahmlaganingizdan keyin darhol qiling — oyna 7 kun.

### Qo'lda dump'dan
```
pg_restore -d "<yangi connection string>" <dump fayli>
```

Tiklashdan keyin **majburiy:** saytda bir sahifani ochib, Studio'ga kirib tekshiring.

---

## 4. Rasmlarni tiklash

R2 versiyalashni avtomatik qilmaydi. O'chirilgan rasm qaytarilmaydi.
Media papkasining nusxasi: `[qayerda saqlanadi]`

Rasm yo'qolsa: Studio → Rasmlar → qayta yuklash → tegishli turga ulash.

---

## 5. Tez-tez uchraydigan nosozliklar

### `/admin` oq sahifa bo'lib qoldi
**Sabab:** `src/app/(payload)/admin/importMap.js` storage plugini **o'chiq** holda generatsiya qilingan va commit qilingan.
**Yechim:** storage env o'zgaruvchilari yoniq holda qayta generatsiya qiling:
```
<R2 env'lari> npx payload generate:importmap
```
**Oldini olish:** har `npm run build` dan keyin `git status` ni tekshiring; bu faylni tasodifan commit qilmang. Batafsil: `AGENTS.md`.

### Studio'da so'rovlar ro'yxati bo'sh
`/api/leads` — bizning maxsus POST route. `GET` 405 qaytaradi, bu **kutilgan**. Studio leadlarni server tomonda local API orqali yuklaydi.

### Skript ishga tushganda osilib qoldi
`getPayload` dev-push interaktiv so'rovda osiladi. Skriptlarni `NODE_ENV=production` bilan ishga tushiring — bu push'ni o'chiradi.

### Kontent o'zgardi, saytda ko'rinmayapti
1. Tur **chop etilgan**mi?
2. O'zgarish `scripts/` yoki to'g'ridan-to'g'ri SQL orqali qilinganmi? Unda on-demand revalidation ishlamaydi — 24 soatgacha kutiladi yoki qayta deploy qilinadi.
3. `revalidateSite()` (payload.config.ts) yo'llar ro'yxatida o'sha sahifa bormi?

### Baza sekin javob bermoqda
Neon scale-to-zero yoniq — 5 daqiqa harakatsizlikdan keyin uxlaydi, uyg'onishi ~0.3–0.8 s. Bu **kutilgan** va faqat birinchi so'rovga ta'sir qiladi. Tashrifchilar buni sezmaydi (sahifalar keshdan).

---

## 6. Deploy

```
wrangler deploy
```

Yoki `main` ga push — GitHub Actions avtomatik deploy qiladi (`.github/workflows/deploy.yml`).

**Kerakli GitHub Secrets:** `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`

### Orqaga qaytarish
Cloudflare dashboard → Workers → **Deployments** → oldingi versiya → Rollback.

---

## 7. Oylik tekshiruv (5 daqiqa)

- [ ] UptimeRobot: o'tgan oyda uzilish bo'lganmi
- [ ] Neon: CU-soat iste'moli (kutilgan ~15–25/oy)
- [ ] Cloudflare: so'rovlar soni va xatolar
- [ ] Test: Studio'ga kirib, bitta o'zgarish saqlab, saytda ko'ring
- [ ] Baza tiklashni yiliga bir marta sinang — sinalmagan backup backup emas

---

## 8. Loyihani topshirish

Boshqa dasturchiga o'tkazishda:
1. Bu fayl + `AGENTS.md` + `docs/DECISIONS.md` ni o'qitish
2. Cloudflare, Neon, domen akkauntlariga kirish berish
3. Barcha sirlarni rotatsiya qilish
4. `UPDATE.md` — infratuzilma qarorlari tarixi
