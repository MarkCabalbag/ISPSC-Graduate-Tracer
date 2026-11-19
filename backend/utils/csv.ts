/**
 * Makes one value safe for a CSV file and for spreadsheet programs.
 *
 * Text that starts with `=`, `+`, `-`, `@`, a tab or a carriage return would be
 * run as a formula by Excel or Google Sheets, so it gets a leading apostrophe.
 * Cells with commas, quotes or line breaks are quoted.
 */
export const toCsvCell = (value: unknown): string => {
  if (value === null || value === undefined) {
    return "";
  }

  let text = String(value);

  if (/^[=+\-@\t\r]/.test(text)) {
    text = `'${text}`;
  }

  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};
