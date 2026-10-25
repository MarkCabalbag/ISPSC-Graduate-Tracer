export function displayYears(startYear: number, endYear: number) {
  let years = Array.from(
    { length: endYear - startYear + 1 },
    (_, i: number) => startYear + i
  );
  return years;
}

export function getAcronym(department: string): import("react").ReactNode {
  // Split the department name into words
  const words = department.split(" ");
  // Filter out "of" and "and", then take first letter of remaining words
  const acronym = words
    .filter((word) => !["of", "and"].includes(word.toLowerCase()))
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase();
  return acronym;
}

export const formatData = <T, U>(data: T[], mapFn: (item: T) => U[]): U[] => {
  return data.flatMap(mapFn);
};
