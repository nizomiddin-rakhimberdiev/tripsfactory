/**
 * Downloads a Google Sheets workbook and returns the tour tab as rows.
 *
 * This used to go through the gviz CSV endpoint, which cost two days of subtle
 * breakage and is worth recording so nobody reaches for it again:
 *
 *  - gviz guesses how many leading rows are "headers" and folds them into one
 *    label row. It ate the title banner, the real header, the hint row and both
 *    sample rows, and the parser then found no columns at all. `headers=0` fixes
 *    that, but only that.
 *  - gviz also types each column. A text header sitting above numeric data
 *    (`№`, `Davomiyligi (kun)`) comes back empty, so two columns silently
 *    disappeared from the header row even with `headers=0`.
 *
 * The plain `export?format=xlsx` endpoint has neither behaviour: it hands back
 * the workbook as the user sees it. Same access rules — the sheet has to be
 * shared as "anyone with the link", and a closed one answers with a login page,
 * which is detected explicitly and reported in plain Uzbek.
 */
import ExcelJS from "exceljs";

export type FetchFailure = {
  reason: "bad_url" | "published_url" | "private" | "missing_tab" | "network";
  message: string;
};

export type FetchResult = ({ ok: true; rows: string[][] } | ({ ok: false } & FetchFailure));

/** Pulls the spreadsheet id out of any normal Sheets link. */
export function spreadsheetId(
  url: string,
): { ok: true; id: string } | ({ ok: false } & FetchFailure) {
  const trimmed = url.trim();
  if (!trimmed) return { ok: false, reason: "bad_url", message: "Havola kiritilmagan." };

  if (/\/spreadsheets\/d\/e\//.test(trimmed)) {
    return {
      ok: false,
      reason: "published_url",
      message:
        "Bu «Publish to web» havolasi. Jadvalni ochib, brauzer manzil qatoridagi oddiy " +
        "havolani nusxalang (docs.google.com/spreadsheets/d/... ko'rinishida).",
    };
  }

  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]{20,})/);
  if (match) return { ok: true, id: match[1] };
  if (/^[a-zA-Z0-9-_]{20,}$/.test(trimmed)) return { ok: true, id: trimmed };

  return {
    ok: false,
    reason: "bad_url",
    message:
      "Havola Google Sheets havolasiga o'xshamaydi. U docs.google.com/spreadsheets/d/... " +
      "bilan boshlanishi kerak.",
  };
}

const PRIVATE_MESSAGE =
  "Jadval ochiq emas. Google Sheets'da o'ng yuqoridagi «Share» tugmasini bosing → " +
  "«General access» da «Anyone with the link» ni tanlang → roli «Viewer» bo'lsin → " +
  "«Done». So'ng qaytadan urinib ko'ring.";

/** Excel gives numbers, dates and rich text; the parser wants plain strings. */
function toText(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "object") {
    if ("richText" in value && Array.isArray(value.richText)) {
      return value.richText.map((t) => t.text).join("");
    }
    if ("formula" in value || "sharedFormula" in value) {
      return toText((value as { result?: ExcelJS.CellValue }).result ?? "");
    }
    if ("text" in value && typeof value.text === "string") return value.text;
    return "";
  }
  return String(value);
}

export async function fetchSheet(id: string, tab: string): Promise<FetchResult> {
  const url = `https://docs.google.com/spreadsheets/d/${id}/export?format=xlsx`;

  let res: Response;
  try {
    res = await fetch(url, { redirect: "follow", cache: "no-store", signal: AbortSignal.timeout(30_000) });
  } catch {
    return {
      ok: false,
      reason: "network",
      message: "Google Sheets'ga ulanib bo'lmadi. Bir ozdan so'ng qayta urinib ko'ring.",
    };
  }

  if (res.status === 401 || res.status === 403 || res.status === 404) {
    return { ok: false, reason: "private", message: PRIVATE_MESSAGE };
  }
  if (!res.ok) {
    return { ok: false, reason: "network", message: `Google Sheets ${res.status} javob qaytardi.` };
  }
  // A closed workbook is served as the sign-in page with a 200.
  if ((res.headers.get("content-type") ?? "").includes("text/html")) {
    return { ok: false, reason: "private", message: PRIVATE_MESSAGE };
  }

  const wb = new ExcelJS.Workbook();
  try {
    // exceljs types `load` against its own vendored Buffer declaration, which
    // Node's Buffer no longer structurally satisfies.
    await wb.xlsx.load(Buffer.from(await res.arrayBuffer()) as unknown as Parameters<typeof wb.xlsx.load>[0]);
  } catch {
    return {
      ok: false,
      reason: "network",
      message: "Jadvalni o'qib bo'lmadi — fayl kutilgan formatda kelmadi.",
    };
  }

  const ws =
    wb.worksheets.find((s) => s.name.trim().toLowerCase() === tab.toLowerCase()) ??
    // A workbook with one populated sheet under another name is still usable.
    (wb.worksheets.filter((s) => s.rowCount > 1).length === 1
      ? wb.worksheets.find((s) => s.rowCount > 1)
      : undefined);

  if (!ws) {
    return {
      ok: false,
      reason: "missing_tab",
      message:
        `«${tab}» nomli varaq topilmadi. Jadvaldagi varaqlar: ` +
        `${wb.worksheets.map((s) => s.name).join(", ")}. Varaq nomini «${tab}» qiling.`,
    };
  }

  const rows: string[][] = [];
  const width = Math.max(ws.columnCount, 1);
  ws.eachRow({ includeEmpty: true }, (row) => {
    const cells: string[] = [];
    for (let i = 1; i <= width; i += 1) cells.push(toText(row.getCell(i).value).trim());
    rows.push(cells);
  });

  return { ok: true, rows };
}
