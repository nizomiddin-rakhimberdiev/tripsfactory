# Rasm qo'llanmasi — TripsFactory

Barcha rasmlar **Admin panel → Media** bo'limiga yuklanadi, keyin tegishli yozuvga ulanadi.
Sayt rasmlarni avtomatik siqadi va moslaydi (WebP/AVIF) — lekin manba sifatli bo'lishi shart.

## Umumiy qoidalar

| Qoida | Qiymat |
|---|---|
| Format | JPG (fotolar uchun); PNG faqat logo/grafika uchun |
| Fayl hajmi | 300 KB – 1.5 MB orasida (yuklashdan oldin squoosh.app da siqing) |
| Rang profili | sRGB |
| Fayl nomi | kichik lotin harflar, defis: `registan-sunset.jpg` (bo'sh joy, kirill, katta harf yo'q) |
| Alt matn | Media yuklashda majburiy — rasmda nima borligini 3–7 so'zda yozing (SEO uchun) |
| Mazmun | Matn/logo bosilgan rasm ishlatmang — sarlavhalar sayt tomonidan qo'yiladi. Rasm ustiga oq matn tushadi, shuning uchun juda oqarib ketgan osmonli kadrlardan qoching |

## Joylashuvlar bo'yicha talablar

### 1. Bosh sahifa hero — `Site Content → Hero → Image`
- **O'lcham:** 2400×1350 px (16:9), minimal 1920×1080
- **Kadr:** keng panorama, markazida "nafas oladigan" joy — ustiga sarlavha tushadi
- **Mazmun:** eng kuchli, "vau" kadr — Registon, gumbazlar, quyosh botishi. Bu saytning birinchi taassuroti
- Qorong'iroq/kontrastli kadr yaxshi — ustiga qora parda (40%) va oq matn qo'yiladi

### 2. Premium hero — `Site Content → Premium Hero → Image`
- **O'lcham:** 2400×1350 px (16:9)
- **Kayfiyat:** kinematik, to'q tonlar (kechki/tungi kadr, shamlar, interer, cho'lda yulduzlar) — premium bo'lim qora-oltin temada
- Yorug' kunduzgi kadr bu yerga mos kelmaydi

### 3. Tur rasmi — `Tours → Hero Image`
- **O'lcham:** 1800×1200 px (3:2)
- **Diqqat:** rasm ikki joyda ko'rinadi — katalog kartasida 3:2 va tur sahifasida 5:2 (keng lenta) kesimda. Shuning uchun **asosiy obyekt kadr markazida (vertikal o'rtada)** bo'lsin — tepasi/pasti kesilishi mumkin
- **Mazmun:** turdagi eng yorqin manzara; odamli kadrlar (sayohatchilar orqadan) ishonch qo'shadi

### 4. Shahar rasmi — `Cities → Image`
- **O'lcham:** 1600×800 px (2:1)
- **Mazmun:** shaharning tanib olinadigan ramzi (Xiva — Kalta Minor, Buxoro — Poi Kalon...)
- Gorizontal panorama kadr; vertikal (portret) kadr yaramaydi

### 5. Davlat rasmi — `Countries → Hero Image`
- **O'lcham:** 2400×1200 px (2:1), minimal 1920×960
- **Diqqat:** ikki joyda: bosh sahifadagi kartada (2:1) va davlat sahifasi tepasida keng hero sifatida. Pastki qismiga qoraytirish tushadi — muhim detal pastda bo'lmasin

## Tezkor jadval (chop etish uchun)

| Joy | Admin'dagi maydon | O'lcham (px) | Nisbat |
|---|---|---|---|
| Bosh sahifa hero | Site Content → Hero | 2400×1350 | 16:9 |
| Premium hero | Site Content → Premium Hero | 2400×1350 | 16:9, to'q |
| Tur | Tours → Hero Image | 1800×1200 | 3:2, markazda |
| Shahar | Cities → Image | 1600×800 | 2:1 |
| Davlat | Countries → Hero Image | 2400×1200 | 2:1 |

## Ish tartibi (kontent-menejer uchun)

1. Rasmni tanlang → squoosh.app da kerakli o'lchamga kichraytirib, JPG (sifat ~80) qilib saqlang
2. Admin → **Media** → Upload, alt matnni yozing
3. Tegishli yozuvni oching (Tour/City/Country yoki Site Content) → rasm maydonida yangi yuklangan rasmni tanlang → Save
4. Saytda 5 daqiqa ichida yangilanadi
