/**
 * Small input parsers shared by the controllers.
 */

/**
 * Converts a URL parameter to a positive whole number.
 *
 * @param value - The raw URL parameter, for example `"12"`.
 * @returns The number, or `null` if it is missing or not a positive integer.
 */
export const parseIdParam = (value: string | undefined): number | null => {
  if (!value || !/^\d+$/.test(value)) {
    return null;
  }

  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
};
