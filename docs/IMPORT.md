# Turlarni Google Sheets orqali import qilish

Turizm menejeri turlarni jadvalga yozadi, siz Studio'da havolani tashlaysiz —
turlar bazaga tushadi va saytda chiqadi. Jadval dasturchisiz to'ldiriladigan
qilib loyihalangan: qaerda ro'yxatdan tanlash mumkin bo'lsa, qo'lda yozish
imkoni yo'q.

## Shablonni olish

**Studio → Sheets import → «Shablonni yuklab olish».**

Shablon har safar yangidan yig'iladi (`/api/studio/import/template`, faqat
admin uchun). Davlat va shahar ro'yxatlari o'sha ondagi bazadan olinadi,
shuning uchun menejer mavjud bo'lmagan joyni tanlay olmaydi. Yangi davlat yoki
shahar qo'shilsa — shablonni qaytadan yuklab oling.

`npm run template` bazasiz, umumiy ro'yxatlar bilan
`public/tripsfactory-turlar-shablon.xlsx` faylini yozadi (`-- --live` bilan
jonli ma'lumot). Bu — zaxira nusxa; mijozga Studio'dagi versiyani bering.

Mijozga berish: faylni Google Drive'ga yuklang → o'ng tugma → **Open with →
Google Sheets** → **Share → Anyone with the link → Editor**.

## Jadval tuzilishi

| Varaq | Nima uchun |
| --- | --- |
| `Boshlash` | Menejer uchun qo'llanma: qadamlar, ranglar legendasi, rasm/narx/dastur qoidalari, xatolar ro'yxati. |
| `Turlar` | Har bir qatorda bitta tur. |
| `Kunlar` | Kunma-kun dastur — bitta kun, bitta qator. |
| `Narx` | Narxga kiradi / kirmaydi bandlari. |
| `Sanalar` | Guruh turlari uchun jo'nash sanalari. |
| `Rasmlar` | Bitta rasm — bitta qator. Har turda aynan bitta «Asosiy rasm = Ha». |
| `Tekshiruv` | 17 ta avtomatik tekshiruv. Import oldidan hammasi «Toza» bo'lishi kerak. |
| `Royxatlar` | Dropdown'lar manbai: davlatlar va shaharlar. Qo'lda tegilmaydi. |

Uchta qoida butun formatni ushlab turadi:

- **Varaq nomlari va 1-qatordagi ustun nomlari o'zgarmaydi** — import shularga
  tayanadi. Ustunlar tartibini almashtirsa bo'ladi.
- **`#` bilan boshlanadigan qatorlar import qilinmaydi.** Izoh qatori va
  kulrang namunalar shuning uchun `#` bilan boshlanadi — menejer ularni
  o'chirmasdan, ko'z oldida namuna sifatida saqlab qo'yadi.
- **Turlar bir-biriga «Tur ID» orqali bog'lanadi.** Boshqa varaqlarda Tur ID
  qo'lda yozilmaydi — «Turlar» varag'idagi ro'yxatdan tanlanadi.

### Ranglar

| Rang | Ma'nosi |
| --- | --- |
| Qizil sarlavha | Majburiy maydon |
| Yashil sarlavha | Ro'yxatdan tanlanadi |
| Ko'k sarlavha | Ixtiyoriy |
| Kulrang sarlavha | Avtomatik hisoblanadi — yozilmaydi |
| Katak qizarib ketdi | Shu katakda xato bor |

Har bir sarlavhada izoh (hover) bor: nima yozilishi, namuna, va aynan shu
ustunda tez-tez qilinadigan xato.

### Xatolarning oldini olish

Jadval xatoni import'dan oldin ushlaydi — uch qavatda:

1. **Kiritish cheklovi (data validation).** Dropdown'lar, butun son, manfiy
   bo'lmagan narx va `YIL-OY-KUN` sana formati qabul qilinmaydigan qiymatni
   rad etadi. Tur ID, havola va sana uchun cheklov «ogohlantirish»
   darajasida — noto'g'ri qoida menejerni o'z jadvalidan qulflab qo'yishidan
   ko'ra, xatoni qizil rang bilan ko'rsatgan afzal.
2. **Shartli formatlash.** Takrorlangan Tur ID, «Turlar»da mavjud bo'lmagan
   Tur ID, bo'sh majburiy katak, raqam bo'lmagan narx, buzuq sana, `http`
   bilan boshlanmagan havola, bitta turda ikkita «Asosiy rasm» — hammasi
   darhol qizaradi. «Turlar» varag'idagi «Tayyorlik» ustuni har bir tur uchun
   yashil/sariq javob beradi.
3. **`Tekshiruv` varag'i.** 17 ta formula butun jadvalni sanaydi: bo'sh
   majburiy maydonlar, takrorlangan va noto'g'ri yozilgan ID, noto'g'ri
   davomiylik va narxlar, ro'yxatda yo'q davlat, rasmi yo'q turlar, kunlar
   soni davomiylikka mos kelmasligi, buzuq sanalar, har bir varaqdagi
   bog'lanmagan qatorlar. Yuqoridagi katta xulosa «Jadval tayyor» deb yozsa —
   havolani yuborish mumkin.

## Kontent tili

Kontent **inglizcha** to'ldiriladi (tur nomi, tavsif, kunlar, bandlar). Jadval
interfeysi — o'zbekcha. Sayt 8 tilda ishlaydi, lekin Payload har bir maydonni
alohida EN'ga qaytaradi (fallback), shuning uchun faqat EN bilan ham sayt
to'liq ko'rinadi. Parser dropdown qiymatlarining inglizcha variantlarini ham
qabul qiladi (`Published`, `Yes`, `Group`, `Luxury`, `Available` ...).

## Rasmlar

Eng kam savol tug'diradigan yo'l tanlandi: **bitta Google Drive papkasi +
har bir rasm uchun havola**.

1. Drive'da bitta papka oching, uni **Anyone with the link → Viewer** qiling.
2. Barcha tur rasmlarini shu papkaga yuklang.
3. Rasm ustida o'ng tugma → **Share → Copy link** → «Rasmlar» varag'idagi
   «Rasm havolasi» ustuniga qo'ying.

Drive havolasi (`/file/d/<id>/view`) import paytida to'g'ridan-to'g'ri yuklab
olish manziliga o'giriladi. To'g'ridan-to'g'ri `https://... .jpg` havola ham,
Studio kutubxonasidagi mavjud fayl nomi ham ishlaydi.

Har turda aynan bitta qatorda **Asosiy rasm = Ha** bo'lishi kerak — o'sha rasm
katalogda va tur sahifasi tepasida chiqadi, qolganlari galereyaga tushadi.
Belgilanmasa birinchi rasm olinadi (ogohlantirish bilan), ikkitasi
belgilansa — birinchisi.

Bir xil havola qayta-qayta yuklanmaydi: fayl nomi havola hash'idan yasaladi,
shuning uchun bir jadvalni necha marta import qilsangiz ham kutubxona
to'lib ketmaydi.

## Narx

Barcha narxlar **AQSh dollarida** — CMS'da narx maydoni USD'da saqlanadi,
shuning uchun valyuta tanlovi ataylab qo'yilmadi. Jadvalga `890` deb faqat
raqam yoziladi; `$`, probel va `USD` qabul qilinmaydi.

- «Narxi, $ (dan)» bo'sh bo'lsa, saytda «so'rov bo'yicha» chiqadi.
- Guruh turida har bir jo'nash sanasiga o'z narxi «Sanalar» varag'ida.

## Import qanday ishlaydi

`Studio → Sheets import` → havolani qo'ying → **Tekshirish**.

Tekshiruv hech narsani o'zgartirmaydi. Har bir tur uchun ko'rsatadi:

- **Yangi** / **Yangilanadi** / **Xato**
- nechta kun, shahar, band, sana, rasm topilgani
- xatolar (import to'sadi) va ogohlantirishlar (to'smaydi)

Hammasi joyida bo'lsa — **Import qilish**.

### Nima yozilishi

- Yangi Tur ID → yangi tur yaratiladi.
- Mavjud Tur ID → o'sha tur **yangilanadi** (o'chirilmaydi).
- **Bo'sh ustun — «o'chir» degani emas.** Jadvalda kunlar yozilmagan bo'lsa,
  bazadagi mavjud kunlar joyida qoladi. Shu sabab qisman to'ldirilgan jadvalni
  qayta import qilish xavfsiz.
- Xaritadagi marshrut «Shahar 1..6» ustunlaridan tartib bo'yicha chiziladi
  (shaharlarda koordinata bo'lsa) — lekin Studio'da qo'lda qo'yilgan marshrut
  ustiga yozilmaydi.
- Davlat va shahar nomi bo'yicha ham, slug bo'yicha ham topiladi.

## Tez-tez uchraydigan xatolar

| Xabar | Sababi |
| --- | --- |
| «Jadval ochiq emas» | Sheets ulashilmagan. Share → Anyone with the link → Viewer. |
| «Turlar varag'ida sarlavha qatori topilmadi» | 1-qator o'chirilgan yoki ustun nomlari o'zgartirilgan. |
| «... davlati topilmadi» | Davlat qo'lda yozilgan yoki hali Studio'da yo'q. Davlat/shaharlar import orqali qo'shilmaydi — ular oldindan bo'lishi kerak. |
| «bironta ham to'ldirilgan qator topilmadi» | Menejer o'z turlarini namuna qatorlari ustiga yozgan (`#` bilan boshlanadi) yoki umuman yozmagan. |
| «... rasm emas» | Havola rasm sahifasiga olib boradi, faylga emas; yoki Drive fayli ulashilmagan. |

## CMS'da yo'q maydonlar

Shablonda **faqat saytda ko'rinadigan maydonlar** bor. Quyidagilar ataylab
qo'shilmadi, chunki Tours kolleksiyasida ular yo'q va import ularni jimgina
tashlab ketardi: qiyinchilik darajasi (difficulty), transport turi, ovqatlanish
rejimi, tur tili, chegirma foizi, valyuta tanlovi.

Ular kerak bo'lsa — avval `src/payload.config.ts` dagi `Tours` kolleksiyasiga
maydon qo'shiladi, sayt shablonlarida chiqariladi, so'ng shu yerga ustun
qo'shiladi. Aks holda menejer to'ldirgan ustun hech qayerga bormaydi.

## Kod qayerda

| Fayl | Vazifasi |
| --- | --- |
| `src/lib/import/schema.ts` | Ustunlar ta'rifi + parser. Shablon, tekshiruv formulalari va import — hammasi shundan. |
| `src/lib/import/template.ts` | `.xlsx` quruvchi: dizayn, dropdown'lar, shartli formatlash, `Tekshiruv` varag'i. |
| `src/lib/import/reference.ts` | Dropdown'lar uchun jonli davlat/shahar ro'yxati. |
| `src/lib/import/sheet.ts` | Google Sheets'dan varaqni nomi bo'yicha CSV qilib olish. |
| `src/lib/import/csv.ts` | CSV o'quvchi. |
| `src/lib/import/apply.ts` | Tekshiruv (`plan`) va yozish (`apply`), rasmlarni yuklash. |
| `src/app/api/studio/import/route.ts` | Import endpoint (admin-only). |
| `src/app/api/studio/import/template/route.ts` | Shablon generatori (admin-only). |
| `src/components/studio/ImportPanel.tsx` | Studio ekrani. |
| `scripts/make-import-template.ts` | Zaxira `.xlsx` yozuvchi CLI. |
| `scripts/check-import-template.ts` | `npm run template:check` — shablon strukturasi va parser round-trip auditi. |

Yangi ustun qo'shish: `schema.ts` dagi ro'yxatga ustunni qo'shing (`header`,
`hint`, `help`, `kind`, kerak bo'lsa `options`/`check`), `apply.ts` da uni
`data` ga yozing, so'ng `npm run template && npm run template:check`. Shablon,
tekshiruv varag'i va parser bitta manbadan kelgani uchun ular bir-biridan
uzilib qolmaydi.
