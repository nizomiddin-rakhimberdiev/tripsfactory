/**
 * Writes the one-page tour template: `npm run template`.
 *
 * Output: public/tripsfactory-turlar-shabloni.xlsx — committed, because Studio
 * links to it directly and the file has to exist in production.
 *
 * Columns come from src/lib/import/schema.ts, the same module the importer
 * parses with, so the sheet the client fills in and the parser that reads it
 * back cannot drift apart. Two worked example rows are pulled from the live
 * site so the client sees real tours at real depth; without a network they are
 * simply left out.
 */
import path from "path";
import { fileURLToPath } from "url";
import ExcelJS from "exceljs";
import { COLUMNS, HEADER_ROW, type Column } from "../src/lib/import/schema";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(dirname, "../public/tripsfactory-turlar-shabloni.xlsx");
const SITE = "https://tripsfactory.vercel.app";
const SAMPLES = ["classic-uzbekistan-group-tour", "beijing-manchuria-winter"];
const LAST_ROW = 300;

const FONT = "Calibri";
const C = {
  ink: "FF2B2420", soft: "FF6F6459", white: "FFFFFFFF", brand: "FF6E1218",
  req: "FFB3261E", reqTint: "FFFDF0EF",
  opt: "FF1B4F8A", optTint: "FFEFF4FA",
  list: "FF1E6B45", listTint: "FFEFF6F1",
  sample: "FFF6F1E8", border: "FFE6DED0", hairline: "FFF0EAE0",
  note: "FFFFF8E6", noteEdge: "FFE9C46A",
};
const HEAD = { required: C.req, optional: C.opt, list: C.list } as const;
const TINT = { required: C.reqTint, optional: C.optTint, list: C.listTint } as const;

const solid = (argb: string) => ({ type: "pattern", pattern: "solid", fgColor: { argb } }) as const;
const thin = { style: "thin" as const, color: { argb: C.border } };
const hair = { style: "hair" as const, color: { argb: C.hairline } };
const boxed = { top: thin, left: thin, bottom: thin, right: thin };
const soft = { top: hair, left: hair, bottom: hair, right: hair };
const letter = (i: number) => String.fromCharCode(64 + i);

/** exceljs ships data validation but leaves it out of its own .d.ts. */
type WithValidation = ExcelJS.Worksheet & {
  dataValidations: { add(range: string, v: Record<string, unknown>): void };
};

type Tour = Record<string, unknown>;
const rel = (v: unknown) => (v && typeof v === "object" ? String((v as { name?: string }).name ?? "") : "");
const FORMAT: Record<string, string> = { group: "Guruh turi", private: "Individual", custom: "So'rov bo'yicha" };
const LEVEL: Record<string, string> = { standard: "Standart", premium: "Premium" };
const SEAT: Record<string, string> = { available: "Joy bor", guaranteed: "Kafolatlangan", soldout: "Sotilgan" };

/** Turns a live tour document back into the row a manager would have typed. */
function sampleRow(t: Tour, n: number): string[] {
  const list = (k: string) => ((t[k] as { text: string }[] | null) ?? []).map((x) => x.text).join("\n");
  const days = ((t.itinerary as { title: string; description: string }[] | null) ?? [])
    .map((d, i) => `${i + 1}-kun. ${d.title} — ${d.description}`)
    .join("\n");
  const departures = ((t.departures as { date: string; priceUsd: number; status: string }[] | null) ?? [])
    .map((d) => `${d.date.slice(0, 10)} — $${d.priceUsd} — ${SEAT[d.status] ?? d.status}`)
    .join("\n");
  const hero = t.heroImage as { url?: string } | null;
  const gallery = (Array.isArray(t.gallery) ? (t.gallery as { url?: string }[]) : [])
    .map((g) => (g?.url ? SITE + g.url : "")).filter(Boolean).join("\n");

  const by: Record<string, string> = {
    index: `NAMUNA ${n}`,
    title: String(t.title ?? ""),
    country: rel(t.country),
    type: FORMAT[String(t.type)] ?? "",
    tier: LEVEL[String(t.tier)] ?? "",
    duration: String(t.durationDays ?? ""),
    price: t.priceFromUsd == null ? "" : String(t.priceFromUsd),
    single: t.singleSupplementUsd == null ? "" : String(t.singleSupplementUsd),
    cities: ((t.cities as unknown[] | null) ?? []).map(rel).filter(Boolean).join(", "),
    summary: String(t.summary ?? ""),
    itinerary: days,
    included: list("included"),
    excluded: list("excluded"),
    departures,
    hero: hero?.url ? SITE + hero.url : "",
    gallery,
    featured: t.featured ? "Ha" : "Yo'q",
    status: "Qoralama",
    note: "",
  };
  return COLUMNS.map((c) => by[c.key] ?? "");
}

function rowHeight(values: string[]): number {
  let lines = 1;
  values.forEach((v, i) => {
    const perLine = Math.max(12, Math.floor(COLUMNS[i].width * 1.05));
    lines = Math.max(lines, v.split("\n").reduce((n, l) => n + Math.max(1, Math.ceil(l.length / perLine)), 0));
  });
  return Math.min(1000, lines * 13.5 + 14);
}

async function liveSamples(): Promise<string[][]> {
  try {
    const res = await fetch(`${SITE}/api/tours?locale=en&depth=1&limit=50`, {
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) throw new Error(String(res.status));
    const docs = (await res.json()).docs as Tour[];
    return SAMPLES.map((slug) => docs.find((d) => d.slug === slug))
      .filter((d): d is Tour => Boolean(d))
      .map((d, i) => sampleRow(d, i + 1));
  } catch {
    console.warn("Jonli turlar olinmadi — namunasiz shablon yozildi.");
    return [];
  }
}

function styleCell(cell: ExcelJS.Cell, col: Column, fill: string, italic = false) {
  cell.font = { name: FONT, size: 10.5, italic, color: { argb: italic ? C.soft : C.ink } };
  cell.fill = solid(fill);
  cell.alignment = { vertical: "top", wrapText: true, indent: 1 };
  cell.border = soft;
}

async function main() {
  const samples = await liveSamples();

  const wb = new ExcelJS.Workbook();
  wb.creator = "TripsFactory";
  const ws = wb.addWorksheet("Turlar", {
    views: [{ state: "frozen", xSplit: 2, ySplit: HEADER_ROW + 1, showGridLines: false }],
    properties: { defaultRowHeight: 18, tabColor: { argb: C.brand } },
  });
  ws.columns = COLUMNS.map((c) => ({ width: c.width }));
  const span = COLUMNS.length;

  ws.mergeCells(1, 1, 1, span);
  const title = ws.getCell(1, 1);
  title.value = "TripsFactory — turlar uchun ma'lumot shabloni";
  title.font = { name: FONT, bold: true, size: 17, color: { argb: C.white } };
  title.fill = solid(C.brand);
  title.alignment = { vertical: "middle", indent: 1 };
  ws.getRow(1).height = 38;

  ws.mergeCells(2, 1, 2, span);
  const intro = ws.getCell(2, 1);
  intro.value =
    "Har bir tur — bitta qator. Ustunlarni chapdan o'ngga to'ldiring. Sarlavha ustiga sichqonchani olib borsangiz, " +
    "nima yozish kerakligi, namuna va tez-tez uchraydigan xato chiqadi. " +
    "Kulrang qatorlar — saytdagi haqiqiy turlar, namuna uchun (o'chirmang, ustiga yozmang).";
  intro.font = { name: FONT, size: 10.5, color: { argb: C.ink } };
  intro.fill = solid(C.note);
  intro.alignment = { vertical: "middle", wrapText: true, indent: 1 };
  intro.border = { left: { style: "thick", color: { argb: C.noteEdge } } };
  ws.getRow(2).height = 34;
  ws.getRow(3).height = 8;

  const header = ws.getRow(HEADER_ROW);
  header.height = 40;
  COLUMNS.forEach((col, i) => {
    const cell = header.getCell(i + 1);
    cell.value = col.header;
    cell.font = { name: FONT, bold: true, size: 11, color: { argb: C.white } };
    cell.fill = solid(HEAD[col.kind]);
    cell.alignment = { vertical: "middle", wrapText: true, indent: 1 };
    cell.border = boxed;
    cell.note = {
      texts: [
        { font: { bold: true, size: 11 }, text: `${col.header}\n` },
        { font: { size: 10 }, text: col.help },
      ],
    };
  });

  const hint = ws.getRow(HEADER_ROW + 1);
  hint.height = 19;
  COLUMNS.forEach((col, i) => {
    const cell = hint.getCell(i + 1);
    cell.value = col.hint;
    cell.font = { name: FONT, italic: true, size: 9.5, color: { argb: C.soft } };
    cell.fill = solid(TINT[col.kind]);
    cell.alignment = { vertical: "middle", indent: 1 };
    cell.border = boxed;
  });

  samples.forEach((values, n) => {
    const row = ws.getRow(HEADER_ROW + 2 + n);
    row.height = rowHeight(values);
    values.forEach((v, i) => {
      const cell = row.getCell(i + 1);
      cell.value = v;
      styleCell(cell, COLUMNS[i], C.sample, true);
    });
  });

  // Deliberately no fixed height on the empty rows: Google Sheets only grows a
  // row it has not been told the height of, and a manager typing an eight-day
  // itinerary needs to see it.
  const first = HEADER_ROW + 2 + samples.length;
  for (let r = first; r <= LAST_ROW; r += 1) {
    COLUMNS.forEach((col, i) => styleCell(ws.getCell(r, i + 1), col, TINT[col.kind]));
    ws.getCell(r, 1).value = r - first + 1;
    ws.getCell(r, 1).alignment = { vertical: "top", horizontal: "center" };
  }

  COLUMNS.forEach((col, i) => {
    if (!col.options) return;
    (ws as WithValidation).dataValidations.add(`${letter(i + 1)}${first}:${letter(i + 1)}${LAST_ROW}`, {
      type: "list",
      allowBlank: true,
      formulae: [`"${col.options.join(",")}"`],
      showErrorMessage: true,
      errorStyle: "stop",
      errorTitle: "Ro'yxatdan tanlang",
      error: `Ruxsat etilgan qiymatlar: ${col.options.join(", ")}.`,
    });
  });

  ws.autoFilter = { from: { row: HEADER_ROW, column: 1 }, to: { row: HEADER_ROW, column: span } };

  await wb.xlsx.writeFile(OUT);
  console.log(`Shablon yozildi: ${path.relative(process.cwd(), OUT)}`);
  console.log(`${span} ustun, ${samples.length} ta namuna, ma'lumot ${first}-qatordan.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
