/**
 * The contract between the workbook a travel manager fills in and the Tours
 * collection.
 *
 * One definition, three consumers: `template.ts` builds the .xlsx from these
 * columns, the importer parses a filled-in workbook back through them, and the
 * validation sheet's formulas are generated from the same metadata. Keeping all
 * three on one source is what stops the template, the checker and the parser
 * from drifting apart — the classic way an import feature rots.
 *
 * Column headers are business language, not field names. `header` is what the
 * manager sees; `key` is what the code uses; `aliases` keeps every earlier
 * spelling working, so a workbook filled in against an older template still
 * imports.
 *
 * Only English content is collected. The site runs eight locales, but Payload
 * falls back to EN field-by-field, so an EN-only import is complete and correct
 * on day one; translations land later without touching the sheet.
 */
import type { DepartureStatus, TourTier, TourType } from "@/lib/content/types";

/**
 * Tab names. ASCII and apostrophe-free: the four data tabs are fetched through
 * the gviz `sheet=` parameter, and the rest match for consistency.
 */
export const TAB = {
  guide: "Boshlash",
  tours: "Turlar",
  days: "Kunlar",
  price: "Narx",
  departures: "Sanalar",
  images: "Rasmlar",
  check: "Tekshiruv",
  lists: "Royxatlar",
} as const;

/** Every tab the importer reads. The guide, checker and list tabs are inert. */
export const DATA_TABS = [
  TAB.tours,
  TAB.days,
  TAB.price,
  TAB.departures,
  TAB.images,
] as const;

/**
 * Drives both the colour of a column and how hard the sheet argues with a bad
 * value: `required` cells go red when empty, `calc` cells are formulas the
 * manager never types into.
 */
export type ColumnKind = "required" | "optional" | "dropdown" | "calc";

export type Column = {
  key: string;
  /** Row 1 — what the manager reads. Business language. */
  header: string;
  /** Row 2 — one short line under the header. */
  hint: string;
  /** Hover note: what it is, an example, and the mistake people actually make. */
  help: string;
  kind: ColumnKind;
  width: number;
  required?: boolean;
  /** Extra accepted spellings: old headers, machine keys, English equivalents. */
  aliases?: string[];
  /** Fixed dropdown values. */
  options?: string[];
  /** Dropdown sourced from live data on the reference tab. */
  optionsFrom?: "countries" | "cities" | "tourIds";
  /** Cell-level checks the template enforces with conditional formatting. */
  check?: "integer-positive" | "money" | "date" | "url" | "id";
  example?: string;
  example2?: string;
  /** `calc` columns only: an Excel formula, given its row number. */
  formula?: (row: number) => string;
};

/* ------------------------------------------------------------- dropdown sets */

export const TOUR_FORMATS = ["Guruh turi", "Individual", "So'rov bo'yicha"];
export const SERVICE_LEVELS = ["Standart", "Premium (lyuks)"];
export const YES_NO = ["Ha", "Yo'q"];
export const PUBLISH_STATES = ["Chop etilgan", "Qoralama"];
export const PRICE_KINDS = ["Narxga kiradi", "Narxga kirmaydi"];
export const SEAT_STATES = ["Joy bor", "Kafolatlangan", "Sotilgan"];

/* -------------------------------------------------------------------- tours */

const CITY_SLOTS = 6;

/** `Shahar 1..6` — six dropdowns beat one comma-separated cell nobody gets right. */
const cityColumns: Column[] = Array.from({ length: CITY_SLOTS }, (_, i) => ({
  key: `city_${i + 1}`,
  header: `Shahar ${i + 1}`,
  hint: i === 0 ? "Marshrut tartibida" : "",
  help:
    `Tur o'tadigan ${i + 1}-shahar. Ro'yxatdan tanlang — qo'lda yozmang. ` +
    "Shaharlar marshrut tartibida bo'lsin: xaritadagi chiziq shu tartibda chiziladi. " +
    "Kerak bo'lmasa bo'sh qoldiring.",
  kind: "dropdown",
  optionsFrom: "cities",
  width: 18,
  aliases: i === 0 ? ["cities", "Shaharlar (slug, vergul bilan)", "Shaharlar"] : [],
  example: i === 0 ? "Bukhara" : "",
  example2: ["Khiva", "Bukhara", "Samarkand", "Tashkent", "", ""][i],
}));

export const TOUR_COLUMNS: Column[] = [
  {
    key: "slug",
    header: "Tur ID",
    hint: "Betakror, o'zgarmas",
    help:
      "Turning ichki belgisi — boshqa varaqlar shu orqali bu turga ulanadi.\n\n" +
      "NAMUNA: mystic-bukhara-5-days\n" +
      "QOIDA: faqat kichik lotin harflar, raqam va defis. Bo'sh joy, o'zbekcha harf, " +
      "bosh harf va nuqta ishlatilmaydi.\n" +
      "XATO: bir xil ID ni ikki qatorga yozish, yoki tur saytga chiqqandan keyin ID ni " +
      "o'zgartirish — bu yangi tur yaratadi, eskisi joyida qoladi.",
    kind: "required",
    required: true,
    check: "id",
    width: 28,
    aliases: ["Manzil (slug)", "tour_id", "Tour ID"],
    example: "mystic-bukhara-5-days",
    example2: "silk-road-grand-tour",
  },
  {
    key: "country",
    header: "Davlat",
    hint: "Ro'yxatdan tanlang",
    help:
      "Tur qaysi davlatda o'tadi.\n\n" +
      "Ro'yxatdan tanlang — qo'lda yozilgan nom import paytida topilmaydi.\n" +
      "Ro'yxatda kerakli davlat yo'q bo'lsa, uni avval saytga qo'shish kerak: " +
      "TripsFactory jamoasiga ayting.",
    kind: "dropdown",
    required: true,
    optionsFrom: "countries",
    width: 20,
    aliases: ["Davlat (slug)"],
    example: "Uzbekistan",
    example2: "Uzbekistan",
  },
  {
    key: "title",
    header: "Tur nomi",
    hint: "Inglizcha",
    help:
      "Saytda va katalog kartasida chiqadigan sarlavha. Inglizcha yoziladi.\n\n" +
      "NAMUNA: Mystic Bukhara — 5 Days\n" +
      "MASLAHAT: nomga davomiylikni qo'shish mijozga darhol tushunarli bo'ladi.",
    kind: "required",
    required: true,
    width: 34,
    aliases: ["Tur nomi (inglizcha)"],
    example: "Mystic Bukhara — 5 Days",
    example2: "Silk Road Grand Tour — 12 Days",
  },
  {
    key: "summary",
    header: "Qisqa tavsif",
    hint: "Inglizcha, 2-3 gap",
    help:
      "Katalog kartasida va tur sahifasi tepasida chiqadigan matn. Inglizcha.\n\n" +
      "NAMUNA: Five unhurried days in the holy city of Bukhara — madrasahs, " +
      "caravanserais and a night in a merchant's house.\n" +
      "XATO: bu yerga butun dasturni yozish. Kunma-kun dastur «Kunlar» varag'ida.",
    kind: "required",
    required: true,
    width: 52,
    aliases: ["Qisqa tavsif (inglizcha)"],
    example:
      "Five unhurried days in the holy city of Bukhara — madrasahs, caravanserais and a night in a merchant's house.",
    example2:
      "The full Uzbek Silk Road: Khiva, Bukhara, Samarkand and Tashkent, with a desert yurt camp on the way.",
  },
  {
    key: "type",
    header: "Tur formati",
    hint: "Ro'yxatdan tanlang",
    help:
      "Guruh turi — e'lon qilingan sanalarda, boshqa mijozlar bilan birga.\n" +
      "Individual — faqat shu mijoz uchun, istalgan sanada.\n" +
      "So'rov bo'yicha — dastur mijoz bilan birga tuziladi.\n\n" +
      "«Sanalar» varag'i odatda faqat guruh turlari uchun to'ldiriladi.",
    kind: "dropdown",
    required: true,
    options: TOUR_FORMATS,
    width: 17,
    aliases: ["Turi", "Tour Type"],
    example: "Individual",
    example2: "Guruh turi",
  },
  {
    key: "tier",
    header: "Xizmat darajasi",
    hint: "Ro'yxatdan tanlang",
    help:
      "Premium (lyuks) turlar saytdagi alohida Premium bo'limida, o'z dizayni bilan chiqadi.\n" +
      "Qolgan hamma narsa — Standart.",
    kind: "dropdown",
    options: SERVICE_LEVELS,
    width: 18,
    aliases: ["Daraja", "Service Level"],
    example: "Standart",
    example2: "Premium (lyuks)",
  },
  {
    key: "duration_days",
    header: "Davomiyligi (kun)",
    hint: "Butun son",
    help:
      "Necha kunlik tur.\n\n" +
      "NAMUNA: 5\n" +
      "QOIDA: 1 dan katta butun son. «5 kun» deb yozmang — faqat raqam.\n" +
      "TEKSHIRUV: «Kunlar» varag'idagi kunlar soni shunga teng bo'lishi kerak.",
    kind: "required",
    required: true,
    check: "integer-positive",
    width: 15,
    aliases: ["Davomiyligi (kun)", "duration"],
    example: "5",
    example2: "12",
  },
  {
    key: "price_from_usd",
    header: "Narxi, $ (dan)",
    hint: "Faqat raqam",
    help:
      "Bir kishi uchun eng past narx, AQSh dollarida.\n\n" +
      "NAMUNA: 890\n" +
      "QOIDA: faqat raqam. «$890», «890 USD», «890$» yozmang — valyuta har doim dollar.\n" +
      "Narx «so'rov bo'yicha» bo'lsa — katakni bo'sh qoldiring.",
    kind: "optional",
    check: "money",
    width: 15,
    aliases: ["Narxi (USD, dan)", "price"],
    example: "890",
    example2: "",
  },
  {
    key: "single_supplement_usd",
    header: "Yakka joy qo'shimchasi, $",
    hint: "Faqat raqam",
    help:
      "Yolg'iz sayohat qiluvchi uchun qo'shimcha to'lov, dollarda.\n\n" +
      "NAMUNA: 180\n" +
      "Qo'shimcha olinmasa — bo'sh qoldiring.",
    kind: "optional",
    check: "money",
    width: 20,
    aliases: ["Yakka joy qo'shimchasi (USD)"],
    example: "180",
    example2: "420",
  },
  ...cityColumns,
  {
    key: "featured",
    header: "Bosh sahifada",
    hint: "Ha / Yo'q",
    help:
      "«Ha» bo'lsa tur bosh sahifadagi tanlangan turlar orasida chiqadi.\n\n" +
      "MASLAHAT: 3-6 ta turdan ko'p belgilamang — bosh sahifa siqilib qoladi.",
    kind: "dropdown",
    options: YES_NO,
    width: 15,
    aliases: ["Bosh sahifada ko'rsatilsin"],
    example: "Yo'q",
    example2: "Ha",
  },
  {
    key: "published",
    header: "Holati",
    hint: "Chop etilgan / Qoralama",
    help:
      "«Chop etilgan» — import qilinishi bilan tur saytda ko'rinadi.\n" +
      "«Qoralama» — tur bazaga tushadi, lekin saytda ko'rinmaydi. Keyin Studio'dan " +
      "chop etasiz.\n\n" +
      "MASLAHAT: rasmlar va matnlar to'liq tayyor bo'lmaguncha «Qoralama» qoldiring.",
    kind: "dropdown",
    options: PUBLISH_STATES,
    width: 17,
    aliases: ["Saytda ko'rsatilsin", "Status"],
    example: "Chop etilgan",
    example2: "Qoralama",
  },
  {
    key: "calc_days",
    header: "Kunlar (avto)",
    hint: "Avtomatik",
    help: "«Kunlar» varag'ida shu tur uchun nechta kun yozilgani. O'zi hisoblanadi — yozmang.",
    kind: "calc",
    width: 13,
    formula: (r) => `IF($A${r}="","",COUNTIF(${TAB.days}!$A:$A,$A${r}))`,
  },
  {
    key: "calc_images",
    header: "Rasmlar (avto)",
    hint: "Avtomatik",
    help: "«Rasmlar» varag'ida shu tur uchun nechta rasm borligi. O'zi hisoblanadi — yozmang.",
    kind: "calc",
    width: 14,
    formula: (r) => `IF($A${r}="","",COUNTIF(${TAB.images}!$A:$A,$A${r}))`,
  },
  {
    key: "calc_departures",
    header: "Sanalar (avto)",
    hint: "Avtomatik",
    help: "«Sanalar» varag'ida shu tur uchun nechta jo'nash sanasi borligi.",
    kind: "calc",
    width: 14,
    formula: (r) => `IF($A${r}="","",COUNTIF(${TAB.departures}!$A:$A,$A${r}))`,
  },
  {
    key: "calc_ready",
    header: "Tayyorlik",
    hint: "Avtomatik",
    help:
      "Tur import qilishga tayyormi. «Tayyor» bo'lmasa — qizil kataklarni to'ldiring " +
      "va «Tekshiruv» varag'iga qarang.",
    kind: "calc",
    width: 26,
    formula: (r) =>
      `IF($A${r}="","",` +
      `IF(COUNTBLANK($B${r})+COUNTBLANK($C${r})+COUNTBLANK($D${r})+COUNTBLANK($E${r})+COUNTBLANK($G${r})>0,"To'ldirilmagan maydon bor",` +
      `IF(COUNTIF(${TAB.images}!$A:$A,$A${r})=0,"Rasm qo'shilmagan",` +
      `IF(COUNTIF($A$5:$A$400,$A${r})>1,"Tur ID takrorlangan",` +
      `"Tayyor"))))`,
  },
];

/* --------------------------------------------------------------------- days */

export const DAY_COLUMNS: Column[] = [
  {
    key: "tour",
    header: "Tur ID",
    hint: "Ro'yxatdan tanlang",
    help:
      "Bu kun qaysi turga tegishli. Ro'yxatdan tanlang — ro'yxat «Turlar» varag'idan olinadi.\n\n" +
      "XATO: qo'lda yozib, harf xato qilish. Unda bu kun hech qaysi turga tushmaydi.",
    kind: "dropdown",
    required: true,
    optionsFrom: "tourIds",
    width: 28,
    aliases: ["Tur (slug)"],
    example: "mystic-bukhara-5-days",
  },
  {
    key: "day",
    header: "Kun",
    hint: "1, 2, 3 ...",
    help:
      "Kun raqami. Har bir tur uchun 1 dan boshlanadi.\n\n" +
      "XATO: bitta tur ichida bir xil kun raqamini ikki marta ishlatish.",
    kind: "required",
    required: true,
    check: "integer-positive",
    width: 8,
    aliases: ["Kun raqami"],
    example: "1",
  },
  {
    key: "title",
    header: "Kun sarlavhasi",
    hint: "Inglizcha, qisqa",
    help: "Qisqa sarlavha.\n\nNAMUNA: Arrival in Bukhara",
    kind: "required",
    required: true,
    width: 30,
    aliases: ["Kun sarlavhasi (inglizcha)"],
    example: "Arrival in Bukhara",
  },
  {
    key: "description",
    header: "Kun tavsifi",
    hint: "Inglizcha",
    help:
      "O'sha kuni nima bo'lishi. Bir necha gap yozsangiz bo'ladi.\n\n" +
      "MASLAHAT: katak ichida yangi qator uchun Ctrl+Enter bosing.",
    kind: "required",
    required: true,
    width: 64,
    aliases: ["Kun tavsifi (inglizcha)"],
    example:
      "Meet your guide at the station and walk into the old town for the first view of the Kalyan minaret at dusk.",
  },
];

/* -------------------------------------------------------------------- price */

export const PRICE_COLUMNS: Column[] = [
  {
    key: "tour",
    header: "Tur ID",
    hint: "Ro'yxatdan tanlang",
    help: "Bu band qaysi turga tegishli. Ro'yxatdan tanlang.",
    kind: "dropdown",
    required: true,
    optionsFrom: "tourIds",
    width: 28,
    aliases: ["Tur (slug)"],
    example: "mystic-bukhara-5-days",
  },
  {
    key: "kind",
    header: "Turi",
    hint: "Kiradi / Kirmaydi",
    help:
      "Bu band tur narxiga kiradimi yoki alohida to'lanadimi.\n\n" +
      "MASLAHAT: mijoz eng ko'p «nimalar kirmaydi» ni o'qiydi — aviabilet, viza, " +
      "sug'urta, tushlik kabi bandlarni albatta yozing.",
    kind: "dropdown",
    required: true,
    options: PRICE_KINDS,
    width: 20,
    aliases: ["Kiradi / Kirmaydi"],
    example: "Narxga kiradi",
  },
  {
    key: "text",
    header: "Band matni",
    hint: "Inglizcha, bitta band",
    help:
      "Bitta band — bitta qator.\n\n" +
      "NAMUNA: 4 nights in a boutique hotel, breakfast included\n" +
      "XATO: bitta katakka o'nta bandni vergul bilan tiqish.",
    kind: "required",
    required: true,
    width: 64,
    aliases: ["Matn (inglizcha)", "Matn"],
    example: "4 nights in a boutique hotel, breakfast included",
  },
];

/* --------------------------------------------------------------- departures */

export const DEPARTURE_COLUMNS: Column[] = [
  {
    key: "tour",
    header: "Tur ID",
    hint: "Ro'yxatdan tanlang",
    help: "Qaysi turning jo'nashi. Odatda faqat guruh turlari uchun to'ldiriladi.",
    kind: "dropdown",
    required: true,
    optionsFrom: "tourIds",
    width: 28,
    aliases: ["Tur (slug)"],
    example: "silk-road-grand-tour",
  },
  {
    key: "date",
    header: "Jo'nash sanasi",
    hint: "YIL-OY-KUN",
    help:
      "Faqat bitta format: YIL-OY-KUN.\n\n" +
      "NAMUNA: 2026-04-12\n" +
      "QOIDA: 12.04.2026 yoki 12/04/2026 yozmang — oy va kun almashib ketishi mumkin.\n" +
      "Katak «Matn» formatida turibdi, shuning uchun yozganingiz o'zgarmaydi.",
    kind: "required",
    required: true,
    check: "date",
    width: 16,
    aliases: ["Sana"],
    example: "2026-04-12",
  },
  {
    key: "price_usd",
    header: "Narx, $",
    hint: "Faqat raqam",
    help:
      "Shu sanadagi bir kishi uchun narx, dollarda.\n\n" +
      "NAMUNA: 1740\n" +
      "Mavsumga qarab narx har xil bo'lsa — har sanaga o'z narxini yozing.",
    kind: "required",
    required: true,
    check: "money",
    width: 12,
    aliases: ["Narx (USD)"],
    example: "1740",
  },
  {
    key: "status",
    header: "Joylar holati",
    hint: "Ro'yxatdan tanlang",
    help:
      "Joy bor — sotuvda.\n" +
      "Kafolatlangan — guruh to'plangan, albatta jo'naydi.\n" +
      "Sotilgan — joy qolmadi (saytda ko'rinadi, lekin band qilib bo'lmaydi).",
    kind: "dropdown",
    required: true,
    options: SEAT_STATES,
    width: 18,
    aliases: ["Holat"],
    example: "Kafolatlangan",
  },
];

/* ------------------------------------------------------------------- images */

export const IMAGE_COLUMNS: Column[] = [
  {
    key: "tour",
    header: "Tur ID",
    hint: "Ro'yxatdan tanlang",
    help: "Rasm qaysi turga tegishli. Ro'yxatdan tanlang.",
    kind: "dropdown",
    required: true,
    optionsFrom: "tourIds",
    width: 28,
    example: "mystic-bukhara-5-days",
  },
  {
    key: "main",
    header: "Asosiy rasm",
    hint: "Har turda bitta «Ha»",
    help:
      "«Ha» — bu turning asosiy rasmi: katalogda, bosh sahifada va tur sahifasi " +
      "tepasida shu rasm chiqadi. Har bir turda aynan bitta «Ha» bo'lishi kerak.\n" +
      "«Yo'q» — rasm galereyaga (karuselga) tushadi.\n\n" +
      "MASLAHAT: asosiy rasm gorizontal (keng) bo'lsin — 1600x1000 atrofida.",
    kind: "dropdown",
    required: true,
    options: YES_NO,
    width: 15,
    example: "Ha",
  },
  {
    key: "url",
    header: "Rasm havolasi",
    hint: "Google Drive havolasi",
    help:
      "Rasmni Drive papkasiga yuklang → fayl ustida o'ng tugma → «Share» → " +
      "«Anyone with the link» → «Copy link» → shu katakka qo'ying.\n\n" +
      "To'g'ridan-to'g'ri havola ham bo'ladi: https://... .jpg\n" +
      "XATO: Drive'da faylni ulashmasdan havolani nusxalash — import rasmni " +
      "yuklab ololmaydi.\n" +
      "XATO: Google Images'dagi rasm ustiga bosib olingan havola — u ko'pincha " +
      "rasm emas, sahifa havolasi bo'ladi.",
    kind: "required",
    required: true,
    check: "url",
    width: 56,
    aliases: ["hero_image", "gallery", "Asosiy rasm (havola)", "Galereya rasmlari"],
    example: "https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrStUv/view?usp=sharing",
  },
  {
    key: "caption",
    header: "Izoh (ixtiyoriy)",
    hint: "Inglizcha",
    help:
      "Rasmda nima borligi — ko'rish imkoniyati cheklanganlar va Google uchun " +
      "(alt matn).\n\nNAMUNA: Kalyan minaret at sunset\n" +
      "Bo'sh qoldirsangiz tur nomi ishlatiladi.",
    kind: "optional",
    width: 32,
    example: "Kalyan minaret at sunset",
  },
];

/* -------------------------------------------------------------------- sheets */

export type SheetSpec = {
  tab: string;
  title: string;
  subtitle: string;
  columns: Column[];
  idKey: string;
  samples: string[][];
};

const sampleRows = (columns: Column[], second: boolean): string[][] => {
  const first = columns.map((c) => c.example ?? "");
  return second ? [first, columns.map((c) => c.example2 ?? "")] : [first];
};

export const SHEETS: SheetSpec[] = [
  {
    tab: TAB.tours,
    title: "Turlar",
    subtitle: "Har bir qatorda bitta tur. Avval shu varaqni to'ldiring.",
    columns: TOUR_COLUMNS,
    idKey: "slug",
    samples: sampleRows(TOUR_COLUMNS, true),
  },
  {
    tab: TAB.days,
    title: "Kunma-kun dastur",
    subtitle: "Har bir qatorda bitta kun. Bir tur uchun bir necha qator bo'ladi.",
    columns: DAY_COLUMNS,
    idKey: "tour",
    samples: [
      DAY_COLUMNS.map((c) => c.example ?? ""),
      ["mystic-bukhara-5-days", "2", "Old town on foot", "Poi Kalyan, Miri Arab and the trading domes, with lunch in a former caravanserai."],
      ["mystic-bukhara-5-days", "3", "Craft workshops", "A morning with a sixth-generation blacksmith, an afternoon at the silk carpet looms."],
    ],
  },
  {
    tab: TAB.price,
    title: "Narxga kiradi / kirmaydi",
    subtitle: "Har bir qatorda bitta band.",
    columns: PRICE_COLUMNS,
    idKey: "tour",
    samples: [
      PRICE_COLUMNS.map((c) => c.example ?? ""),
      ["mystic-bukhara-5-days", "Narxga kiradi", "English-speaking guide throughout"],
      ["mystic-bukhara-5-days", "Narxga kirmaydi", "International flights and visa fees"],
    ],
  },
  {
    tab: TAB.departures,
    title: "Jo'nash sanalari",
    subtitle: "Guruh turlari uchun. Individual turlarga shart emas.",
    columns: DEPARTURE_COLUMNS,
    idKey: "tour",
    samples: [
      DEPARTURE_COLUMNS.map((c) => c.example ?? ""),
      ["silk-road-grand-tour", "2026-05-03", "1740", "Joy bor"],
      ["silk-road-grand-tour", "2026-09-20", "1890", "Joy bor"],
    ],
  },
  {
    tab: TAB.images,
    title: "Rasmlar",
    subtitle: "Har bir qatorda bitta rasm. Har turda aynan bitta «Asosiy rasm = Ha».",
    columns: IMAGE_COLUMNS,
    idKey: "tour",
    samples: [
      IMAGE_COLUMNS.map((c) => c.example ?? ""),
      ["mystic-bukhara-5-days", "Yo'q", "https://drive.google.com/file/d/1XyZaBcDeFgHiJkLmNoPqRs/view?usp=sharing", "Trading domes in the morning"],
      ["silk-road-grand-tour", "Ha", "https://drive.google.com/file/d/1QqRrSsTtUuVvWwXxYyZz01/view?usp=sharing", "Registan square at dusk"],
    ],
  },
];

/** Header row, hint row, then the samples — so data always starts here. */
export const firstDataRow = (sheet: SheetSpec): number => 3 + sheet.samples.length;

/* ------------------------------------------------------------------ values */

/** `Davomiyligi (kun)`, `duration_days` and `Duration Days` all find one column. */
export function normalizeHeader(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[’‘`´]/g, "'")
    .replace(/[^a-z0-9']+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function aliasesOf(col: Column): string[] {
  return [col.key, col.header, ...(col.aliases ?? [])].map(normalizeHeader);
}

const TYPE_VALUES: Record<string, TourType> = {
  guruh: "group",
  guruh_turi: "group",
  group: "group",
  individual: "private",
  private: "private",
  shaxsiy: "private",
  buyurtma: "custom",
  so_rov_bo_yicha: "custom",
  custom: "custom",
  request: "custom",
};

const TIER_VALUES: Record<string, TourTier> = {
  oddiy: "standard",
  standart: "standard",
  standard: "standard",
  premium: "premium",
  premium_lyuks: "premium",
  lyuks: "premium",
  luxury: "premium",
};

const STATUS_VALUES: Record<string, DepartureStatus> = {
  joy_bor: "available",
  mavjud: "available",
  available: "available",
  kafolatlangan: "guaranteed",
  guaranteed: "guaranteed",
  sotilgan: "soldout",
  sotildi: "soldout",
  soldout: "soldout",
  sold_out: "soldout",
};

const KIND_VALUES: Record<string, "included" | "excluded"> = {
  kiradi: "included",
  narxga_kiradi: "included",
  included: "included",
  kirmaydi: "excluded",
  narxga_kirmaydi: "excluded",
  excluded: "excluded",
};

const PUBLISH_VALUES: Record<string, boolean> = {
  chop_etilgan: true,
  chop_etildi: true,
  published: true,
  live: true,
  qoralama: false,
  draft: false,
};

const TRUE_VALUES = new Set(["ha", "xa", "yes", "true", "1", "x", "✓", "+", "da", "bor"]);

export function parseBool(raw: string): boolean {
  return TRUE_VALUES.has(normalizeHeader(raw));
}

/** Tolerates `$1,200`, `1 200`, `1200.50` — what people actually type. */
export function parseNumber(raw: string): number | null {
  const cleaned = raw.replace(/[$\s ,]/g, "").replace(/^-$/, "");
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

export type DateParse = { ok: true; date: string; guessed: boolean } | { ok: false };

/**
 * The template asks for YYYY-MM-DD text and formats the column as text to keep
 * it that way, but a workbook that has been through someone's locale settings
 * can still arrive as 12/04/2026. Those forms are accepted and flagged as
 * guessed, so the preview can warn rather than silently sell the wrong month.
 */
export function parseDate(raw: string): DateParse {
  const value = raw.trim();
  if (!value) return { ok: false };

  const iso = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) return build(Number(iso[1]), Number(iso[2]), Number(iso[3]), false);

  const parts = value.match(/^(\d{1,2})([./-])(\d{1,2})\2(\d{4})$/);
  if (parts) {
    const a = Number(parts[1]);
    const sep = parts[2];
    const b = Number(parts[3]);
    const year = Number(parts[4]);
    // `.` and `-` are day-first everywhere the client works; `/` is Sheets'
    // US default and month-first — unless the first number cannot be a month.
    const dayFirst = sep !== "/" || a > 12;
    return build(year, dayFirst ? b : a, dayFirst ? a : b, true);
  }

  const serial = Number(value);
  if (Number.isInteger(serial) && serial > 20000 && serial < 80000) {
    const ms = Date.UTC(1899, 11, 30) + serial * 86_400_000;
    return { ok: true, date: new Date(ms).toISOString().slice(0, 10), guessed: true };
  }

  return { ok: false };

  function build(y: number, m: number, d: number, guessed: boolean): DateParse {
    if (m < 1 || m > 12 || d < 1 || d > 31) return { ok: false };
    const pad = (n: number) => String(n).padStart(2, "0");
    return { ok: true, date: `${y}-${pad(m)}-${pad(d)}`, guessed };
  }
}

/** Split a multi-value cell: commas, semicolons or in-cell line breaks. */
export function parseList(raw: string): string[] {
  return raw
    .split(/[\n;,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/* ----------------------------------------------------------------- parsing */

export type TourDraft = {
  row: number;
  slug: string;
  country: string;
  title: string;
  summary: string;
  type: TourType;
  tier: TourTier;
  durationDays: number;
  priceFromUsd: number | null;
  singleSupplementUsd: number | null;
  cities: string[];
  heroImage: string;
  heroCaption: string;
  gallery: string[];
  featured: boolean;
  published: boolean;
  itinerary: { day: number; title: string; description: string }[];
  included: string[];
  excluded: string[];
  departures: { date: string; priceUsd: number; status: DepartureStatus }[];
  errors: string[];
  warnings: string[];
};

export type SheetIssue = {
  tab: string;
  row: number | null;
  message: string;
  level: "error" | "warning";
};

export type ParseResult = { tours: TourDraft[]; issues: SheetIssue[] };

type Grid = { header: Record<string, number>; rows: { row: number; cells: string[] }[] };

/**
 * Finds the header row and indexes it.
 *
 * Two rows are skipped by rule rather than by position: anything whose id cell
 * starts with `#` (the hint row and the worked samples) and anything with no id
 * at all (the formula columns leave a trail of blanks down an untouched sheet).
 * The manager can therefore keep the examples in front of them while they work
 * instead of deleting them and losing the reference.
 */
function readGrid(
  rows: string[][],
  columns: Column[],
  idKey: string,
  tab: string,
  issues: SheetIssue[],
): Grid | null {
  const wanted = new Map<string, string>();
  for (const col of columns) for (const a of aliasesOf(col)) wanted.set(a, col.key);

  const headerIndex = rows.findIndex((r) =>
    r.some((cell) => wanted.get(normalizeHeader(cell)) === idKey),
  );
  if (headerIndex === -1) {
    issues.push({
      tab,
      row: null,
      message: `«${tab}» varag'ida sarlavha qatori topilmadi — birinchi qatorda «Tur ID» ustuni bo'lishi kerak. Shablon sarlavhalarini o'zgartirmang.`,
      level: "error",
    });
    return null;
  }

  const header: Record<string, number> = {};
  rows[headerIndex].forEach((cell, i) => {
    const key = wanted.get(normalizeHeader(cell));
    if (key && !(key in header)) header[key] = i;
  });

  const missing = columns
    .filter((c) => c.required && !(c.key in header))
    .map((c) => c.header);
  if (missing.length) {
    issues.push({
      tab,
      row: null,
      message: `«${tab}» varag'ida majburiy ustun(lar) yo'q: ${missing.join(", ")}.`,
      level: "error",
    });
    return null;
  }

  const idIndex = header[idKey];
  const data = rows
    .slice(headerIndex + 1)
    .map((cells, i) => ({ row: headerIndex + 2 + i, cells }))
    .filter(({ cells }) => {
      const id = (cells[idIndex] ?? "").trim();
      if (id.startsWith("#")) return false;
      // No id and nothing else typed → an untouched row, not a mistake.
      if (!id && cells.every((c) => c.trim() === "")) return false;
      return true;
    });

  return { header, rows: data };
}

const cell = (grid: Grid, cells: string[], key: string): string =>
  key in grid.header ? (cells[grid.header[key]] ?? "").trim() : "";

export function parseSheets(raw: {
  tours: string[][];
  days: string[][];
  price: string[][];
  departures: string[][];
  images: string[][];
}): ParseResult {
  const issues: SheetIssue[] = [];

  const toursGrid = readGrid(raw.tours, TOUR_COLUMNS, "slug", TAB.tours, issues);
  if (!toursGrid) return { tours: [], issues };

  const tours: TourDraft[] = [];
  const bySlug = new Map<string, TourDraft>();

  for (const { row, cells } of toursGrid.rows) {
    const get = (k: string) => cell(toursGrid, cells, k);
    const errors: string[] = [];
    const warnings: string[] = [];

    const slug = get("slug").toLowerCase();
    if (!slug) {
      issues.push({
        tab: TAB.tours,
        row,
        message: "«Tur ID» bo'sh, lekin qatorda ma'lumot bor — qator o'tkazib yuborildi.",
        level: "error",
      });
      continue;
    }
    if (!SLUG_RE.test(slug)) {
      errors.push(
        `Tur ID noto'g'ri: «${slug}». Faqat kichik lotin harflar, raqam va defis ishlating (masalan: mystic-bukhara-5-days).`,
      );
    }
    if (bySlug.has(slug)) {
      errors.push(`Bu Tur ID jadvalda takrorlangan (avvalgisi ${bySlug.get(slug)!.row}-qatorda).`);
    }

    const country = get("country");
    if (!country) errors.push("«Davlat» tanlanmagan.");

    const title = get("title");
    if (!title) errors.push("«Tur nomi» to'ldirilmagan.");

    const summary = get("summary");
    if (!summary) errors.push("«Qisqa tavsif» to'ldirilmagan.");

    const rawType = normalizeHeader(get("type"));
    const type = TYPE_VALUES[rawType];
    if (!type) {
      errors.push(
        get("type")
          ? `«Tur formati» ustunidagi «${get("type")}» tushunarsiz. Ro'yxatdan tanlang.`
          : "«Tur formati» tanlanmagan.",
      );
    }

    const rawTier = normalizeHeader(get("tier"));
    const tier = rawTier ? TIER_VALUES[rawTier] : "standard";
    if (rawTier && !tier) {
      warnings.push(`«Xizmat darajasi» dagi «${get("tier")}» tushunarsiz — «Standart» qabul qilindi.`);
    }

    const durationDays = parseNumber(get("duration_days"));
    if (durationDays === null || durationDays < 1 || !Number.isInteger(durationDays)) {
      errors.push("«Davomiyligi (kun)» 1 dan katta butun son bo'lishi kerak.");
    }

    const priceRaw = get("price_from_usd");
    const priceFromUsd = priceRaw ? parseNumber(priceRaw) : null;
    if (priceRaw && priceFromUsd === null) {
      errors.push(`«Narxi» ustunidagi «${priceRaw}» raqam emas.`);
    } else if (priceFromUsd !== null && priceFromUsd < 0) {
      errors.push("«Narxi» manfiy bo'lishi mumkin emas.");
    }

    const suppRaw = get("single_supplement_usd");
    const singleSupplementUsd = suppRaw ? parseNumber(suppRaw) : null;
    if (suppRaw && singleSupplementUsd === null) {
      warnings.push(`«Yakka joy qo'shimchasi» dagi «${suppRaw}» raqam emas — e'tiborsiz qoldirildi.`);
    }

    // Six dropdown slots, plus the old single comma-separated column.
    const cities: string[] = [];
    for (let i = 1; i <= CITY_SLOTS; i += 1) {
      const value = get(`city_${i}`);
      if (value) cities.push(...parseList(value));
    }

    const publishRaw = normalizeHeader(get("published"));
    const published = publishRaw in PUBLISH_VALUES ? PUBLISH_VALUES[publishRaw] : parseBool(get("published"));

    const draft: TourDraft = {
      row,
      slug,
      country,
      title,
      summary,
      type: type ?? "group",
      tier: tier ?? "standard",
      durationDays: durationDays ?? 0,
      priceFromUsd,
      singleSupplementUsd,
      cities,
      heroImage: "",
      heroCaption: "",
      gallery: [],
      featured: parseBool(get("featured")),
      published,
      itinerary: [],
      included: [],
      excluded: [],
      departures: [],
      errors,
      warnings,
    };

    tours.push(draft);
    if (!bySlug.has(slug)) bySlug.set(slug, draft);
  }

  /** Child tabs all key off a Tour ID; an unknown one is reported, not dropped silently. */
  const forTour = (tab: string, idCell: string, row: number): TourDraft | null => {
    const slug = idCell.toLowerCase();
    const tour = bySlug.get(slug);
    if (!tour) {
      issues.push({
        tab,
        row,
        message: slug
          ? `«${slug}» «Turlar» varag'ida yo'q — bu qator import qilinmaydi.`
          : "«Tur ID» tanlanmagan — bu qator import qilinmaydi.",
        level: "warning",
      });
      return null;
    }
    return tour;
  };

  const daysGrid = readGrid(raw.days, DAY_COLUMNS, "tour", TAB.days, issues);
  if (daysGrid) {
    for (const { row, cells } of daysGrid.rows) {
      const get = (k: string) => cell(daysGrid, cells, k);
      const tour = forTour(TAB.days, get("tour"), row);
      if (!tour) continue;

      const day = parseNumber(get("day"));
      const title = get("title");
      const description = get("description");
      if (!title || !description) {
        tour.errors.push(`«Kunlar» ${row}-qator: sarlavha va tavsif ikkalasi ham to'ldirilishi kerak.`);
        continue;
      }
      tour.itinerary.push({ day: day ?? tour.itinerary.length + 1, title, description });
    }
  }

  const priceGrid = readGrid(raw.price, PRICE_COLUMNS, "tour", TAB.price, issues);
  if (priceGrid) {
    for (const { row, cells } of priceGrid.rows) {
      const get = (k: string) => cell(priceGrid, cells, k);
      const tour = forTour(TAB.price, get("tour"), row);
      if (!tour) continue;

      const kind = KIND_VALUES[normalizeHeader(get("kind"))];
      const text = get("text");
      if (!text) continue;
      if (!kind) {
        tour.errors.push(
          `«Narx» ${row}-qator: «${get("kind")}» tushunarsiz — «Narxga kiradi» yoki «Narxga kirmaydi» tanlang.`,
        );
        continue;
      }
      (kind === "included" ? tour.included : tour.excluded).push(text);
    }
  }

  const depGrid = readGrid(raw.departures, DEPARTURE_COLUMNS, "tour", TAB.departures, issues);
  if (depGrid) {
    for (const { row, cells } of depGrid.rows) {
      const get = (k: string) => cell(depGrid, cells, k);
      const tour = forTour(TAB.departures, get("tour"), row);
      if (!tour) continue;

      const date = parseDate(get("date"));
      if (!date.ok) {
        tour.errors.push(
          `«Sanalar» ${row}-qator: «${get("date")}» sana sifatida o'qilmadi. 2026-04-12 ko'rinishida yozing.`,
        );
        continue;
      }
      if (date.guessed) {
        tour.warnings.push(`«Sanalar» ${row}-qator: «${get("date")}» → ${date.date} deb tushunildi. Tekshiring.`);
      }

      const priceUsd = parseNumber(get("price_usd"));
      if (priceUsd === null || priceUsd < 0) {
        tour.errors.push(`«Sanalar» ${row}-qator: narx noto'g'ri («${get("price_usd")}»).`);
        continue;
      }

      const status = STATUS_VALUES[normalizeHeader(get("status"))] ?? "available";
      tour.departures.push({ date: date.date, priceUsd, status });
    }
  }

  // Images last: the hero is whichever row is flagged, so the whole tab has to
  // be read before either field can be decided.
  const imgGrid = readGrid(raw.images, IMAGE_COLUMNS, "tour", TAB.images, issues);
  if (imgGrid) {
    const perTour = new Map<string, { url: string; main: boolean; caption: string; row: number }[]>();
    for (const { row, cells } of imgGrid.rows) {
      const get = (k: string) => cell(imgGrid, cells, k);
      const tour = forTour(TAB.images, get("tour"), row);
      if (!tour) continue;

      // One legacy column held several URLs at once; a modern row holds one.
      const urls = parseList(get("url"));
      if (!urls.length) {
        tour.errors.push(`«Rasmlar» ${row}-qator: havola bo'sh.`);
        continue;
      }
      const list = perTour.get(tour.slug) ?? [];
      for (const url of urls) {
        list.push({ url, main: parseBool(get("main")), caption: get("caption"), row });
      }
      perTour.set(tour.slug, list);
    }

    for (const [slug, list] of perTour) {
      const tour = bySlug.get(slug)!;
      const mains = list.filter((i) => i.main);
      if (mains.length > 1) {
        tour.warnings.push(
          `«Rasmlar» varag'ida ${mains.length} ta rasm «Asosiy» deb belgilangan — birinchisi olindi (${mains[0].row}-qator).`,
        );
      }
      const hero = mains[0] ?? list[0];
      if (!mains.length) {
        tour.warnings.push("Asosiy rasm belgilanmagan — ro'yxatdagi birinchi rasm olindi.");
      }
      tour.heroImage = hero.url;
      tour.heroCaption = hero.caption;
      tour.gallery = list.filter((i) => i !== hero).map((i) => i.url);
    }
  }

  // Ordering and cross-tab sanity, once every tab has been read.
  for (const tour of tours) {
    tour.itinerary.sort((a, b) => a.day - b.day);
    const days = tour.itinerary.map((d) => d.day);
    const dupes = days.filter((d, i) => days.indexOf(d) !== i);
    if (dupes.length) {
      tour.errors.push(`«Kunlar» varag'ida kun raqami takrorlangan: ${[...new Set(dupes)].join(", ")}.`);
    }
    if (tour.itinerary.length && tour.durationDays && tour.itinerary.length !== tour.durationDays) {
      tour.warnings.push(
        `Davomiyligi ${tour.durationDays} kun, lekin «Kunlar» varag'ida ${tour.itinerary.length} ta kun bor.`,
      );
    }
    if (!tour.itinerary.length) {
      tour.warnings.push("Kunma-kun dastur kiritilmagan — tur sahifasida dastur bo'limi bo'sh chiqadi.");
    }
    tour.departures.sort((a, b) => a.date.localeCompare(b.date));
  }

  return { tours, issues };
}
