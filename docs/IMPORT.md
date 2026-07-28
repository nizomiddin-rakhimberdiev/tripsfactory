# Turlarni Google Sheets orqali import qilish

Mijoz bitta varaqli jadvalga turlarni yozadi, siz Studio'da havolani tashlaysiz
— turlar bazaga **qoralama** bo'lib tushadi. Keyin har birini ochib, rasmini
qo'yasiz va saytga chiqarasiz.

## Jarayon

1. **Studio → Sheets import → «Shablonni yuklab olish»** (`public/tripsfactory-turlar-shabloni.xlsx`).
2. Faylni Google Drive'ga yuklang → o'ng tugma → **Open with → Google Sheets**.
3. **Share → Anyone with the link** → havolani mijozga bering.
4. Mijoz har bir turni bitta qatorga yozadi.
5. Studio'da havolani qo'yib **Tekshirish** → ko'rib chiqasiz → **Qo'shish**.
6. Studio → Turlar: har bir turni ochib rasmini almashtirasiz va «Saytda
   ko'rsatilsin» ni belgilaysiz.

## Jadval

Bitta varaq — **`Turlar`**. Nomi o'zgarmasligi kerak. 19 ta ustun chapdan
o'ngga; har bir tur bitta qator. Ma'lumot 8-qatordan boshlanadi (yuqorida
sarlavha, izoh qatori va ikkita kulrang namuna).

| Ustun | Izoh |
| --- | --- |
| № | Tartib raqami. `NAMUNA` deb yozilgan qatorlar import qilinmaydi. |
| Tur nomi | Majburiy. **Sayt manzili shu nomdan yasaladi** — keyin o'zgartirilsa yangi tur paydo bo'ladi. |
| Davlat | Saytda oldindan mavjud bo'lishi shart. |
| Tur formati / Xizmat darajasi | Guruh turi / Individual / So'rov bo'yicha; Standart / Premium. |
| Davomiyligi, Narxi, Yakka joy | Faqat raqam. |
| Shaharlar | Vergul bilan. Saytda yo'q shaharlar e'tiborsiz qoldiriladi (tur baribir qo'shiladi). |
| Qisqa tavsif | Majburiy. |
| Kunma-kun dastur | Har kun `1-kun.` bilan yangi qatordan. Sarlavha bilan tavsif orasiga ` — ` qo'yiladi. |
| Narxga kiradi / kirmaydi | Har band yangi qatordan. |
| Jo'nash sanalari | `2026-08-07 — $1390 — Kafolatlangan`, har biri yangi qatordan. |
| Asosiy rasm / Qo'shimcha rasmlar | **Ixtiyoriy.** Drive havolasi yoki to'g'ridan-to'g'ri URL. |
| Bosh sahifada, Holati | Ha/Yo'q; Holati importda hisobga olinmaydi. |
| Izoh (ichki) | Import qilinmaydi — ta'minotchi kodi, netto narx uchun. |

## Import qoidalari

**Hammasi qoralama bo'lib qo'shiladi.** Jadvaldagi «Holati» ustuni ataylab
o'qilmaydi. Yangi tur har doim saytda ko'rinmaydigan holatda tushadi; chop
etishni Studio'dan bittalab qilasiz.

**Rasm shart emas.** Rasmi yo'q turga vaqtinchalik «Rasm qo'shilmagan» rasmi
qo'yiladi (kutubxonada bitta nusxa, hammasi shuni ishlatadi). Studio → Turlar
ro'yxatida qaysi turga rasm kerakligi darhol ko'rinadi.

**Mavjud tur yangilanadi, saytdan olib tashlanmaydi.** Nomi bir xil bo'lsa
o'sha tur yangilanadi; agar u allaqachon chop etilgan bo'lsa — chop etilganicha
qoladi. Bo'sh ustun «o'chir» degani emas: jadvalda kunlar yozilmagan bo'lsa,
bazadagilar joyida qoladi. Shuning uchun bir jadvalni bir necha marta import
qilish xavfsiz.

**Kun sarlavhasi.** `1-kun. Arrival in Tashkent — Meet at the airport…` →
sarlavha «Arrival in Tashkent», tavsif qolgani. ` — ` qo'yilmagan bo'lsa butun
matn tavsifga tushadi, sarlavha esa «Day 1» bo'ladi — matn yo'qolmaydi.

**Mavsum oralig'i qabul qilinmaydi.** `01/03/2026 – 30/11/2026 — $1490 — kunlik
jo'nash` kabi qatorlar o'tkazib yuboriladi va tekshiruvda sanaladi: saytdagi
jo'nashlar aniq sana bo'lishi kerak. Har kuni jo'naydigan turlarda bu ustunni
bo'sh qoldiring va mavsumni «Qisqa tavsif» ga yozing.

## Tez-tez uchraydigan xatolar

| Xabar | Sababi |
| --- | --- |
| «Jadval ochiq emas» | Share → Anyone with the link → Viewer qilinmagan. |
| «Turlar nomli varaq topilmadi» | Varaq nomi o'zgartirilgan. |
| «Sarlavha qatori topilmadi» | 4-qatordagi ustun nomlari o'zgartirilgan. |
| «... davlati saytda yo'q» | Davlat Studio → Davlatlar bo'limida yo'q. Davlat/shahar import orqali qo'shilmaydi. |

## Kod

| Fayl | Vazifasi |
| --- | --- |
| `src/lib/import/schema.ts` | 19 ustun ta'rifi + parser. Shablon ham, import ham shundan. |
| `src/lib/import/sheet.ts` | Jadvalni `export?format=xlsx` orqali yuklab olish. |
| `src/lib/import/apply.ts` | `plan()` (tekshiruv) va `apply()` (yozish), rasm/placeholder. |
| `src/app/api/studio/import/route.ts` | Admin-only endpoint. |
| `src/components/studio/ImportPanel.tsx` | Studio ekrani. |
| `scripts/make-import-template.ts` | `npm run template` — shablonni qayta yozadi. |

**Nega gviz emas, xlsx?** Google'ning `gviz/tq?tqx=out:csv` endpoint'i ikki
marta jimgina buzdi: (1) u nechta boshlang'ich qator «sarlavha» ekanini o'zi
taxmin qilib, sarlavha bannerini, haqiqiy sarlavhani, izoh qatorini va ikkala
namunani bitta katakka qo'shib yuboradi; (2) har bir ustunga tur beradi, va
raqamli ustun ustidagi matnli sarlavha (`№`, `Davomiyligi (kun)`) umuman
qaytmaydi. `export?format=xlsx` esa jadvalni foydalanuvchi ko'rgan holida
beradi. Bu yo'lga qaytmang.

Yangi ustun qo'shish: `schema.ts` dagi `COLUMNS` ga qo'shing, `apply.ts` da
`data` ga yozing, so'ng `npm run template`.
