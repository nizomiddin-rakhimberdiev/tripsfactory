# TripsFactory — sayt boshqaruvi qo'llanmasi

Bu qo'llanma sayt kontentini boshqaradigan xodim uchun. Texnik bilim talab qilinmaydi.

---

## Kirish

1. Brauzerda oching: **https://tripsfactory.com/studio**
2. Email va parolni kiriting (sizga alohida berilgan)
3. Kirgach — boshqaruv paneli ochiladi

> Parolni hech kim bilan ulashmang. Yangi xodimga **alohida hisob** oching — pastdagi «Yangi xodim qo'shish» bo'limiga qarang.

---

## Bo'limlar

| Bo'lim | Nima uchun |
|---|---|
| **Bosh sahifa** | Statistika, oxirgi so'rovlar |
| **Turlar** | Tur paketlari — asosiy ish shu yerda |
| **Ekskursiyalar** | Bir kunlik dasturlar — saytdagi «Events» bo'limi |
| **Mintaqalar** | Davlatlar biriktiriladigan yirik hududlar |
| **Davlatlar** | Yo'nalish davlatlari (Xitoy, O'zbekiston…) |
| **Shaharlar** | Shaharlar, ularning tavsifi va xaritadagi joyi |
| **Qo'llanmalar** | Sayohat maslahatlari, maqolalar |
| **Bosh sahifa (kontent)** | Bosh sahifadagi sarlavha va rasmlar |
| **Rasmlar** | Barcha rasmlar ombori |
| **So'rovlar** | Saytdan kelgan mijoz so'rovlari |
| **Import** | Excel jadvaldan turlarni ommaviy yuklash |
| **Foydalanuvchilar** | Studioga kira oladigan hisoblar |

> Saytdagi barcha kontent shu bo'limlardan boshqariladi. Boshqa panel kerak emas.

---

## Tur qo'shish

1. **Turlar** → **Yangi tur**
2. Maydonlarni to'ldiring: nomi, tavsifi, davomiyligi, narxi (USD), kunma-kun dastur
3. Rasm tanlang (yoki yangi yuklang)
4. **Saqlash**

> Yangi tur avtomatik ravishda **qoralama** bo'lib tushadi — saytda ko'rinmaydi.
> Ko'rinishi uchun **«Saytda ko'rsatilsin»** katagini belgilang va yana saqlang.

### Tillar

Sayt 8 tilda ishlaydi. Har bir maydonning yuqorisida til tanlagich bor.

- **Ingliz tili — asosiy.** Avval shuni to'ldiring.
- Saqlaganingizdan keyin qolgan 7 til **avtomatik tarjima qilinadi** — bir necha soniya ketadi, sahifani yopmang.
- Tarjimani qo'lda tuzatsangiz, keyingi saqlashda u **o'zgarmaydi** — faqat bo'sh tillar to'ldiriladi.
- Inglizcha matnni o'zgartirgach barcha tarjimani yangilamoqchi bo'lsangiz — tur sahifasidagi **«Tarjimalarni yangilash»** tugmasini bosing.

---

## Ekskursiya qo'shish

Ekskursiya — bir kunlik dastur. Saytda **Events** bo'limida chiqadi.

1. **Ekskursiyalar** → **Yangi ekskursiya**
2. To'ldiring: nomi, tavsifi, shahar, davomiyligi (soat), narxi (USD, kishiga)
3. Asosiy rasm tanlang; xohlasangiz galereyaga yana rasm qo'shing
4. **Narxga kiradi** ro'yxatini yozing (gid, chiptalar, transport…)
5. Saytda ko'rinishi uchun **«Saytda ko'rsatilsin»** katagini belgilang
6. **Saqlash** — qolgan 7 til avtomatik tarjima qilinadi

> Turdan farqi: ekskursiyada kunma-kun dastur, jo'nash sanalari va davlat maydonlari yo'q. Narx — bitta, kishi boshiga.

---

## Rasm yuklash

1. **Rasmlar** → **Yuklash**
2. Faylni tanlang
3. **Alt matn** yozing — qidiruv tizimlari va ko'zi ojiz foydalanuvchilar uchun muhim

**Tavsiyalar:**
- Eng yaxshi o'lcham: kengligi 2000px atrofida
- Formati: JPG yoki WebP
- Bitta rasm 5 MB dan oshmasin — katta fayllar saytni sekinlashtiradi
- Video yuklamang. Video kerak bo'lsa YouTube'ga qo'ying va havolasini bering

---

## Excel'dan ommaviy import

Ko'p turni birdan qo'shish uchun.

1. **Import** bo'limini oching
2. **Shablonni yuklab oling** (havola shu sahifada)
3. Har bir turni **bitta qatorga** yozing
4. Google Sheets'ga yuklang va havolasini oching (ko'rish huquqi bilan)
5. Havolani Import sahifasiga joylashtiring
6. **Tekshirish (dry-run)** ni bosing — xatolar ko'rsatiladi, hech narsa saqlanmaydi
7. Xato bo'lmasa — **Import qilish**

**Muhim qoidalar:**
- Barcha turlar **qoralama** bo'lib tushadi. Chop etishni qo'lda qilasiz
- Jadvaldagi "Holati" ustuni **o'qilmaydi** — bu ataylab
- Rasm ixtiyoriy. Rasmi yo'q turga vaqtinchalik placeholder qo'yiladi
- Mavjud turni yangilaganda uning **chop etilgan holati o'zgarmaydi**
- Bo'sh ustun "o'chir" degani emas — eski qiymat saqlanadi
- Sanani `01/03/2026 – 30/11/2026` ko'rinishida yozmang — oraliq qabul qilinmaydi

---

## O'zgarish saytda qachon ko'rinadi

**Darhol.** Saqlash tugmasini bosganingizdan keyin sahifani yangilasangiz, o'zgarish o'sha zahoti ko'rinadi.

Ko'rinmasa:
1. Brauzerni majburiy yangilang (`Ctrl+Shift+R` yoki `Cmd+Shift+R`)
2. Tur **chop etilgan** ekanini tekshiring
3. Baribir ko'rinmasa — dasturchiga murojaat qiling

---

## Mijoz so'rovlari

Saytdagi forma to'ldirilganda:
- So'rov **So'rovlar** bo'limiga tushadi
- Bir vaqtda **Telegram**ga xabar keladi

Telegram xabari kelmay qolsa — bu texnik nosozlik, dasturchiga xabar bering.

---

## Yangi xodim qo'shish

1. **Foydalanuvchilar** bo'limini oching
2. Pastdagi formaga email va parol yozing (parol kamida 8 belgi)
3. **Qo'shish**

Parolni unutgan xodim uchun: uning qatoridagi **«Parolni almashtirish»** tugmasini bosing va yangi parol qo'ying. Eski parol darhol ishlamay qoladi.

> Parol saqlangach qayta ko'rsatilmaydi — yozib oling va xodimga xavfsiz yo'l bilan yetkazing.
> O'z hisobingizni o'chira olmaysiz — bu ataylab, aks holda panelga kira olmay qolasiz.

---

## Nima qilmaslik kerak

- ❌ Turni **o'chirmang** — chop etilganini olib tashlash yetarli. O'chirilgan tur qaytarilmaydi (dasturchi aralashuvisiz)
- ❌ Bir necha kishi bir vaqtda bitta turni tahrirlamasin — oxirgi saqlagan g'olib
- ❌ Parolni email yoki Telegram orqali yubormang
- ❌ Rasmlar bo'limidan ishlatilayotgan rasmni o'chirmang — sahifada bo'sh joy qoladi

---

## Yordam

Texnik muammo yoki savol bo'lsa — dasturchiga murojaat qiling.
Muammoni tasvirlashda foydali bo'ladi: **qaysi sahifa**, **nima qilgansiz**, **ekran surati**.
