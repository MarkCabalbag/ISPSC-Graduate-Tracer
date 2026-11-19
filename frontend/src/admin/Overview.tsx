import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { client } from "../api/client";
import { useGetSummaryData, useGetTotalGraduates } from "../context/hooks";
import type { ProgramSummary } from "../types/api";
import { Button, Card, EmptyState, ErrorState, Skeleton, cx } from "../components/kit";
import { GroupedBars, Legend, Meter, StackedBar } from "../components/charts";
import { SortHeader, useSort } from "./SortHeader";
import {
  alignmentRate,
  downloadBlob,
  employmentRate,
  formatRate,
  matches,
  programsOf,
  rate,
  sumRows,
  useCohortFilters,
  yearsOf,
} from "./cohorts";

const SERIES = [
  { name: "Employed", color: "var(--brand)" },
  { name: "Related to course", color: "var(--gold)" },
];

type CohortRow = {
  key: string;
  year: string;
  program: string;
  traced: number;
  employed: number | null;
  related: number | null;
  abroad: number;
};

export default function Overview() {
  const { data, isLoading, isError, refetch } = useGetSummaryData();
  const { year, program, set } = useCohortFilters();
  const rows = useMemo(() => data ?? [], [data]);
  const filtered = useMemo(() => rows.filter((r) => matches(r, year, program)), [rows, year, program]);
  const totals = useMemo(() => sumRows(filtered), [filtered]);

  return (
    <div className="grid min-w-0 gap-6 [&>*]:min-w-0">
      <PageHeader
        rows={rows}
        year={year}
        program={program}
        onChange={set}
        disabled={isLoading || isError}
      />

      {isLoading ? (
        <OverviewSkeleton />
      ) : isError ? (
        <Card>
          <ErrorState title="The overview could not be loaded." onRetry={() => refetch()} />
        </Card>
      ) : rows.length === 0 ? (
        <Card>
          <EmptyState title="No survey responses yet">
            Share the survey link with your graduates. Their answers appear here as soon as the first one is
            submitted.
          </EmptyState>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            title="No responses for this filter"
            action={
              <Button size="sm" onClick={() => set({ year: "", program: "" })}>
                Clear filters
              </Button>
            }
          >
            Nobody from {program || "this program"} {year ? `class of ${year}` : ""} has answered yet.
          </EmptyState>
        </Card>
      ) : (
        <>
          <Figures totals={totals} year={year} program={program} />
          <div className="grid gap-6 lg:grid-cols-12">
            <EmploymentChart rows={filtered} byYear={Boolean(program)} />
            <Card className="p-5 sm:px-6 lg:col-span-5">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-base font-semibold">Sector</h2>
                <span className="text-[13px] text-faint">Employed graduates</span>
              </div>
              <StackedBar
                label="Employed graduates by sector"
                totalLabel="Total employed"
                items={[
                  { name: "Government", value: totals.government, color: "var(--brand)" },
                  { name: "Private", value: totals.privateSector, color: "var(--gold)" },
                  { name: "Own business", value: totals.ownBusiness, color: "var(--neutral-series)" },
                ]}
              />
            </Card>
          </div>
          <CohortTable rows={filtered} />
        </>
      )}
    </div>
  );
}

/* --------------------------------- header --------------------------------- */

function PageHeader({
  rows,
  year,
  program,
  onChange,
  disabled,
}: {
  rows: ProgramSummary[];
  year: string;
  program: string;
  onChange: (next: { year?: string; program?: string }) => void;
  disabled: boolean;
}) {
  const [exporting, setExporting] = useState(false);

  const exportCsv = async () => {
    setExporting(true);
    try {
      const blob = await client.admin.exportResponsesCsv({ yearOfGraduation: year, program });
      downloadBlob(blob, `graduate-responses${year ? `-${year}` : ""}${program ? `-${program}` : ""}.csv`);
      toast.success("CSV downloaded");
    } catch {
      toast.error("The export could not be created. Try again.");
    } finally {
      setExporting(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link to this view copied");
    } catch {
      toast.error("Copy the address from the address bar instead.");
    }
  };

  return (
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4 pt-6">
      <div>
        <h1 className="text-[28px] leading-9 font-bold tracking-[-0.02em]">Overview</h1>
        <p className="text-[15px] text-muted-foreground">CHED graduate tracer survey · Sta. Maria campus</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor="filter-year">
          Graduation year
        </label>
        <select
          id="filter-year"
          value={year}
          disabled={disabled}
          onChange={(e) => onChange({ year: e.target.value })}
          className="h-10 rounded-md border border-input bg-white px-3 text-[15px] font-medium hover:border-[#9ca3af]"
        >
          <option value="">All years</option>
          {yearsOf(rows).map((y) => (
            <option key={y} value={y}>
              Class of {y}
            </option>
          ))}
        </select>
        <label className="sr-only" htmlFor="filter-program">
          Program
        </label>
        <select
          id="filter-program"
          value={program}
          disabled={disabled}
          onChange={(e) => onChange({ program: e.target.value })}
          className="h-10 rounded-md border border-input bg-white px-3 text-[15px] font-medium hover:border-[#9ca3af]"
        >
          <option value="">All programs</option>
          {programsOf(rows).map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <Button variant="ghost" onClick={copyLink} disabled={disabled}>
          Copy link
        </Button>
        <Button variant="primary" onClick={exportCsv} loading={exporting} disabled={disabled}>
          <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M8 2.5v8M4.5 7 8 10.5 11.5 7M3 13.5h10" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Export CSV
        </Button>
      </div>
    </div>
  );
}

/* --------------------------------- figures -------------------------------- */

function Figures({ totals, year, program }: { totals: ReturnType<typeof sumRows>; year: string; program: string }) {
  const single = Boolean(year && program);
  const { data: totalRecords } = useGetTotalGraduates(single ? year : "", single ? program : "");
  const cohortSize = single ? (totalRecords ?? []).reduce((sum, t) => sum + (t.totalGraduates ?? 0), 0) : 0;
  const tracedRate = cohortSize > 0 ? rate(totals.traced, cohortSize) : null;

  return (
    <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
      <Card as="div" className="px-5 py-4">
        <dt className="font-medium text-muted-foreground">Graduates traced</dt>
        <dd className="mt-2 text-[32px] leading-10 font-bold tracking-[-0.02em] tabular">
          {totals.traced}
          {cohortSize > 0 && (
            <span className="ml-1.5 text-base font-medium tracking-normal text-faint">of {cohortSize}</span>
          )}
        </dd>
        {tracedRate !== null ? (
          <>
            <Meter value={tracedRate} label="Share of the cohort traced" className="mt-2.5" />
            <p className="mt-1.5 text-[13px] text-faint">{formatRate(tracedRate)} response rate</p>
          </>
        ) : (
          <p className="mt-1 text-[13px] text-faint">
            {single ? (
              <Link className="text-link" to={`/admin/respondents?year=${year}&program=${encodeURIComponent(program)}`}>
                Set the cohort's total graduates
              </Link>
            ) : (
              "Pick one year and program to see the response rate"
            )}
          </p>
        )}
      </Card>
      <Card as="div" className="px-5 py-4">
        <dt className="font-medium text-muted-foreground">Employed</dt>
        <dd className="mt-2 text-[32px] leading-10 font-bold tracking-[-0.02em] tabular">{formatRate(employmentRate(totals))}</dd>
        <p className="mt-1 text-[13px] text-faint tabular">
          {totals.employed} of {totals.traced} traced graduates
        </p>
      </Card>
      <Card as="div" className="px-5 py-4">
        <dt className="font-medium text-muted-foreground">Related to course</dt>
        <dd className="mt-2 text-[32px] leading-10 font-bold tracking-[-0.02em] tabular">{formatRate(alignmentRate(totals))}</dd>
        <p className="mt-1 text-[13px] text-faint">Of employed graduates who answered</p>
      </Card>
      <Card as="div" className="px-5 py-4">
        <dt className="font-medium text-muted-foreground">Working abroad</dt>
        <dd className="mt-2 text-[32px] leading-10 font-bold tracking-[-0.02em] tabular">{totals.abroad}</dd>
        <p className="mt-1 text-[13px] text-faint tabular">
          {formatRate(rate(totals.abroad, totals.employed))} of employed · {totals.furtherStudies} in further studies
        </p>
      </Card>
    </dl>
  );
}

/* ---------------------------------- chart --------------------------------- */

function EmploymentChart({ rows, byYear }: { rows: ProgramSummary[]; byYear: boolean }) {
  const groups = useMemo(() => {
    const map = new Map<string, ProgramSummary[]>();
    for (const row of rows) {
      const key = byYear ? row.yearOfGraduation : (row.program ?? "Unspecified");
      map.set(key, [...(map.get(key) ?? []), row]);
    }
    return [...map.entries()]
      .sort(([a], [b]) => (byYear ? Number(a) - Number(b) : a.localeCompare(b)))
      .slice(-8)
      .map(([label, group]) => {
        const t = sumRows(group);
        return { label, values: [employmentRate(t), alignmentRate(t)] };
      });
  }, [rows, byYear]);

  return (
    <Card className="p-5 sm:px-6 lg:col-span-7">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-base font-semibold">Employment by {byYear ? "graduation year" : "program"}</h2>
        <Legend series={SERIES} />
      </div>
      <GroupedBars label={`Employment by ${byYear ? "graduation year" : "program"}`} groups={groups} series={SERIES} />
    </Card>
  );
}

/* ---------------------------------- table --------------------------------- */

function CohortTable({ rows }: { rows: ProgramSummary[] }) {
  const data: CohortRow[] = useMemo(
    () =>
      rows.map((r) => {
        const t = sumRows([r]);
        return {
          key: `${r.yearOfGraduation}-${r.program}`,
          year: r.yearOfGraduation,
          program: r.program ?? "Unspecified",
          traced: t.traced,
          employed: employmentRate(t),
          related: alignmentRate(t),
          abroad: t.abroad,
        };
      }),
    [rows],
  );
  const { sorted, sort, toggle } = useSort<CohortRow>(data, { key: "year", dir: "descending" });

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-baseline justify-between gap-2 px-5 py-4 sm:px-6">
        <h2 className="text-base font-semibold">Cohorts</h2>
        <span className="text-[13px] text-faint tabular">
          {data.length} {data.length === 1 ? "cohort" : "cohorts"} · select a row to see its respondents
        </span>
      </div>
      <div className="relative overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-[15px]">
          <caption className="sr-only">Cohorts by graduation year and program, sortable</caption>
          <thead>
            <tr className="border-y border-line bg-band text-[13px] font-semibold text-muted-foreground">
              <SortHeader label="Class of" k="year" sort={sort} onSort={toggle} align="left" />
              <SortHeader label="Program" k="program" sort={sort} onSort={toggle} align="left" />
              <SortHeader label="Traced" k="traced" sort={sort} onSort={toggle} />
              <SortHeader label="Employed" k="employed" sort={sort} onSort={toggle} />
              <SortHeader label="Related to course" k="related" sort={sort} onSort={toggle} />
              <SortHeader label="Abroad" k="abroad" sort={sort} onSort={toggle} />
              <th scope="col" className="px-6 py-2.5 text-right">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <tr key={row.key} className="group border-b border-line last:border-b-0 hover:bg-band">
                <td className="px-6 py-3 font-semibold tabular">{row.year}</td>
                <td className="px-6 py-3">{row.program}</td>
                <td className="px-6 py-3 text-right tabular">{row.traced}</td>
                <td className={cx("px-6 py-3 text-right tabular", (row.employed ?? 100) < 60 && "font-semibold text-danger")}>
                  {formatRate(row.employed)}
                </td>
                <td className="px-6 py-3 text-right tabular">{formatRate(row.related)}</td>
                <td className="px-6 py-3 text-right tabular">{row.abroad}</td>
                <td className="px-6 py-3 text-right">
                  <Link
                    to={`/admin/respondents?year=${row.year}&program=${encodeURIComponent(row.program)}`}
                    className="text-link font-semibold whitespace-nowrap"
                  >
                    Respondents<span className="sr-only">, {row.program} class of {row.year}</span>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function OverviewSkeleton() {
  return (
    <div className="grid gap-6" aria-busy="true" aria-label="Loading the overview">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[116px]" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-12">
        <Skeleton className="h-72 lg:col-span-7" />
        <Skeleton className="h-72 lg:col-span-5" />
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}
