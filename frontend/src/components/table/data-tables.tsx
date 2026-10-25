"use client";

/**
 * =============================================================================
 * DataTable.tsx: reusable table with search, sorting, pagination, Excel export
 * =============================================================================
 *
 * PURPOSE
 * -------
 * One table component for every list in the app. The page supplies the
 * columns and the rows; this component handles the rest:
 *   - search box (filters ONE column)
 *   - click-to-sort column headers
 *   - pagination with a "rows per page" selector
 *   - "Download Excel" button
 *   - optional row click
 *
 * USAGE
 * -----
 *   <DataTable
 *     columns={graduatesRowColumnDef}
 *     data={graduates}
 *     dataSheet={graduates}
 *     tableHeader="Graduates"
 *     filterInputName="fullName"
 *     serachFor="graduate name"
 *     excelFilename="graduates.xlsx"
 *     onRowClick={(graduate) => navigate(`/graduates/${graduate.id}`)}
 *   />
 *
 * PROPS
 * -----
 *   columns          REQUIRED  ColumnDef<TData, any>[]
 *                    Column definitions (see columns.tsx).
 *   filterInputName  REQUIRED  string
 *                    Column `id` the search box filters. If no column has this
 *                    id, typing in the search box does nothing.
 *   excelFilename    REQUIRED  string
 *                    File name of the download, include ".xlsx".
 *   data             optional  TData[]   (default: no rows)
 *                    Rows shown in the table. May be undefined while loading.
 *   dataSheet        optional  TData[]   (default: no rows)
 *                    Rows written to the Excel file. May be different from
 *                    `data` (for example all rows, or friendlier column names).
 *                    Objects must be flat: nested objects are not supported.
 *   tableHeader      optional  ReactNode
 *                    Title shown at the top of the card.
 *   serachFor        optional  string
 *                    Text in the search placeholder: "Search for <serachFor>".
 *                    (The spelling "serachFor" is kept so existing pages do not
 *                    break.)
 *   onRowClick       optional  (row: TData) => void
 *                    Called with the original row data when a row is clicked.
 *                    Also fires when a button inside the row is clicked, so
 *                    call event.stopPropagation() in such buttons.
 *
 * RETURNS
 * -------
 *   A <div> containing a Card with: header (title, Download Excel button,
 *   search input), the table (or a "No results." row when empty), and a
 *   footer (page buttons, "Page X of Y", rows-per-page select).
 *   It returns nothing to the parent; use `onRowClick` to react to clicks.
 *
 * BEHAVIOR NOTES
 * --------------
 *   - Sorting only appears on columns that allow it (enableSorting !== false).
 *   - The table keeps its own sorting, filter and pagination state.
 *   - The page goes back to the first page when the data or filter changes.
 *   - "Show All" uses the number of rows in `data`.
 *
 * DEPENDENCIES
 * ------------
 *   @tanstack/react-table, lucide-react, xlsx,
 *   ../ui/{card,input,select,button}, ./headers
 * =============================================================================
 */

import type { ReactNode } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CloudDownload,
  LucideArrowUpDown,
} from "lucide-react";
import * as XLSX from "xlsx";
import { Card, CardContent, CardFooter, CardHeader } from "../ui/card";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Button } from "../ui/button";
import Headers from "./headers";

interface DataTableProps<TData> {
  /**
   * `any` on purpose: the columns of one table have different value types
   * (string, number...), and TypeScript cannot express that as one type.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ColumnDef<TData, any>[];
  /** Rows to show. Can be missing while the data is still loading. */
  data?: TData[];
  /** Rows exported to Excel. Can be missing while the data is still loading. */
  dataSheet?: TData[];
  tableHeader?: ReactNode;
  /** Column id that the search box filters. */
  filterInputName: string;
  /** Text used in the search placeholder (spelling kept for compatibility). */
  serachFor?: string;
  /** Excel file name, including ".xlsx". */
  excelFilename: string;
  onRowClick?: (row: TData) => void;
}

const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 20, 30, 40];

/**
 * Used when no rows were given. It is created once, outside the component,
 * because react-table needs the same array between renders: a new `[]` on every
 * render would make the table reset and re-render in a loop.
 */
const NO_ROWS: never[] = [];

export function DataTable<TData>({
  columns,
  data = NO_ROWS,
  dataSheet = NO_ROWS,
  tableHeader,
  filterInputName,
  serachFor,
  excelFilename,
  onRowClick,
}: DataTableProps<TData>) {
  const table = useReactTable({
    data,
    columns,
    initialState: { pagination: { pageSize: DEFAULT_PAGE_SIZE } },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const { pageIndex, pageSize } = table.getState().pagination;
  const filterColumn = table.getColumn(filterInputName);
  // Not stored in state: it must follow the data when the data arrives later.
  // At least 1, so the "All" value is never "0" for an empty table.
  const allRowsSize = Math.max(data.length, 1);

  const pageSizeOptions = [
    ...PAGE_SIZE_OPTIONS.map((size) => ({ value: size, label: String(size) })),
    { value: allRowsSize, label: "All" },
  ];

  const handleExport = () => {
    const workBook = XLSX.utils.book_new();
    const sheet = XLSX.utils.json_to_sheet(dataSheet);
    XLSX.utils.book_append_sheet(workBook, sheet, "Sheet1");
    XLSX.writeFile(workBook, excelFilename);
  };

  return (
    <div className="w-full">
      <Card className="rounded-md">
        <CardHeader className="flex flex-col gap-4">
          <Headers
            title={tableHeader}
            content={
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <Button className="w-full sm:w-auto" onClick={handleExport}>
                  <CloudDownload className="mr-2" /> Download Excel
                </Button>
                <Input
                  placeholder={`Search for ${serachFor}`}
                  value={(filterColumn?.getFilterValue() as string) ?? ""}
                  onChange={(event) =>
                    filterColumn?.setFilterValue(event.target.value)
                  }
                  className="w-full"
                />
              </div>
            }
          />
        </CardHeader>

        <CardContent className="overflow-x-auto">
          <div className="min-w-full inline-block align-middle">
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                        >
                          <div className="flex items-center gap-2">
                            {header.column.getCanSort() && (
                              <button
                                type="button"
                                aria-label="Sort column"
                                onClick={header.column.getToggleSortingHandler()}
                              >
                                <LucideArrowUpDown className="h-4 w-4 cursor-pointer" />
                              </button>
                            )}
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                            {header.column.getCanSort() && (
                              <span className="ml-1">
                                {header.column.getIsSorted() === "desc"
                                  ? " 🔼"
                                  : header.column.getIsSorted() === "asc"
                                  ? " 🔽"
                                  : ""}
                              </span>
                            )}
                          </div>
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {table.getRowModel().rows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={columns.length}
                        className="px-4 py-6 text-center text-sm text-gray-500"
                      >
                        No results.
                      </td>
                    </tr>
                  ) : (
                    table.getRowModel().rows.map((row) => (
                      <tr
                        key={row.id}
                        onClick={() => onRowClick?.(row.original)}
                        className={`hover:bg-gray-50 ${
                          onRowClick ? "cursor-pointer" : ""
                        }`}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td
                            key={cell.id}
                            className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap"
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>

        <CardFooter className="mt-4">
          <div className="w-full flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  aria-label="First page"
                  onClick={() => table.setPageIndex(0)}
                  disabled={!table.getCanPreviousPage()}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  aria-label="Previous page"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  aria-label="Next page"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  aria-label="Last page"
                  onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                  disabled={!table.getCanNextPage()}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
              <span className="text-sm text-gray-600">
                Page {pageIndex + 1} of {Math.max(table.getPageCount(), 1)}
              </span>
            </div>
            <Select
              value={String(pageSize)}
              onValueChange={(value) => table.setPageSize(Number(value))}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Rows per page" />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((option) => (
                  <SelectItem key={option.label} value={String(option.value)}>
                    Show {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}