/**
 * The one-page workbook a travel manager fills in, and the parser that reads it.
 *
 * One sheet, one row per tour, nineteen columns left to right. Everything that
 * used to live on its own tab — days, inclusions, departures, photos — is a
 * multi-line cell here, because a manager collecting content writes a list far
 * more readily than they maintain four cross-referenced tables.
 *
 * The same definition builds the template (scripts/make-import-template.ts) and
 * reads it back, so the sheet the client receives and the parser can never
 * describe different things.
 *
 * Content is collected in English; the site's other seven locales fall back to
 * EN field by field, so an EN-only import is complete on day one.
 */
import type { DepartureStatus, TourTier, TourType } from "@/lib/content/types";

/** The only tab the importer reads. */
export const SHEET_TAB = "Turlar";

export type ColumnKind = "required" | "optional" | "list";

export type Column = {
  key: string;
  /** Row 4 of the template — what the manager reads. */
  header: string;
  /** Other spellings accepted when matching the header row. */
  aliases?: string[];
  /** Row 5 — one short line under the header. */
  hint: string;
  /** Hover note: what it is, an example, the mistake people actually make. */
  help: string;
  kind: ColumnKind;
  width: number;
  options?: string[];
};

export const TOUR_FORMATS = ["Guruh turi", "Individual", "So'rov bo'yicha"];
export const SERVICE_LEVELS = ["Standart", "Premium"];
export const YES_NO = ["Ha", "Yo'q"];
export const PUBLISH_STATES = ["Chop etilgan", "Qoralama"];

export const COLUMNS: Column[] = [
  {
    key: "index",
    header: "№",
    hint: "",
    help: "Tartib raqami. Importga ta'sir qilmaydi.",
    kind: "optional",
    width: 10,
  },
  {
    key: "title",
    header: "Tur nomi (inglizcha)",
    aliases: ["Tur nomi", "title"],
    hint: "Majburiy",
    help:
      "Saytda chiqadigan sarlavha, inglizcha.\n\n" +
      "NAMUNA: Classic Uzbekistan Group Tour\n" +
      "MUHIM: sayt manzili shu nomdan yasaladi. Tur saytga chiqqandan keyin nomni " +
      "o'zgartirsangiz, import uni YANGI tur deb qo'shadi — eskisi joyida qoladi.",
    kind: "required",
    width: 32,
  },
  {
    key: "country",
    header: "Davlat",
    aliases: ["country"],
    hint: "Ro'yxatdan tanlang",
    help:
      "Tur qaysi davlatda o'tadi. Davlat saytda oldindan mavjud bo'lishi kerak — " +
      "ro'yxatda yo'q bo'lsa bizga ayting, qo'shamiz.",
    kind: "list",
    width: 16,
    options: ["Uzbekistan", "China", "Kazakhstan", "Kyrgyzstan", "Philippines", "United Arab Emirates"],
  },
  {
    key: "type",
    header: "Tur formati",
    aliases: ["Turi", "type"],
    hint: "Ro'yxatdan tanlang",
    help:
      "Guruh turi — e'lon qilingan sanalarda, boshqa mijozlar bilan.\n" +
      "Individual — faqat shu mijoz uchun, istalgan sanada.\n" +
      "So'rov bo'yicha — dastur mijoz bilan birga tuziladi.",
    kind: "list",
    width: 16,
    options: TOUR_FORMATS,
  },
  {
    key: "tier",
    header: "Xizmat darajasi",
    aliases: ["Daraja", "tier"],
    hint: "Ro'yxatdan tanlang",
    help: "Premium turlar saytdagi alohida Premium bo'limida chiqadi. Qolgani — Standart.",
    kind: "list",
    width: 16,
    options: SERVICE_LEVELS,
  },
  {
    key: "duration",
    header: "Davomiyligi (kun)",
    aliases: ["duration_days", "Davomiyligi"],
    hint: "Faqat raqam",
    help:
      "Necha kunlik tur.\n\nNAMUNA: 8\n" +
      "QOIDA: «8 kun» deb yozmang — faqat raqam.\n" +
      "TEKSHIRUV: kunma-kun dasturdagi kunlar soni shunga teng bo'lishi kerak.",
    kind: "required",
    width: 14,
  },
  {
    key: "price",
    header: "Narxi, $ (dan)",
    aliases: ["price_from_usd", "Narxi"],
    hint: "Faqat raqam",
    help:
      "Bir kishi uchun eng past narx, dollarda.\n\nNAMUNA: 1240\n" +
      "QOIDA: $ belgisi, probel va «USD» yozmang.\n" +
      "Narx «so'rov bo'yicha» bo'lsa bo'sh qoldiring.",
    kind: "required",
    width: 14,
  },
  {
    key: "single",
    header: "Yakka joy qo'shimchasi, $",
    aliases: ["single_supplement_usd", "Yakka joy"],
    hint: "Faqat raqam",
    help: "Yolg'iz sayohat qiluvchi uchun qo'shimcha to'lov.\n\nNAMUNA: 250\nOlinmasa bo'sh qoldiring.",
    kind: "optional",
    width: 16,
  },
  {
    key: "cities",
    header: "Shaharlar (marshrut tartibida)",
    aliases: ["Shaharlar", "cities"],
    hint: "Vergul bilan",
    help:
      "Tur o'tadigan shaharlar, marshrut tartibida.\n\n" +
      "NAMUNA: Tashkent, Khiva, Bukhara, Samarkand\n" +
      "Saytda oldindan mavjud shaharlargina xaritaga tushadi; qolganlari " +
      "e'tiborsiz qoldiriladi (tur baribir qo'shiladi).",
    kind: "optional",
    width: 30,
  },
  {
    key: "summary",
    header: "Qisqa tavsif (inglizcha)",
    aliases: ["Qisqa tavsif", "summary"],
    hint: "2-3 gap",
    help:
      "Katalog kartasida va tur sahifasi tepasida chiqadigan matn.\n\n" +
      "XATO: bu yerga butun dasturni yozish — dastur uchun alohida ustun bor.",
    kind: "required",
    width: 50,
  },
  {
    key: "itinerary",
    header: "Kunma-kun dastur (inglizcha)",
    aliases: ["Kunma-kun dastur", "itinerary"],
    hint: "Har kun yangi qatordan",
    help:
      "Har bir kun «1-kun.» bilan boshlanadi. Kun sarlavhasi — birinchi qatorda, " +
      "tavsif — keyingi qatorda.\n\n" +
      "FORMAT:\n" +
      "1-kun. Arrival in Tashkent\n" +
      "Meet at the airport and transfer to the hotel.\n" +
      "\n" +
      "2-kun. Tashkent city tour\n" +
      "Khast-Imam, Chorsu Bazaar and the metro.\n\n" +
      "Katak ichida yangi qator: Ctrl+Enter (Mac'da Cmd+Enter).\n" +
      "Sarlavha bilan tavsifni bitta qatorga yozsangiz, sayt sarlavhasi «Day 1», " +
      "«Day 2» bo'ladi — matn to'liq saqlanadi, faqat sarlavha chiroyliroq bo'lmaydi.",
    kind: "required",
    width: 72,
  },
  {
    key: "included",
    header: "Narxga kiradi (inglizcha)",
    aliases: ["Narxga kiradi", "included"],
    hint: "Har band yangi qatordan",
    help:
      "Tur narxiga kiradigan bandlar — har biri alohida qatorda.\n\n" +
      "NAMUNA:\n7 nights in double room with breakfast\nEnglish-speaking local guides",
    kind: "required",
    width: 42,
  },
  {
    key: "excluded",
    header: "Narxga kirmaydi (inglizcha)",
    aliases: ["Narxga kirmaydi", "excluded"],
    hint: "Har band yangi qatordan",
    help:
      "Alohida to'lanadigan bandlar.\n\n" +
      "MASLAHAT: mijoz eng ko'p shu ro'yxatni o'qiydi — aviabilet, viza, sug'urta, " +
      "tushliklarni albatta yozing.",
    kind: "required",
    width: 42,
  },
  {
    key: "departures",
    header: "Jo'nash sanalari va narxlar",
    aliases: ["Jo'nash sanalari", "departures"],
    hint: "Guruh turlari uchun",
    help:
      "Har bir sana alohida qatorda.\n\n" +
      "FORMAT: 2026-08-07 — $1390 — Kafolatlangan\n" +
      "Sana faqat YIL-OY-KUN. Holat: Joy bor / Kafolatlangan / Sotilgan.\n\n" +
      "Mavsum oralig'i (01/03/2026 – 30/11/2026) qabul qilinmaydi — saytda har bir " +
      "jo'nash aniq sana bo'lishi kerak. Har kuni jo'naydigan turlarda bu ustunni " +
      "bo'sh qoldiring va mavsumni «Qisqa tavsif» ga yozing.",
    kind: "optional",
    width: 34,
  },
  {
    key: "hero",
    header: "Asosiy rasm (havola)",
    aliases: ["Asosiy rasm", "hero_image"],
    hint: "Ixtiyoriy",
    help:
      "Katalogda va tur sahifasi tepasida chiqadigan rasm.\n\n" +
      "Drive'da papkani «Anyone with the link» qiling → rasm ustida o'ng tugma → " +
      "«Copy link» → shu katakka qo'ying. To'g'ridan-to'g'ri https://... .jpg ham bo'ladi.\n\n" +
      "BO'SH QOLDIRSANGIZ HAM BO'LADI: tur vaqtinchalik rasm bilan qo'shiladi, " +
      "keyin Studio'dan almashtirasiz.",
    kind: "optional",
    width: 40,
  },
  {
    key: "gallery",
    header: "Qo'shimcha rasmlar (havolalar)",
    aliases: ["Qo'shimcha rasmlar", "gallery"],
    hint: "Har havola yangi qatordan",
    help: "Tur sahifasidagi galereya (karusel) uchun. Har bir havola alohida qatorda. Ixtiyoriy.",
    kind: "optional",
    width: 40,
  },
  {
    key: "featured",
    header: "Bosh sahifada ko'rsatilsinmi?",
    aliases: ["Bosh sahifada", "featured"],
    hint: "Ha / Yo'q",
    help:
      "«Ha» bo'lsa tur bosh sahifadagi tanlangan turlar orasida chiqadi.\n\n" +
      "MASLAHAT: 3-6 tadan ko'p belgilamang.",
    kind: "list",
    width: 16,
    options: YES_NO,
  },
  {
    key: "status",
    header: "Holati",
    aliases: ["status", "published"],
    hint: "Chop etilgan / Qoralama",
    help:
      "IMPORT PAYTIDA BU USTUN HISOBGA OLINMAYDI: har bir tur har doim QORALAMA " +
      "bo'lib qo'shiladi. Rasm va matnlarni tekshirib bo'lgach, Studio'dan bittalab " +
      "chop etasiz.",
    kind: "list",
    width: 16,
    options: PUBLISH_STATES,
  },
  {
    key: "note",
    header: "Izoh (ichki, ixtiyoriy)",
    aliases: ["Izoh"],
    hint: "Faqat biz uchun",
    help:
      "Saytga o'tmaydi va import qilinmaydi. Ta'minotchi kodi, netto narx, " +
      "«rasm keyinroq» kabi ichki eslatmalar uchun.",
    kind: "optional",
    width: 28,
  },
];

/** Header row, hint row, two worked samples — so the client's data starts here. */
export const FIRST_DATA_ROW = 8;
export const HEADER_ROW = 4;

/* ------------------------------------------------------------------ values */

function norm(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[’‘`´]/g, "'")
    .replace(/[^a-z0-9']+/g, "_")
    .replace(/^_+|_+$/g, "");
}

const TYPES: Record<string, TourType> = {
  guruh_turi: "group", guruh: "group", group: "group",
  individual: "private", private: "private",
  so_rov_bo_yicha: "custom", buyurtma: "custom", custom: "custom",
};

const TIERS: Record<string, TourTier> = {
  standart: "standard", standard: "standard", oddiy: "standard",
  premium: "premium", lyuks: "premium", luxury: "premium",
};

const SEATS: Record<string, DepartureStatus> = {
  joy_bor: "available", mavjud: "available", available: "available",
  kafolatlangan: "guaranteed", guaranteed: "guaranteed",
  sotilgan: "soldout", soldout: "soldout", sold_out: "soldout",
};

const YES = new Set(["ha", "xa", "yes", "true", "1", "x", "+"]);

/** `Xi'an: The Antique Capital (2 Days)` → `xian-the-antique-capital-2-days` */
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[’‘'`´]/g, "")
    .replace(/&/g, " and ")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

/** Tolerates `$1,200`, `1 200`, `1200.50` — what people actually type. */
export function parseNumber(raw: string): number | null {
  const cleaned = raw.replace(/[$\s ,]/g, "");
  if (!cleaned || cleaned === "-") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

const lines = (raw: string): string[] =>
  raw.split("\n").map((l) => l.trim()).filter(Boolean);

/* ----------------------------------------------------------------- parsing */

export type TourDraft = {
  row: number;
  slug: string;
  title: string;
  country: string;
  type: TourType;
  tier: TourTier;
  durationDays: number;
  priceFromUsd: number | null;
  singleSupplementUsd: number | null;
  cities: string[];
  summary: string;
  itinerary: { title: string; description: string }[];
  included: string[];
  excluded: string[];
  departures: { date: string; priceUsd: number; status: DepartureStatus }[];
  heroImage: string;
  gallery: string[];
  featured: boolean;
  errors: string[];
  warnings: string[];
};

export type SheetIssue = { row: number | null; message: string; level: "error" | "warning" };
export type ParseResult = { tours: TourDraft[]; issues: SheetIssue[] };

/**
 * Splits the day-by-day cell.
 *
 * A day starts at `1-kun.`; everything up to the next marker belongs to it.
 * Within a day the **first line is the title and the rest is the description** —
 * exactly the shape the template's worked example shows:
 *
 *     1-kun. Arrival in Beijing — Gubei
 *     Airport pickup in Beijing and transfer to Gubei. Check in to a…
 *
 * An earlier version instead looked for a dash separator, which was wrong twice
 * over: it could not read the format its own template demonstrated, and where a
 * title legitimately contained a dash — `Arrival in Beijing — Gubei` is a route,
 * not a delimiter — it tore the title in half and pushed "Gubei" to the front of
 * the description.
 *
 * When a day is a single run-on line there is no way to tell where the title
 * ends, so the heading falls back to `Day N` and the whole text becomes the
 * description. Nothing is lost and nothing is invented.
 */
function parseItinerary(raw: string): { days: { title: string; description: string }[]; unsplit: number } {
  // `[ \t]` rather than `\s`: the latter eats the newline that starts the block.
  const marker = /(?:^|\n)[ \t]*(\d+)[ \t]*-[ \t]*kun[ \t]*[.:)]?[ \t]*/gi;
  const hits = [...raw.matchAll(marker)];
  let unsplit = 0;

  const blocks = hits.length
    ? hits.map((m, i) => ({
        n: Number(m[1]),
        text: raw.slice(m.index! + m[0].length, i + 1 < hits.length ? hits[i + 1].index! : undefined),
      }))
    : lines(raw).map((text, i) => ({ n: i + 1, text }));

  const days = blocks
    .map((b) => ({ n: b.n, rows: lines(b.text) }))
    .filter((b) => b.rows.length)
    .map((b) => {
      // A first line long enough to be a paragraph is a paragraph, not a title.
      if (b.rows.length >= 2 && b.rows[0].length <= 120) {
        return { title: b.rows[0], description: b.rows.slice(1).join(" ") };
      }
      unsplit += 1;
      return { title: `Day ${b.n}`, description: b.rows.join(" ") };
    });

  return { days, unsplit };
}

/**
 * One departure per line: `2026-08-07 — $1390 — Kafolatlangan`.
 *
 * Season ranges (`01/03/2026 – 30/11/2026 — $1490 — daily`) are counted and
 * skipped rather than guessed at: the site stores individual departure dates,
 * and inventing one date for a nine-month season would put a date in front of a
 * customer that nobody promised.
 */
function parseDepartures(raw: string): {
  list: { date: string; priceUsd: number; status: DepartureStatus }[];
  skipped: string[];
} {
  const list: { date: string; priceUsd: number; status: DepartureStatus }[] = [];
  const skipped: string[] = [];

  for (const line of lines(raw)) {
    const m = line.match(/^(\d{4})-(\d{2})-(\d{2})\s*[—–-]+\s*\$?\s*([\d\s.,]+?)\s*(?:[—–-]+\s*(.+))?$/);
    if (!m) {
      skipped.push(line);
      continue;
    }
    const price = parseNumber(m[4]);
    if (price === null) {
      skipped.push(line);
      continue;
    }
    list.push({
      date: `${m[1]}-${m[2]}-${m[3]}`,
      priceUsd: price,
      status: SEATS[norm(m[5] ?? "")] ?? "available",
    });
  }

  list.sort((a, b) => a.date.localeCompare(b.date));
  return { list, skipped };
}

/** Reads the sheet: finds the header row, then one tour per row below it. */
export function parseSheet(rows: string[][]): ParseResult {
  const issues: SheetIssue[] = [];

  const wanted = new Map<string, string>();
  for (const col of COLUMNS) {
    for (const a of [col.header, col.key, ...(col.aliases ?? [])]) {
      // `№` normalises to the empty string. Left in the map it made every blank
      // cell a match, and the empty spacer row above the real header won the
      // search with a perfect nineteen out of nineteen.
      const n = norm(a);
      if (n) wanted.set(n, col.key);
    }
  }

  // The tour name has to be among the matches: it is the one column the parser
  // cannot work without, and requiring it rules out any near-miss row.
  const headerIndex = rows.findIndex((r) => {
    const keys = new Set(r.map((c) => wanted.get(norm(c))).filter(Boolean));
    return keys.has("title") && keys.size >= 5;
  });
  if (headerIndex === -1) {
    issues.push({
      row: null,
      level: "error",
      message:
        `«${SHEET_TAB}» varag'ida sarlavha qatori topilmadi. Shablondagi ustun nomlarini ` +
        "o'zgartirmang va varaq nomi «Turlar» bo'lib qolsin.",
    });
    return { tours: [], issues };
  }

  const at: Record<string, number> = {};
  rows[headerIndex].forEach((cell, i) => {
    const key = wanted.get(norm(cell));
    if (key && !(key in at)) at[key] = i;
  });

  for (const key of ["title", "country", "duration", "summary"]) {
    if (!(key in at)) {
      issues.push({
        row: null,
        level: "error",
        message: `Majburiy ustun topilmadi: «${COLUMNS.find((c) => c.key === key)!.header}».`,
      });
      return { tours: [], issues };
    }
  }

  const tours: TourDraft[] = [];
  const seen = new Map<string, number>();

  for (let i = headerIndex + 1; i < rows.length; i += 1) {
    const cells = rows[i];
    const row = i + 1;
    const get = (key: string) => (key in at ? (cells[at[key]] ?? "").trim() : "");

    const title = get("title");
    // The hint row and every untouched row below the data fall out here.
    if (!title || title.startsWith("#")) continue;
    if (/^(majburiy|ro'yxatdan tanlang|inglizcha)$/i.test(title)) continue;
    // The grey worked examples are real, published tours. Importing them would
    // have quietly overwritten two live tours with a draft copy of themselves.
    // Read column A directly: `№` normalises to an empty string and so is
    // deliberately absent from the header map.
    if (/^\s*(namuna|sample|#)/i.test(cells[0] ?? "")) continue;

    const errors: string[] = [];
    const warnings: string[] = [];

    const slug = slugify(title);
    if (!slug) {
      issues.push({ row, level: "error", message: `«${title}» dan sayt manzili yasab bo'lmadi.` });
      continue;
    }
    if (seen.has(slug)) {
      errors.push(`Bu nom jadvalda takrorlangan (avvalgisi ${seen.get(slug)}-qatorda).`);
    }
    seen.set(slug, row);

    const country = get("country");
    if (!country) errors.push("«Davlat» to'ldirilmagan.");

    const summary = get("summary");
    if (!summary) errors.push("«Qisqa tavsif» to'ldirilmagan.");

    const type = TYPES[norm(get("type"))];
    if (!type && get("type")) {
      warnings.push(`«Tur formati» dagi «${get("type")}» tushunarsiz — «Guruh turi» qabul qilindi.`);
    }

    const tier = TIERS[norm(get("tier"))] ?? "standard";

    const durationDays = parseNumber(get("duration"));
    if (durationDays === null || durationDays < 1 || !Number.isInteger(durationDays)) {
      errors.push(`«Davomiyligi» butun son bo'lishi kerak («${get("duration")}»).`);
    }

    const priceRaw = get("price");
    const priceFromUsd = priceRaw ? parseNumber(priceRaw) : null;
    if (priceRaw && priceFromUsd === null) errors.push(`«Narxi» raqam emas («${priceRaw}»).`);
    if (priceFromUsd !== null && priceFromUsd < 0) errors.push("«Narxi» manfiy bo'lishi mumkin emas.");

    const singleRaw = get("single");
    const singleSupplementUsd = singleRaw ? parseNumber(singleRaw) : null;

    const { days, unsplit } = parseItinerary(get("itinerary"));
    if (!days.length) {
      warnings.push("Kunma-kun dastur bo'sh — tur sahifasida dastur bo'limi chiqmaydi.");
    } else if (durationDays && days.length !== durationDays) {
      warnings.push(`Davomiyligi ${durationDays} kun, dasturda esa ${days.length} ta kun bor.`);
    }
    if (unsplit) {
      warnings.push(
        `${unsplit} ta kunda sarlavha alohida qatorda emas — sayt sarlavhasi «Day N» bo'ladi. ` +
          "Matn to'liq saqlandi, tur to'g'ri qo'shiladi.",
      );
    }

    const { list: departures, skipped } = parseDepartures(get("departures"));
    if (skipped.length) {
      warnings.push(
        `${skipped.length} ta jo'nash qatori o'qilmadi (masalan «${skipped[0].slice(0, 46)}») — ` +
          "saytga aniq sanalar kerak. Mavsumni tavsifga yozing.",
      );
    }

    const hero = get("hero");
    const gallery = lines(get("gallery"));
    if (!hero && !gallery.length) {
      warnings.push("Rasm yo'q — vaqtinchalik rasm qo'yiladi, keyin Studio'dan almashtirasiz.");
    }

    tours.push({
      row,
      slug,
      title,
      country,
      type: type ?? "group",
      tier,
      durationDays: durationDays ?? 0,
      priceFromUsd,
      singleSupplementUsd,
      cities: get("cities").split(/[,;]/).map((c) => c.trim()).filter(Boolean),
      summary,
      itinerary: days,
      included: lines(get("included")),
      excluded: lines(get("excluded")),
      departures,
      heroImage: hero,
      gallery,
      featured: YES.has(norm(get("featured"))),
      errors,
      warnings,
    });
  }

  return { tours, issues };
}
