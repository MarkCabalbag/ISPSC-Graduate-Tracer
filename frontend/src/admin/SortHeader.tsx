import { useMemo, useState } from "react";
import { cx } from "../components/kit";

export type SortState<T> = { key: keyof T; dir: "ascending" | "descending" };

/** Client-side sorting for a table: numbers compare as numbers, text by locale, empties last. */
export function useSort<T>(rows: T[], initial: SortState<T>) {
  const [sort, setSort] = useState<SortState<T>>(initial);
  const sorted = useMemo(() => {
    const factor = sort.dir === "ascending" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const x = a[sort.key];
      const y = b[sort.key];
      if (x === y) return 0;
      if (x === null || x === undefined || x === "") return 1;
      if (y === null || y === undefined || y === "") return -1;
      if (typeof x === "number" && typeof y === "number") return (x - y) * factor;
      const nx = Number(x);
      const ny = Number(y);
      if (!Number.isNaN(nx) && !Number.isNaN(ny)) return (nx - ny) * factor;
      return String(x).localeCompare(String(y), undefined, { sensitivity: "base" }) * factor;
    });
  }, [rows, sort]);
  const toggle = (key: keyof T) =>
    setSort((current) =>
      current.key === key
        ? { key, dir: current.dir === "ascending" ? "descending" : "ascending" }
        : { key, dir: "ascending" },
    );
  return { sorted, sort, toggle };
}

/** A column header that sorts its column; announces its state with aria-sort. */
export function SortHeader<T>({
  label,
  k,
  sort,
  onSort,
  align = "right",
}: {
  label: string;
  k: keyof T;
  sort: SortState<T>;
  onSort: (key: keyof T) => void;
  align?: "left" | "right";
}) {
  const active = sort.key === k;
  return (
    <th
      scope="col"
      aria-sort={active ? sort.dir : "none"}
      className={cx("px-6 py-1.5 whitespace-nowrap", align === "right" ? "text-right" : "text-left")}
    >
      <button
        type="button"
        onClick={() => onSort(k)}
        className={cx(
          "-mx-2 inline-flex h-8 items-center gap-1.5 rounded px-2 font-semibold transition-colors hover:bg-[#eef0f3] hover:text-ink",
          active ? "text-brand" : "text-muted-foreground",
        )}
      >
        {label}
        <svg
          aria-hidden="true"
          viewBox="0 0 10 10"
          className={cx("size-2.5 transition-transform", active && sort.dir === "ascending" && "rotate-180", !active && "opacity-40")}
        >
          <path d="M1.5 3.5 5 7l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </th>
  );
}
