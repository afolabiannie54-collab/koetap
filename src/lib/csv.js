// A cell that starts with = + - @ (or a tab/CR) is run as a formula by Excel and Sheets. Names
// typed by staff end up in these files, so text cells get a leading apostrophe to keep them text.
const FORMULA_START = /^[=+\-@\t\r]/;

export function csvCell(value) {
  if (value === null || value === undefined) return "";
  let text = typeof value === "number" ? String(value) : String(value);
  if (typeof value === "string" && FORMULA_START.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export const csvRow = (cells) => cells.map(csvCell).join(",") + "\r\n";
