/**
 * Reads a Google Sheets workbook tab-by-tab, by tab *name*.
 *
 * The obvious export URL (`/export?format=csv&gid=…`) needs the numeric gid of
 * the tab, which is different in every copy the client makes of the template —
 * useless for us. The gviz endpoint accepts `sheet=<name>`, so as long as the
 * client leaves the tab names alone, any copy of the template imports.
 *
 * Everything here is read-only and unauthenticated: the workbook has to be
 * shared as "anyone with the link — Viewer". When it is not, Google answers a
 * login page with a 200, which is the single most common failure of this whole
 * feature — so it is detected explicitly and reported in plain Uzbek.
 */
import { parseCsv } from "./csv";

export type FetchFailure = {
  reason: "bad_url" | "published_url" | "private" | "missing_tab" | "network";
  message: string;
};

export type FetchResult =
  | { ok: true; rows: string[][] }
  | ({ ok: false } & FetchFailure);

/** Pulls the spreadsheet id out of any normal Sheets link. */
export function spreadsheetId(
  url: string,
): { ok: true; id: string } | ({ ok: false } & FetchFailure) {
  const trimmed = url.trim();
  if (!trimmed) {
    return { ok: false, reason: "bad_url", message: "Havola kiritilmagan." };
  }

  // `/d/e/2PACX-…` is a "publish to web" id. It cannot be queried by tab name,
  // so telling the user to paste the ordinary link is the only way forward.
  if (/\/spreadsheets\/d\/e\//.test(trimmed)) {
    return {
      ok: false,
      reason: "published_url",
      message:
        "Bu «Publish to web» havolasi — u bilan varaqlarni nomi bo'yicha o'qib bo'lmaydi. " +
        "Jadvalni ochib, brauzer manzil qatoridagi oddiy havolani nusxalang " +
        "(docs.google.com/spreadsheets/d/... ko'rinishida).",
    };
  }

  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]{20,})/);
  if (match) return { ok: true, id: match[1] };

  // A bare id pasted without the surrounding URL is still workable.
  if (/^[a-zA-Z0-9-_]{20,}$/.test(trimmed)) return { ok: true, id: trimmed };

  return {
    ok: false,
    reason: "bad_url",
    message:
      "Havola Google Sheets havolasiga o'xshamaydi. " +
      "U docs.google.com/spreadsheets/d/... bilan boshlanishi kerak.",
  };
}

const PRIVATE_MESSAGE =
  "Jadval ochiq emas. Google Sheets'da o'ng yuqoridagi «Share» tugmasini bosing → " +
  "«General access» bo'limida «Anyone with the link» ni tanlang → roli «Viewer» bo'lsin → " +
  "«Done». So'ng qaytadan urinib ko'ring.";

/** Fetches one tab as CSV rows. */
export async function fetchTab(id: string, tab: string): Promise<FetchResult> {
  const url =
    `https://docs.google.com/spreadsheets/d/${id}/gviz/tq` +
    `?tqx=out:csv&sheet=${encodeURIComponent(tab)}`;

  let res: Response;
  try {
    res = await fetch(url, {
      redirect: "follow",
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    return {
      ok: false,
      reason: "network",
      message:
        "Google Sheets'ga ulanib bo'lmadi (tarmoq xatosi yoki javob juda uzoq keldi). " +
        "Bir ozdan so'ng qayta urinib ko'ring.",
    };
  }

  const body = await res.text();

  if (res.status === 400 || /invalid_query|Invalid query/i.test(body)) {
    return {
      ok: false,
      reason: "missing_tab",
      message: `«${tab}» nomli varaq topilmadi. Shablondagi varaq nomlarini o'zgartirmang.`,
    };
  }

  if (res.status === 401 || res.status === 403 || res.status === 404) {
    return { ok: false, reason: "private", message: PRIVATE_MESSAGE };
  }

  // The tell for a closed workbook: Google serves the sign-in page with a 200
  // and an HTML body where CSV was asked for.
  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("text/html") || /^\s*</.test(body)) {
    return { ok: false, reason: "private", message: PRIVATE_MESSAGE };
  }

  if (!res.ok) {
    return {
      ok: false,
      reason: "network",
      message: `Google Sheets ${res.status} javob qaytardi.`,
    };
  }

  return { ok: true, rows: parseCsv(body) };
}
