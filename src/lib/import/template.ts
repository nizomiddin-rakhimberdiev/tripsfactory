/**
 * Builds the workbook a travel manager fills in.
 *
 * The design brief was "make it feel like an internal company tool, not a
 * database export". Three things carry that load, and they are worth stating
 * because they explain most of the code below:
 *
 * 1. **Nothing is typed that can be picked.** Countries, cities and tour ids
 *    are dropdowns fed from live CMS data, so a manager cannot invent a country
 *    that does not exist or mistype a relation. This is why the workbook is
 *    generated per download rather than shipped as a static file.
 * 2. **The sheet argues before the importer does.** Data validation rejects bad
 *    input at the keystroke; conditional formatting turns a cell red the moment
 *    it is wrong; the Tekshiruv tab counts every class of mistake with live
 *    formulas. By the time the workbook reaches the import screen it should
 *    have nothing left to report.
 * 3. **Colour means something.** Red header = required, blue = optional,
 *    green = pick from a list, grey = calculated, never type. The legend is on
 *    the first tab and the palette never varies.
 */
import ExcelJS from "exceljs";
import {
  DATA_TABS,
  SHEETS,
  TAB,
  firstDataRow,
  type Column,
  type ColumnKind,
  type SheetSpec,
} from "./schema";

export type ReferenceData = {
  countries: { name: string; slug: string }[];
  cities: { name: string; slug: string; country: string }[];
};

/** Last row the dropdowns, formatting and checks reach down to. */
const LAST_ROW = 400;
const TOURS_FIRST = 5;

/* -------------------------------------------------------------------- theme */

const FONT = "Calibri";

const C = {
  ink: "FF2B2420",
  inkSoft: "FF6F6459",
  white: "FFFFFFFF",
  brand: "FF6E1218",
  brandSoft: "FFF7ECEC",
  parchment: "FFFBF8F2",
  sample: "FFF6F1E8",
  border: "FFE6DED0",
  borderSoft: "FFF0EAE0",

  requiredHead: "FFB3261E",
  requiredTint: "FFFDF0EF",
  optionalHead: "FF1B4F8A",
  optionalTint: "FFEFF4FA",
  dropdownHead: "FF1E6B45",
  dropdownTint: "FFEFF6F1",
  calcHead: "FF6F6459",
  calcTint: "FFF3F1EE",

  noteBg: "FFFFF8E6",
  noteEdge: "FFE9C46A",
  errorBg: "FFF6C9C4",
  errorInk: "FF8C2F2A",
  warnBg: "FFFCE8B2",
  okInk: "FF2F6B45",
  okBg: "FFE7F2EA",
};

const HEAD_FILL: Record<ColumnKind, string> = {
  required: C.requiredHead,
  optional: C.optionalHead,
  dropdown: C.dropdownHead,
  calc: C.calcHead,
};

const BODY_FILL: Record<ColumnKind, string> = {
  required: C.requiredTint,
  optional: C.optionalTint,
  dropdown: C.dropdownTint,
  calc: C.calcTint,
};

const KIND_LABEL: Record<ColumnKind, string> = {
  required: "Majburiy — bo'sh qoldirib bo'lmaydi",
  optional: "Ixtiyoriy — kerak bo'lmasa bo'sh qoldiring",
  dropdown: "Ro'yxatdan tanlanadi — qo'lda yozilmaydi",
  calc: "Avtomatik hisoblanadi — bu ustunga yozmang",
};

const thin = { style: "thin" as const, color: { argb: C.border } };
const hair = { style: "hair" as const, color: { argb: C.borderSoft } };
const boxed = { top: thin, left: thin, bottom: thin, right: thin };
const boxedSoft = { top: hair, left: hair, bottom: hair, right: hair };

const solid = (argb: string) =>
  ({ type: "pattern", pattern: "solid", fgColor: { argb } }) as const;

function colLetter(index: number): string {
  let n = index;
  let out = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    out = String.fromCharCode(65 + rem) + out;
    n = Math.floor((n - 1) / 26);
  }
  return out;
}

/**
 * exceljs ships the data-validation API but leaves it out of its own .d.ts
 * (see node_modules/exceljs/index.d.ts, where the property is commented out).
 * Dropdowns are the single biggest reason a non-technical user fills the sheet
 * correctly, so the feature is used and the missing type declared here.
 */
type Validation = {
  type: "list" | "whole" | "decimal" | "custom" | "textLength";
  operator?: string;
  allowBlank?: boolean;
  formulae: (string | number)[];
  showErrorMessage?: boolean;
  errorStyle?: "warning" | "stop" | "information";
  errorTitle?: string;
  error?: string;
  showInputMessage?: boolean;
  promptTitle?: string;
  prompt?: string;
};
type WithValidations = ExcelJS.Worksheet & {
  dataValidations: { add(range: string, validation: Validation): void };
};

/* ------------------------------------------------------------------ helpers */

function titleBlock(ws: ExcelJS.Worksheet, title: string, subtitle: string, span: number) {
  ws.mergeCells(1, 1, 1, Math.max(span, 2));
  const head = ws.getRow(1);
  head.height = 34;
  const cell = ws.getCell(1, 1);
  cell.value = title;
  cell.font = { name: FONT, bold: true, size: 16, color: { argb: C.white } };
  cell.fill = solid(C.brand);
  cell.alignment = { vertical: "middle", indent: 1 };

  ws.mergeCells(2, 1, 2, Math.max(span, 2));
  const sub = ws.getRow(2);
  sub.height = 20;
  const subCell = ws.getCell(2, 1);
  subCell.value = subtitle;
  subCell.font = { name: FONT, size: 10.5, color: { argb: C.inkSoft } };
  subCell.fill = solid(C.parchment);
  subCell.alignment = { vertical: "middle", indent: 1 };
}

/** The dropdown source range for a column backed by live reference data. */
function listSource(col: Column, ref: ReferenceData): string | null {
  if (col.optionsFrom === "countries") {
    const end = 3 + Math.max(ref.countries.length, 1);
    return `${TAB.lists}!$A$4:$A$${end}`;
  }
  if (col.optionsFrom === "cities") {
    const end = 3 + Math.max(ref.cities.length, 1);
    return `${TAB.lists}!$D$4:$D$${end}`;
  }
  if (col.optionsFrom === "tourIds") {
    return `${TAB.tours}!$A$${TOURS_FIRST}:$A$${LAST_ROW}`;
  }
  return null;
}

/**
 * Input rules, strongest first. Dropdowns and numbers reject outright: there is
 * no legitimate value they exclude. Free-text patterns (ids, dates, links) only
 * warn — a rule with a false negative that locks someone out of their own
 * spreadsheet is worse than one that lets a typo through to the red highlight
 * and the Tekshiruv tab.
 */
function addValidation(
  ws: ExcelJS.Worksheet,
  col: Column,
  letter: string,
  first: number,
  ref: ReferenceData,
) {
  const range = `${letter}${first}:${letter}${LAST_ROW}`;
  const dv = (ws as WithValidations).dataValidations;

  const source = listSource(col, ref);
  if (source) {
    dv.add(range, {
      type: "list",
      allowBlank: true,
      formulae: [source],
      showErrorMessage: true,
      errorStyle: "stop",
      errorTitle: "Ro'yxatdan tanlang",
      error:
        col.optionsFrom === "tourIds"
          ? "Bu Tur ID «Turlar» varag'ida yo'q. Avval turni «Turlar» varag'iga qo'shing."
          : "Faqat ro'yxatdagi qiymatlardan birini tanlang.",
    });
    return;
  }

  if (col.options) {
    dv.add(range, {
      type: "list",
      allowBlank: !col.required,
      formulae: [`"${col.options.join(",")}"`],
      showErrorMessage: true,
      errorStyle: "stop",
      errorTitle: "Ro'yxatdan tanlang",
      error: `Ruxsat etilgan qiymatlar: ${col.options.join(", ")}.`,
    });
    return;
  }

  if (col.check === "integer-positive") {
    dv.add(range, {
      type: "whole",
      operator: "greaterThan",
      allowBlank: !col.required,
      formulae: [0],
      showErrorMessage: true,
      errorStyle: "stop",
      errorTitle: "Faqat butun son",
      error: "1 dan katta butun son yozing. Matn, belgi va kasr son bo'lmaydi.",
    });
    return;
  }

  if (col.check === "money") {
    dv.add(range, {
      type: "decimal",
      operator: "greaterThanOrEqual",
      allowBlank: true,
      formulae: [0],
      showErrorMessage: true,
      errorStyle: "stop",
      errorTitle: "Faqat raqam",
      error: "Narxni faqat raqam bilan yozing: 890. Dollar belgisi va probel qo'ymang.",
    });
    return;
  }

  if (col.check === "date") {
    dv.add(range, {
      type: "custom",
      allowBlank: true,
      formulae: [
        `AND(LEN(${letter}${first})=10,MID(${letter}${first},5,1)="-",MID(${letter}${first},8,1)="-",ISNUMBER(DATEVALUE(${letter}${first})))`,
      ],
      showErrorMessage: true,
      errorStyle: "stop",
      errorTitle: "Sana formati",
      error: "Sanani faqat YIL-OY-KUN ko'rinishida yozing: 2026-04-12.",
    });
    return;
  }

  if (col.check === "url") {
    dv.add(range, {
      type: "custom",
      allowBlank: true,
      formulae: [`OR(LEFT(${letter}${first},8)="https://",LEFT(${letter}${first},7)="http://")`],
      showErrorMessage: true,
      errorStyle: "warning",
      errorTitle: "Havolaga o'xshamaydi",
      error: "Havola https:// bilan boshlanishi kerak. Drive'dan «Copy link» qiling.",
    });
    return;
  }

  if (col.check === "id") {
    dv.add(range, {
      type: "custom",
      allowBlank: true,
      formulae: [
        `AND(EXACT(${letter}${first},LOWER(${letter}${first})),ISERROR(FIND(" ",${letter}${first})),COUNTIF($${letter}$${first}:$${letter}$${LAST_ROW},${letter}${first})=1)`,
      ],
      showErrorMessage: true,
      errorStyle: "warning",
      errorTitle: "Tur ID ni tekshiring",
      error:
        "Tur ID faqat kichik harflardan iborat bo'lsin, ichida probel bo'lmasin va " +
        "boshqa qatorda takrorlanmasin. Namuna: mystic-bukhara-5-days",
    });
  }
}

/** Red when a value is wrong; the manager sees the mistake without leaving the row. */
function addHighlights(ws: ExcelJS.Worksheet, sheet: SheetSpec, first: number) {
  const errorStyle = {
    fill: solid(C.errorBg),
    font: { name: FONT, bold: true, color: { argb: C.errorInk } },
  };
  let priority = 1;
  const rule = (ref: string, formula: string, style = errorStyle) => {
    ws.addConditionalFormatting({
      ref,
      rules: [{ type: "expression", formulae: [formula], style, priority: priority++ }],
    });
  };

  const idLetter = "A";
  const idRange = `${idLetter}${first}:${idLetter}${LAST_ROW}`;

  if (sheet.tab === TAB.tours) {
    // Two ids the same means the second import silently overwrites the first.
    rule(idRange, `AND($A${first}<>"",COUNTIF($A$${first}:$A$${LAST_ROW},$A${first})>1)`);
  } else {
    // A child row pointing at a tour that does not exist imports as nothing.
    rule(
      idRange,
      `AND($A${first}<>"",COUNTIF(${TAB.tours}!$A$${TOURS_FIRST}:$A$${LAST_ROW},$A${first})=0)`,
    );
  }

  sheet.columns.forEach((col, i) => {
    const letter = colLetter(i + 1);
    const range = `${letter}${first}:${letter}${LAST_ROW}`;
    const rowHasId = `$A${first}<>""`;

    if (col.required && i > 0) {
      rule(range, `AND(${rowHasId},${letter}${first}="")`);
    }
    if (col.check === "money" || col.check === "integer-positive") {
      rule(
        range,
        `AND(${letter}${first}<>"",OR(ISNUMBER(${letter}${first})=FALSE,${letter}${first}<0))`,
      );
    }
    if (col.check === "date") {
      rule(
        range,
        `AND(${letter}${first}<>"",OR(LEN(${letter}${first})<>10,ISERROR(DATEVALUE(${letter}${first}))))`,
      );
    }
    if (col.check === "url") {
      rule(range, `AND(${letter}${first}<>"",LEFT(${letter}${first},4)<>"http")`);
    }
    if (col.key === "calc_ready") {
      rule(range, `${letter}${first}="Tayyor"`, {
        fill: solid(C.okBg),
        font: { name: FONT, bold: true, color: { argb: C.okInk } },
      });
      rule(range, `AND(${letter}${first}<>"",${letter}${first}<>"Tayyor")`, {
        fill: solid(C.warnBg),
        font: { name: FONT, bold: true, color: { argb: C.errorInk } },
      });
    }
  });

  // Every tour needs exactly one main photo; zero or two is a silent surprise.
  if (sheet.tab === TAB.images) {
    const mainLetter = colLetter(sheet.columns.findIndex((c) => c.key === "main") + 1);
    rule(
      `${mainLetter}${first}:${mainLetter}${LAST_ROW}`,
      `AND($A${first}<>"",${mainLetter}${first}="Ha",COUNTIFS($A$${first}:$A$${LAST_ROW},$A${first},$${mainLetter}$${first}:$${mainLetter}$${LAST_ROW},"Ha")>1)`,
    );
  }
}

/* --------------------------------------------------------------- data sheet */

function buildDataSheet(wb: ExcelJS.Workbook, sheet: SheetSpec, ref: ReferenceData) {
  const cols = sheet.columns;
  const ws = wb.addWorksheet(sheet.tab, {
    views: [{ state: "frozen", xSplit: 1, ySplit: 2 + sheet.samples.length, zoomScale: 100 }],
    properties: { defaultRowHeight: 17, tabColor: { argb: C.brand } },
  });

  ws.columns = cols.map((c) => ({ key: c.key, width: c.width }));

  // Row 1 — business labels, tinted by field type.
  const header = ws.addRow(cols.map((c) => c.header));
  header.height = 34;
  header.eachCell((cell, i) => {
    const col = cols[i - 1];
    cell.font = { name: FONT, bold: true, size: 11, color: { argb: C.white } };
    cell.fill = solid(HEAD_FILL[col.kind]);
    cell.alignment = { vertical: "middle", horizontal: "left", wrapText: true, indent: 1 };
    cell.border = boxed;
    cell.note = {
      texts: [
        { font: { bold: true, size: 11 }, text: `${col.header}${col.required ? " — majburiy" : ""}\n` },
        { font: { italic: true, size: 9, color: { argb: "FF808080" } }, text: `${KIND_LABEL[col.kind]}\n\n` },
        { font: { size: 10 }, text: col.help },
      ],
    };
  });

  // Row 2 — the one-line hint, in the same tint family as the column below it.
  const hint = ws.addRow(cols.map((c, i) => (i === 0 ? `# ${c.hint}` : c.hint)));
  hint.height = 18;
  hint.eachCell((cell, i) => {
    cell.font = { name: FONT, italic: true, size: 9.5, color: { argb: C.inkSoft } };
    cell.fill = solid(BODY_FILL[cols[i - 1].kind]);
    cell.alignment = { vertical: "middle", indent: 1 };
    cell.border = boxed;
  });

  // Worked examples, `#`-prefixed: they stay in the file as a reference and are
  // skipped on import, so nobody has to choose between keeping the example and
  // getting a clean import.
  for (const sample of sheet.samples) {
    const row = ws.addRow(cols.map((c, i) => (i === 0 ? `#${sample[i] ?? ""}` : (sample[i] ?? ""))));
    row.height = 16;
    row.eachCell((cell) => {
      cell.font = { name: FONT, size: 9.5, italic: true, color: { argb: C.inkSoft } };
      cell.fill = solid(C.sample);
      cell.alignment = { vertical: "top", wrapText: true, indent: 1 };
      cell.border = boxedSoft;
    });
  }

  const first = firstDataRow(sheet);

  cols.forEach((col, i) => {
    const index = i + 1;
    const letter = colLetter(index);
    const column = ws.getColumn(index);
    column.alignment = { vertical: "top", wrapText: true, indent: 1 };

    for (let r = first; r <= LAST_ROW; r += 1) {
      const cell = ws.getCell(r, index);
      cell.font = { name: FONT, size: 10.5, color: { argb: col.kind === "calc" ? C.inkSoft : C.ink } };
      cell.fill = solid(BODY_FILL[col.kind]);
      cell.border = boxedSoft;
      cell.alignment = { vertical: "top", wrapText: true, indent: 1 };

      // Dates and ids must survive as typed: left to itself Sheets turns
      // 2026-04-12 into a locale-formatted date and exports 4/12/2026.
      if (col.check === "date" || col.check === "id" || col.key === "tour") {
        cell.numFmt = "@";
      }
      if (col.check === "money") cell.numFmt = "#,##0";
      if (col.formula) cell.value = { formula: col.formula(r) };
    }

    if (!col.formula) addValidation(ws, col, letter, first, ref);
  });

  addHighlights(ws, sheet, first);

  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: cols.length } };
  return ws;
}

/* -------------------------------------------------------------- guide sheet */

function buildGuide(wb: ExcelJS.Workbook, ref: ReferenceData) {
  const ws = wb.addWorksheet(TAB.guide, {
    views: [{ state: "frozen", ySplit: 2, showGridLines: false }],
    properties: { defaultRowHeight: 17, tabColor: { argb: C.noteEdge } },
  });
  ws.columns = [{ width: 4 }, { width: 34 }, { width: 96 }, { width: 30 }];

  titleBlock(
    ws,
    "TripsFactory — turlar bazasi",
    "Ushbu jadvalni to'ldiring va TripsFactory'ga havolasini yuboring. Turlar saytga o'zi tushadi.",
    4,
  );

  let row = 3;
  const blank = (h = 8) => {
    ws.getRow(row).height = h;
    row += 1;
  };
  const section = (text: string) => {
    ws.mergeCells(row, 2, row, 4);
    const cell = ws.getCell(row, 2);
    cell.value = text;
    cell.font = { name: FONT, bold: true, size: 12, color: { argb: C.brand } };
    cell.alignment = { vertical: "middle" };
    ws.getRow(row).height = 24;
    row += 1;
  };
  const item = (label: string, body: string) => {
    ws.getCell(row, 2).value = label;
    ws.getCell(row, 2).font = { name: FONT, bold: true, size: 10.5, color: { argb: C.ink } };
    ws.getCell(row, 2).alignment = { vertical: "top", wrapText: true };
    ws.mergeCells(row, 3, row, 4);
    ws.getCell(row, 3).value = body;
    ws.getCell(row, 3).font = { name: FONT, size: 10.5, color: { argb: C.ink } };
    ws.getCell(row, 3).alignment = { vertical: "top", wrapText: true };
    ws.getRow(row).height = Math.max(18, Math.ceil(body.length / 105) * 15 + 4);
    row += 1;
  };
  const callout = (text: string) => {
    ws.mergeCells(row, 2, row, 4);
    const cell = ws.getCell(row, 2);
    cell.value = text;
    cell.font = { name: FONT, size: 10.5, color: { argb: C.ink } };
    cell.fill = solid(C.noteBg);
    cell.alignment = { vertical: "middle", wrapText: true, indent: 1 };
    cell.border = { left: { style: "thick", color: { argb: C.noteEdge } } };
    ws.getRow(row).height = Math.max(22, Math.ceil(text.length / 105) * 15 + 8);
    row += 1;
  };

  blank();
  section("Qanday ishlaydi");
  item("1-qadam", "Pastdagi «Turlar» varag'iga turlaringizni yozing — har bir tur bitta qator.");
  item("2-qadam", "«Kunlar», «Narx», «Sanalar», «Rasmlar» varaqlarida o'sha turlarni to'ldiring. Har bir qatorda «Tur ID» ni ro'yxatdan tanlaysiz.");
  item("3-qadam", "«Tekshiruv» varag'iga qarang. Hamma qator «Toza» bo'lsa, jadval tayyor.");
  item("4-qadam", "Jadval havolasini TripsFactory'ga yuboring. Turlar saytga chiqadi.");
  blank();
  callout(
    "Jadvalni saqlash shart emas — Google Sheets har bir o'zgarishni o'zi saqlaydi. " +
      "Havolani bir marta yuborsangiz kifoya: keyin nima o'zgartirsangiz, keyingi importda hisobga olinadi.",
  );

  blank();
  section("Ranglar nimani bildiradi");
  const legend: [ColumnKind, string][] = [
    ["required", "Majburiy"],
    ["dropdown", "Ro'yxatdan tanlanadi"],
    ["optional", "Ixtiyoriy"],
    ["calc", "Avtomatik"],
  ];
  for (const [kind, label] of legend) {
    const swatch = ws.getCell(row, 2);
    swatch.value = `   ${label}`;
    swatch.fill = solid(BODY_FILL[kind]);
    swatch.font = { name: FONT, bold: true, size: 10.5, color: { argb: HEAD_FILL[kind] } };
    swatch.alignment = { vertical: "middle" };
    swatch.border = boxed;
    ws.mergeCells(row, 3, row, 4);
    ws.getCell(row, 3).value = KIND_LABEL[kind];
    ws.getCell(row, 3).font = { name: FONT, size: 10.5, color: { argb: C.inkSoft } };
    ws.getCell(row, 3).alignment = { vertical: "middle", wrapText: true };
    ws.getRow(row).height = 20;
    row += 1;
  }
  blank();
  callout(
    "Katak QIZIL bo'lib qolsa — o'sha katakda xato bor. Sarlavha ustiga sichqonchani olib borsangiz, " +
      "nima yozish kerakligi, namuna va tez-tez uchraydigan xatolar chiqadi.",
  );

  blank();
  section("Rasmlar qanday qo'shiladi");
  item("Eng oson yo'l", "Google Drive'da bitta papka oching (masalan «TripsFactory rasmlar»). Papkani «Share → Anyone with the link → Viewer» qiling. Barcha tur rasmlarini shu papkaga yuklang.");
  item("Havolani olish", "Papkadagi rasm ustida o'ng tugma → «Share» → «Copy link». Havolani «Rasmlar» varag'idagi «Rasm havolasi» ustuniga qo'ying.");
  item("Asosiy rasm", "Har bir turda aynan bitta qatorda «Asosiy rasm = Ha» bo'lishi kerak. O'sha rasm katalogda va tur sahifasi tepasida chiqadi. Qolganlari galereyaga tushadi.");
  item("Rasm o'lchami", "Asosiy rasm gorizontal bo'lsin — 1600x1000 piksel atrofida, 5 MB dan katta bo'lmasin.");
  blank();
  callout(
    "Rasmni jadval ichiga QO'YMANG (Insert → Image). Import faqat havolani o'qiydi. " +
      "Papka ulashilmagan bo'lsa rasm yuklanmaydi — «Anyone with the link» ekanini tekshiring.",
  );

  blank();
  section("Narx qanday ishlaydi");
  item("Valyuta", "Barcha narxlar AQSh dollarida. Boshqa valyuta yo'q — jadvalga faqat raqam yoziladi (890), $ va probelsiz.");
  item("«Narxi, $ (dan)»", "Katalogda «$890 dan» ko'rinishida chiqadigan eng past narx. Bo'sh qoldirsangiz saytda «so'rov bo'yicha» deb yoziladi.");
  item("Jo'nash narxi", "Guruh turida har bir sanaga o'z narxi bo'ladi — «Sanalar» varag'ida yozasiz. Mavsumga qarab narx har xil bo'lishi mumkin.");
  item("Yakka joy", "Yolg'iz sayohat qiluvchi uchun qo'shimcha to'lov. Olinmasa — bo'sh.");

  blank();
  section("Dastur (kunma-kun) qanday ishlaydi");
  item("Bitta kun — bitta qator", "«Kunlar» varag'ida har bir kun alohida qator. 5 kunlik tur uchun 5 ta qator.");
  item("Kun raqami", "1 dan boshlanadi va takrorlanmaydi. Kunlar soni turning davomiyligiga teng bo'lishi kerak — «Tekshiruv» varag'i buni o'zi tekshiradi.");
  item("Matn uzunligi", "Tavsif uzun bo'lsa ham bo'ladi. Katak ichida yangi qator uchun Ctrl+Enter bosing.");

  blank();
  section("Tez-tez uchraydigan xatolar");
  for (const [bad, why] of [
    ["Tur ID ni keyin o'zgartirish", "Bu yangi tur yaratadi, eskisi saytda qolib ketadi. ID bir marta yoziladi va o'zgarmaydi."],
    ["Bir xil Tur ID ni ikki marta ishlatish", "Ikkinchi qator birinchisini bosib ketadi. Katak qizil bo'ladi."],
    ["Sanani 12.04.2026 deb yozish", "Faqat 2026-04-12. Boshqa formatda oy va kun almashib ketishi mumkin."],
    ["Narxga $ yoki «USD» qo'shish", "Faqat raqam: 890."],
    ["Shaharni qo'lda yozish", "Ro'yxatdan tanlang. Qo'lda yozilgan nom bazada topilmaydi."],
    ["Namuna qatorlarini o'chirish", "Shart emas — ular « # » bilan boshlanadi va importga tushmaydi."],
    ["Ustun nomini yoki varaq nomini o'zgartirish", "Import shularga tayanadi. O'zgartirilsa jadval o'qilmaydi."],
  ]) {
    item(bad, why);
  }

  blank();
  section("Ma'lumot");
  item("Davlatlar", `Hozir ${ref.countries.length} ta davlat mavjud: ${ref.countries.map((c) => c.name).join(", ") || "—"}.`);
  item("Shaharlar", `Hozir ${ref.cities.length} ta shahar mavjud. To'liq ro'yxat «${TAB.lists}» varag'ida.`);
  item("Yangi davlat/shahar", "Ro'yxatda yo'q bo'lsa TripsFactory jamoasiga ayting — ular qo'shilgach, shablonni qaytadan yuklab oling.");

  return ws;
}

/* --------------------------------------------------------- reference sheet */

function buildLists(wb: ExcelJS.Workbook, ref: ReferenceData) {
  const ws = wb.addWorksheet(TAB.lists, {
    views: [{ state: "frozen", ySplit: 3, showGridLines: false }],
    properties: { defaultRowHeight: 17, tabColor: { argb: C.calcHead } },
  });
  ws.columns = [
    { width: 26 },
    { width: 22 },
    { width: 3 },
    { width: 26 },
    { width: 22 },
    { width: 22 },
  ];

  titleBlock(
    ws,
    "Ro'yxatlar",
    "Bu varaq dropdown'larni to'ldiradi. Qo'lda tahrirlamang — o'zgartirilsa tanlov ro'yxatlari buziladi.",
    6,
  );

  const head = (col: number, text: string) => {
    const cell = ws.getCell(3, col);
    cell.value = text;
    cell.font = { name: FONT, bold: true, size: 10.5, color: { argb: C.white } };
    cell.fill = solid(C.calcHead);
    cell.alignment = { vertical: "middle", indent: 1 };
    cell.border = boxed;
  };
  head(1, "Davlat");
  head(2, "ID (texnik)");
  head(4, "Shahar");
  head(5, "ID (texnik)");
  head(6, "Davlat");
  ws.getRow(3).height = 20;

  const write = (row: number, col: number, value: string, muted = false) => {
    const cell = ws.getCell(row, col);
    cell.value = value;
    cell.font = {
      name: FONT,
      size: 10.5,
      color: { argb: muted ? C.inkSoft : C.ink },
      italic: muted,
    };
    cell.fill = solid(muted ? C.calcTint : C.dropdownTint);
    cell.border = boxedSoft;
    cell.alignment = { vertical: "middle", indent: 1 };
  };

  // A workbook generated before any content exists still needs a non-empty
  // range, or every dropdown that points here breaks.
  const countries = ref.countries.length ? ref.countries : [{ name: "—", slug: "—" }];
  const cities = ref.cities.length ? ref.cities : [{ name: "—", slug: "—", country: "—" }];

  countries.forEach((c, i) => {
    write(4 + i, 1, c.name);
    write(4 + i, 2, c.slug, true);
  });
  cities.forEach((c, i) => {
    write(4 + i, 4, c.name);
    write(4 + i, 5, c.slug, true);
    write(4 + i, 6, c.country, true);
  });

  return ws;
}

/* -------------------------------------------------------- validation sheet */

type Check = { label: string; formula: string; fix: string };

function buildChecks(wb: ExcelJS.Workbook) {
  const T = TAB.tours;
  const K = TAB.days;
  const N = TAB.price;
  const S = TAB.departures;
  const R = TAB.images;

  const tourRow = firstDataRow(SHEETS[0]);
  const dayRow = firstDataRow(SHEETS[1]);
  const priceRow = firstDataRow(SHEETS[2]);
  const depRow = firstDataRow(SHEETS[3]);
  const imgRow = firstDataRow(SHEETS[4]);

  const t = (col: string) => `${T}!$${col}$${tourRow}:$${col}$${LAST_ROW}`;
  const k = (col: string) => `${K}!$${col}$${dayRow}:$${col}$${LAST_ROW}`;
  const n = (col: string) => `${N}!$${col}$${priceRow}:$${col}$${LAST_ROW}`;
  const s = (col: string) => `${S}!$${col}$${depRow}:$${col}$${LAST_ROW}`;
  const r = (col: string) => `${R}!$${col}$${imgRow}:$${col}$${LAST_ROW}`;

  const filled = `(${t("A")}<>"")`;

  const checks: Check[] = [
    {
      label: "To'ldirilmagan majburiy maydonlar",
      formula: `SUMPRODUCT(${filled}*(((${t("B")}="")+(${t("C")}="")+(${t("D")}="")+(${t("E")}="")+(${t("G")}=""))>0))`,
      fix: "«Turlar» varag'ida qizil kataklarni to'ldiring.",
    },
    {
      label: "Takrorlangan Tur ID",
      formula: `SUMPRODUCT(${filled}*(COUNTIF(${t("A")},${t("A")})>1))`,
      fix: "Har bir tur uchun betakror ID yozing — takrorlangani qizil bo'lib turadi.",
    },
    {
      label: "Noto'g'ri yozilgan Tur ID",
      formula: `SUMPRODUCT(${filled}*(((EXACT(${t("A")},LOWER(${t("A")}))=FALSE)+ISNUMBER(FIND(" ",${t("A")})))>0))`,
      fix: "Faqat kichik harf, raqam va defis. Probel va bosh harf bo'lmasin.",
    },
    {
      label: "Noto'g'ri davomiylik",
      formula: `SUMPRODUCT(${filled}*(((ISNUMBER(${t("G")})=FALSE)+(N(${t("G")})<1)+(N(${t("G")})<>INT(N(${t("G")}))))>0))`,
      fix: "«Davomiyligi (kun)» — 1 dan katta butun son.",
    },
    {
      label: "Noto'g'ri narx (Turlar)",
      formula: `SUMPRODUCT((${t("H")}<>"")*(((ISNUMBER(${t("H")})=FALSE)+(N(${t("H")})<0))>0))`,
      fix: "Narxni faqat raqam bilan yozing: 890.",
    },
    {
      label: "Ro'yxatda yo'q davlat",
      formula: `SUMPRODUCT((${t("B")}<>"")*(COUNTIF(${TAB.lists}!$A$4:$A$300,${t("B")})=0))`,
      fix: "Davlatni ro'yxatdan tanlang. Kerakli davlat yo'q bo'lsa TripsFactory'ga ayting.",
    },
    {
      label: "Rasmi yo'q turlar",
      formula: `SUMPRODUCT(${filled}*(COUNTIF(${r("A")},${t("A")})=0))`,
      fix: "«Rasmlar» varag'ida har bir turga kamida bitta rasm qo'shing.",
    },
    {
      label: "Asosiy rasmi noto'g'ri (0 yoki 2 ta)",
      formula: `SUMPRODUCT(${filled}*(COUNTIF(${r("A")},${t("A")})>0)*(COUNTIFS(${r("A")},${t("A")},${r("B")},"Ha")<>1))`,
      fix: "Har bir turda aynan bitta qatorda «Asosiy rasm = Ha» bo'lsin.",
    },
    {
      label: "Kunlar soni davomiylikka teng emas",
      formula: `SUMPRODUCT(${filled}*(COUNTIF(${k("A")},${t("A")})>0)*(COUNTIF(${k("A")},${t("A")})<>N(${t("G")})))`,
      fix: "«Kunlar» varag'idagi qatorlar soni turning davomiyligiga teng bo'lsin.",
    },
    {
      label: "Takrorlangan kun raqami",
      formula: `SUMPRODUCT((${k("A")}<>"")*(COUNTIFS(${k("A")},${k("A")},${k("B")},${k("B")})>1))`,
      fix: "Bitta tur ichida kun raqami takrorlanmasin.",
    },
    {
      label: "Noto'g'ri sana formati",
      formula: `SUMPRODUCT((${s("B")}<>"")*(((LEN(${s("B")})<>10)+ISERROR(DATEVALUE(${s("B")})))>0))`,
      fix: "Sana faqat YIL-OY-KUN: 2026-04-12.",
    },
    {
      label: "Noto'g'ri jo'nash narxi",
      formula: `SUMPRODUCT((${s("A")}<>"")*(((ISNUMBER(${s("C")})=FALSE)+(N(${s("C")})<0))>0))`,
      fix: "«Sanalar» varag'ida narxni faqat raqam bilan yozing.",
    },
    {
      label: "Havolaga o'xshamagan rasm manzili",
      formula: `SUMPRODUCT((${r("C")}<>"")*(LEFT(${r("C")},4)<>"http"))`,
      fix: "Drive'dan «Copy link» qiling — havola https:// bilan boshlanishi kerak.",
    },
    {
      label: "«Kunlar»: Turlar'da yo'q Tur ID",
      formula: `SUMPRODUCT((${k("A")}<>"")*(COUNTIF(${t("A")},${k("A")})=0))`,
      fix: "Tur ID ni ro'yxatdan tanlang yoki turni «Turlar» varag'iga qo'shing.",
    },
    {
      label: "«Narx»: Turlar'da yo'q Tur ID",
      formula: `SUMPRODUCT((${n("A")}<>"")*(COUNTIF(${t("A")},${n("A")})=0))`,
      fix: "Tur ID ni ro'yxatdan tanlang.",
    },
    {
      label: "«Sanalar»: Turlar'da yo'q Tur ID",
      formula: `SUMPRODUCT((${s("A")}<>"")*(COUNTIF(${t("A")},${s("A")})=0))`,
      fix: "Tur ID ni ro'yxatdan tanlang.",
    },
    {
      label: "«Rasmlar»: Turlar'da yo'q Tur ID",
      formula: `SUMPRODUCT((${r("A")}<>"")*(COUNTIF(${t("A")},${r("A")})=0))`,
      fix: "Tur ID ni ro'yxatdan tanlang.",
    },
  ];

  const ws = wb.addWorksheet(TAB.check, {
    views: [{ state: "frozen", ySplit: 6, showGridLines: false }],
    properties: { defaultRowHeight: 17, tabColor: { argb: C.okInk } },
  });
  ws.columns = [{ width: 4 }, { width: 44 }, { width: 12 }, { width: 26 }, { width: 62 }];

  titleBlock(
    ws,
    "Tekshiruv",
    "Bu varaq o'zi hisoblaydi. Import qilishdan oldin hamma qator yashil bo'lsin.",
    5,
  );

  // Headline verdict, so nobody has to read seventeen rows to know if they are done.
  ws.mergeCells(4, 2, 4, 5);
  const verdict = ws.getCell(4, 2);
  const total = checks.map((_, i) => `C${7 + i}`).join("+");
  verdict.value = {
    formula: `IF(${total}=0,"Jadval tayyor — havolani TripsFactory'ga yuborishingiz mumkin.","Jami "&(${total})&" ta muammo bor. Pastdagi qizil qatorlarga qarang.")`,
  };
  verdict.font = { name: FONT, bold: true, size: 12, color: { argb: C.ink } };
  verdict.alignment = { vertical: "middle", indent: 1 };
  verdict.border = boxed;
  ws.getRow(4).height = 30;
  ws.addConditionalFormatting({
    ref: "B4:E4",
    rules: [
      { type: "expression", formulae: [`${total}=0`], style: { fill: solid(C.okBg), font: { name: FONT, bold: true, size: 12, color: { argb: C.okInk } } }, priority: 1 },
      { type: "expression", formulae: [`${total}>0`], style: { fill: solid(C.errorBg), font: { name: FONT, bold: true, size: 12, color: { argb: C.errorInk } } }, priority: 2 },
    ],
  });

  ws.getRow(5).height = 8;

  const head = ws.getRow(6);
  head.height = 22;
  [
    [2, "Tekshiruv"],
    [3, "Soni"],
    [4, "Holat"],
    [5, "Nima qilish kerak"],
  ].forEach(([col, text]) => {
    const cell = ws.getCell(6, col as number);
    cell.value = text as string;
    cell.font = { name: FONT, bold: true, size: 10.5, color: { argb: C.white } };
    cell.fill = solid(C.brand);
    cell.alignment = { vertical: "middle", indent: 1 };
    cell.border = boxed;
  });

  checks.forEach((check, i) => {
    const row = 7 + i;
    ws.getRow(row).height = 20;

    const label = ws.getCell(row, 2);
    label.value = check.label;
    label.font = { name: FONT, size: 10.5, color: { argb: C.ink } };
    label.alignment = { vertical: "middle", wrapText: true, indent: 1 };

    const count = ws.getCell(row, 3);
    count.value = { formula: check.formula };
    count.font = { name: FONT, bold: true, size: 10.5 };
    count.alignment = { vertical: "middle", horizontal: "center" };

    const state = ws.getCell(row, 4);
    state.value = { formula: `IF(C${row}=0,"Toza","Tuzatish kerak")` };
    state.font = { name: FONT, bold: true, size: 10.5 };
    state.alignment = { vertical: "middle", horizontal: "center" };

    const fix = ws.getCell(row, 5);
    fix.value = check.fix;
    fix.font = { name: FONT, size: 10, color: { argb: C.inkSoft } };
    fix.alignment = { vertical: "middle", wrapText: true, indent: 1 };

    for (const col of [2, 3, 4, 5]) ws.getCell(row, col).border = boxedSoft;
  });

  const last = 6 + checks.length;
  ws.addConditionalFormatting({
    ref: `B7:E${last}`,
    rules: [
      {
        type: "expression",
        formulae: ["$C7>0"],
        style: { fill: solid(C.errorBg), font: { name: FONT, bold: true, color: { argb: C.errorInk } } },
        priority: 1,
      },
      {
        type: "expression",
        formulae: ["$C7=0"],
        style: { fill: solid(C.okBg), font: { name: FONT, color: { argb: C.okInk } } },
        priority: 2,
      },
    ],
  });

  return ws;
}

/* ------------------------------------------------------------------- build */

export async function buildWorkbook(ref: ReferenceData): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "TripsFactory";
  wb.company = "TripsFactory";
  wb.title = "TripsFactory — turlar bazasi";

  buildGuide(wb, ref);
  for (const sheet of SHEETS) buildDataSheet(wb, sheet, ref);
  buildChecks(wb);
  buildLists(wb, ref);

  // Open on the instructions, not on a wall of columns.
  wb.views = [
    { activeTab: 0, firstSheet: 0, visibility: "visible", x: 0, y: 0, width: 28800, height: 18000 },
  ];

  const out = await wb.xlsx.writeBuffer();
  return Buffer.from(out);
}

/** Empty-but-valid reference data, for generating a template without a database. */
export const PLACEHOLDER_REFERENCE: ReferenceData = {
  countries: [{ name: "Uzbekistan", slug: "uzbekistan" }],
  cities: [
    { name: "Tashkent", slug: "tashkent", country: "Uzbekistan" },
    { name: "Samarkand", slug: "samarkand", country: "Uzbekistan" },
    { name: "Bukhara", slug: "bukhara", country: "Uzbekistan" },
    { name: "Khiva", slug: "khiva", country: "Uzbekistan" },
  ],
};

export { DATA_TABS };
