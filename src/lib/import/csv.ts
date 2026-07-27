/**
 * RFC 4180 CSV reader.
 *
 * Google's gviz endpoint returns real CSV — quoted fields, doubled quotes for a
 * literal `"`, and embedded newlines inside quotes. A `split(",")` would tear a
 * tour summary in half at the first comma, so the state machine below is not
 * optional politeness; it is the difference between importing the text the
 * client typed and importing fragments of it.
 */
export function parseCsv(input: string): string[][] {
  // Sheets prefixes exports with a UTF-8 BOM; left in place it becomes part of
  // the first header cell and `slug` stops matching.
  const text = input.replace(/^﻿/, "");

  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];

    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') {
      quoted = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      // Swallow the \n of a \r\n pair so it does not open an empty row.
      if (ch === "\r" && text[i + 1] === "\n") i += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += ch;
    }
  }

  // A file that does not end in a newline still has a last row pending.
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.map((r) => r.map((c) => c.trim()));
}

/** True when every cell of the row is blank — Sheets pads exports with these. */
export function isBlankRow(row: string[]): boolean {
  return row.every((c) => c === "");
}
