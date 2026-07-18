import { getPayload } from "payload";
import config from "../src/payload.config";

const payload = await getPayload({ config });
const res = await payload.find({
  collection: "countries",
  where: { slug: { equals: "uzbekistan" } },
  limit: 1,
});
const id = res.docs[0]?.id;
if (!id) {
  console.log("uzbekistan not found");
  process.exit(1);
}

const uz = `## Nega O'zbekiston?

O'zbekiston — Buyuk Ipak yo'lining yuragi, bu yerda **ikki yarim ming yillik tarix** zamonaviy hayot bilan uyg'unlashgan. Feruza gumbazlar, gavjum bozorlar va afsonaviy mehmondo'stlik sizni kutmoqda.

### Ko'rish kerak bo'lgan joylar
- Samarqanddagi **Registon** maydoni — Ipak yo'lining eng mashhur ramzi
- Buxoroning muqaddas eski shahri — 140 ta yodgorlik
- Xiva — ochiq osmon ostidagi muzey shahri
- Toshkent — bezakli metrosi bilan zamonaviy poytaxt

### Amaliy ma'lumot
- **Viza:** 90+ davlat fuqarolari uchun vizasiz (30 kun)
- **Eng yaxshi mavsum:** bahor (aprel–may) va kuz (sentabr–oktabr)
- **Valyuta:** so'm; kartalar shaharlarda qabul qilinadi
- **Til:** o'zbek va rus; turistik joylarda ingliz tili

> Ipak yo'lidagi bu sayohat sizni asrlar qa'riga olib boradi.`;

const en = `## Why Uzbekistan?

Uzbekistan is the heart of the Great Silk Road, where **two and a half millennia of history** meet modern life. Turquoise domes, bustling bazaars and legendary hospitality await.

### Must-see places
- **Registan Square** in Samarkand — the Silk Road's most iconic sight
- The holy old town of Bukhara — 140 monuments
- Khiva — an open-air museum city
- Tashkent — a modern capital with ornate metro stations

### Practical info
- **Visa:** visa-free for 90+ nationalities (30 days)
- **Best season:** spring (Apr–May) and autumn (Sep–Oct)
- **Currency:** som; cards accepted in cities
- **Language:** Uzbek and Russian; English at tourist sites

> This journey along the Silk Road takes you back through the centuries.`;

await payload.update({ collection: "countries", id, locale: "uz", data: { body: uz } });
await payload.update({ collection: "countries", id, locale: "en", data: { body: en } });
console.log("Sample body set for Uzbekistan (uz, en).");
process.exit(0);
