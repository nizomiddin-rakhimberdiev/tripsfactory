/**
 * Audits the generated workbook: `npm run template && npm run template:check`.
 *
 * The template is held together by things a compiler cannot see — cross-sheet
 * formula references, validation ranges that must start below the sample rows,
 * headers the parser has to recognise again. This walks the produced .xlsx and
 * asserts each of them, then feeds the file back through the parser to prove a
 * shipped template imports as zero tours and a filled one imports as two.
 *
 * It cannot evaluate the spreadsheet formulas themselves — no engine here does
 * that. It verifies their shape and their references; the arithmetic is only
 * proven once the workbook is open in Sheets.
 */
import ExcelJS from "exceljs";
import {
  SHEETS,
  TAB,
  firstDataRow,
  parseSheets,
} from "../src/lib/import/schema";

const FILE = "public/tripsfactory-turlar-shablon.xlsx";
let failures = 0;
const ok = (label: string, pass: boolean, detail = "") => {
  if (!pass) failures += 1;
  console.log(`  ${pass ? "OK  " : "FAIL"} ${label}${detail ? ` — ${detail}` : ""}`);
};

function grid(ws: ExcelJS.Worksheet): string[][] {
  const rows: string[][] = [];
  ws.eachRow({ includeEmpty: false }, (row) => {
    const cells: string[] = [];
    for (let i = 1; i <= ws.columnCount; i += 1) {
      const v = row.getCell(i).value;
      if (v && typeof v === "object" && "formula" in v) {
        // gviz exports the computed value; an untouched row computes to "".
        cells.push("");
      } else {
        cells.push(v === null || v === undefined ? "" : String(v).trim());
      }
    }
    rows.push(cells);
  });
  return rows;
}

async function main() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(FILE);
  const names = wb.worksheets.map((w) => w.name);

  console.log("\n=== 1. VARAQLAR ===");
  console.log("  ", names.join(" | "));
  const expected = [TAB.guide, TAB.tours, TAB.days, TAB.price, TAB.departures, TAB.images, TAB.check, TAB.lists];
  ok("barcha varaqlar mavjud va tartibda", JSON.stringify(names) === JSON.stringify(expected));

  console.log("\n=== 2. HAR BIR MA'LUMOT VARAG'I ===");
  for (const sheet of SHEETS) {
    const ws = wb.getWorksheet(sheet.tab)!;
    const rows = grid(ws);
    const headers = rows[0].slice(0, sheet.columns.length);
    const expectedHeaders = sheet.columns.map((c) => c.header);
    ok(`${sheet.tab}: sarlavhalar`, JSON.stringify(headers) === JSON.stringify(expectedHeaders),
      JSON.stringify(headers) === JSON.stringify(expectedHeaders) ? `${headers.length} ustun` : `${JSON.stringify(headers)}`);
    ok(`${sheet.tab}: izoh qatori # bilan`, rows[1][0].startsWith("#"));
    ok(`${sheet.tab}: namunalar # bilan`,
      sheet.samples.every((_, i) => rows[2 + i][0].startsWith("#")), `${sheet.samples.length} ta`);
    const view = ws.views?.[0] as { ySplit?: number; xSplit?: number } | undefined;
    ok(`${sheet.tab}: sarlavha muzlatilgan`, view?.ySplit === 2 + sheet.samples.length && view?.xSplit === 1,
      `ySplit=${view?.ySplit} xSplit=${view?.xSplit}`);
    const notes = sheet.columns.filter((_, i) => ws.getCell(1, i + 1).note).length;
    ok(`${sheet.tab}: har bir sarlavhada izoh`, notes === sheet.columns.length, `${notes}/${sheet.columns.length}`);

    const dv = (ws as unknown as { dataValidations: { model: Record<string, unknown> } }).dataValidations.model;
    const dvCount = Object.keys(dv).length;
    const wantDv = sheet.columns.filter((c) => !c.formula && (c.options || c.optionsFrom || c.check)).length;
    ok(`${sheet.tab}: kiritish cheklovlari`, dvCount >= wantDv, `${dvCount} katak-diapazon, kutilgan >= ${wantDv} ustun`);

    // exceljs writes conditional formatting but does not type it for reading.
    const cf =
      (ws as unknown as { conditionalFormattings?: unknown[] }).conditionalFormattings ?? [];
    ok(`${sheet.tab}: shartli formatlash`, cf.length > 0, `${cf.length} ta qoida to'plami`);
  }

  console.log("\n=== 3. FORMULALARDAGI VARAQ HAVOLALARI ===");
  const refNames = new Set<string>();
  const formulas: string[] = [];
  for (const ws of wb.worksheets) {
    ws.eachRow({ includeEmpty: false }, (row) => {
      row.eachCell({ includeEmpty: false }, (cell) => {
        const v = cell.value;
        if (v && typeof v === "object" && "formula" in v && typeof v.formula === "string") {
          formulas.push(v.formula);
          for (const m of v.formula.matchAll(/([A-Za-z_][A-Za-z0-9_]*)!\$/g)) refNames.add(m[1]);
        }
      });
    });
  }
  console.log("   formulalar soni:", formulas.length, "| havola qilingan varaqlar:", [...refNames].join(", "));
  for (const name of refNames) ok(`«${name}» varag'i mavjud`, names.includes(name));

  console.log("\n=== 4. TEKSHIRUV VARAG'I ===");
  const check = wb.getWorksheet(TAB.check)!;
  const checkFormulas: string[] = [];
  // Row 4 is the merged verdict banner; the per-check rows start at 7.
  for (let r = 7; r <= check.rowCount; r += 1) {
    const v = check.getCell(r, 3).value;
    if (v && typeof v === "object" && "formula" in v) checkFormulas.push(String(v.formula));
  }
  ok("tekshiruvlar soni", checkFormulas.length >= 15, `${checkFormulas.length} ta`);
  const verdict = check.getCell(4, 2).value as { formula?: string };
  ok("umumiy xulosa formulasi bor", Boolean(verdict?.formula));
  ok("har bir tekshiruvda SUMPRODUCT", checkFormulas.every((f) => f.startsWith("SUMPRODUCT")));
  // Ranges must start below the sample rows, or the examples get counted as errors.
  const tourFirst = firstDataRow(SHEETS[0]);
  ok(`Turlar diapazoni ${tourFirst}-qatordan boshlanadi`,
    checkFormulas.some((f) => f.includes(`${TAB.tours}!$A$${tourFirst}`)));
  const badRange = checkFormulas.filter((f) => new RegExp(`${TAB.tours}!\\$[A-Z]\\$[1-4]:`).test(f));
  ok("namuna qatorlari tekshiruvga tushmaydi", badRange.length === 0, `${badRange.length} ta shubhali diapazon`);

  console.log("\n=== 5. RO'YXATLAR VARAG'I ===");
  const lists = wb.getWorksheet(TAB.lists)!;
  ok("davlatlar ro'yxati to'ldirilgan", Boolean(lists.getCell(4, 1).value), String(lists.getCell(4, 1).value));
  ok("shaharlar ro'yxati to'ldirilgan", Boolean(lists.getCell(4, 4).value), String(lists.getCell(4, 4).value));

  console.log("\n=== 6. PARSER ROUND-TRIP ===");
  const read = (tab: string) => grid(wb.getWorksheet(tab)!);
  const shipped = parseSheets({
    tours: read(TAB.tours),
    days: read(TAB.days),
    price: read(TAB.price),
    departures: read(TAB.departures),
    images: read(TAB.images),
  });
  ok("bo'sh shablon → 0 tur", shipped.tours.length === 0, `${shipped.tours.length}`);
  ok("bo'sh shablon → xatosiz", shipped.issues.filter((i) => i.level === "error").length === 0,
    shipped.issues.map((i) => i.message).join(" / ") || "toza");

  const strip = (rows: string[][]) =>
    rows.map((r, i) => (i < 2 ? r : r.map((c, j) => (j === 0 ? c.replace(/^#/, "") : c))));
  const filled = parseSheets({
    tours: strip(read(TAB.tours)),
    days: strip(read(TAB.days)),
    price: strip(read(TAB.price)),
    departures: strip(read(TAB.departures)),
    images: strip(read(TAB.images)),
  });
  ok("namunalar yoqilganda → 2 tur", filled.tours.length === 2, `${filled.tours.length}`);
  for (const t of filled.tours) {
    console.log(
      `     ${t.slug}: ${t.type}/${t.tier} ${t.durationDays}kun narx=${t.priceFromUsd} ` +
        `davlat=${t.country} shahar=[${t.cities.join(", ")}] kun=${t.itinerary.length} ` +
        `kiradi=${t.included.length} kirmaydi=${t.excluded.length} sana=${t.departures.length} ` +
        `published=${t.published} featured=${t.featured}`,
    );
    console.log(`       hero=${t.heroImage.slice(0, 60)}… galereya=${t.gallery.length} izoh="${t.heroCaption}"`);
    if (t.errors.length) console.log("       XATO:", t.errors);
    if (t.warnings.length) console.log("       ogoh:", t.warnings);
  }
  ok("davlat nom bilan keldi", filled.tours[0]?.country === "Uzbekistan", filled.tours[0]?.country);
  ok("shaharlar dropdown ustunlaridan yig'ildi", (filled.tours[1]?.cities.length ?? 0) === 4,
    filled.tours[1]?.cities.join(", "));
  ok("asosiy rasm aniqlandi", Boolean(filled.tours[1]?.heroImage));
  ok("holat ustuni o'qildi", filled.tours[0]?.published === true && filled.tours[1]?.published === false);
  ok("premium daraja o'qildi", filled.tours[1]?.tier === "premium");

  console.log(`\n${failures === 0 ? "HAMMASI O'TDI" : `${failures} TA TEKSHIRUV YIQILDI`}`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
