import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { client } from "../api/client";
import { ApiError } from "../api/http";
import { useGetGraduatesPerRow, useGetSummaryData, useGetTotalGraduates } from "../context/hooks";
import type { SurveyResponseRow } from "../types/api";
import { Button, Card, Chip, EmptyState, ErrorState, Skeleton, cx } from "../components/kit";
import { Meter } from "../components/charts";
import { SortHeader, useSort } from "./SortHeader";
import { downloadBlob, formatRate, programsOf, rate, useCohortFilters, yearsOf } from "./cohorts";

const PAGE_SIZES = [10, 25, 50];

const answer = (value: string | null | undefined) => {
  const v = (value ?? "").toLowerCase();
  if (v === "yes") return <Chip tone="ok">Yes</Chip>;
  if (v === "no") return <Chip tone="neutral">No</Chip>;
  return <span className="text-faint">–</span>;
};

const SECTOR: Record<string, string> = {
  government: "Government",
  "private institution": "Private",
  "entrepreneurial / freelance": "Own business",
  "entreprenueral / freelance": "Own business",
};
const LOCATION: Record<string, string> = { locally: "Philippines", abroad: "Abroad" };

export default function Respondents() {
  const summary = useGetSummaryData();
  const rows = summary.data ?? [];
  const { year, program, set } = useCohortFilters();
  const years = yearsOf(rows);
  const programs = programsOf(rows.filter((r) => !year || r.yearOfGraduation === year));

  // Default to the latest cohort with responses, so the page never opens empty.
  useEffect(() => {
    if (!summary.data || (year && program)) return;
    const latest = [...summary.data].sort((a, b) => Number(b.yearOfGraduation) - Number(a.yearOfGraduation))[0];
    if (latest) set({ year: year || latest.yearOfGraduation, program: program || (latest.program ?? "") });
  }, [summary.data, year, program, set]);

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4 pt-6">
        <div>
          <h1 className="text-[28px] leading-9 font-bold tracking-[-0.02em]">Respondents</h1>
          <p className="text-[15px] text-muted-foreground">Every answer from one graduating class and program.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="cohort-year">
            Graduation year
          </label>
          <select
            id="cohort-year"
            value={year}
            onChange={(e) => set({ year: e.target.value, program: "" })}
            className="h-10 rounded-md border border-input bg-white px-3 text-[15px] font-medium hover:border-[#9ca3af]"
          >
            {!year && <option value="">Year</option>}
            {years.map((y) => (
              <option key={y} value={y}>
                Class of {y}
              </option>
            ))}
          </select>
          <label className="sr-only" htmlFor="cohort-program">
            Program
          </label>
          <select
            id="cohort-program"
            value={program}
            onChange={(e) => set({ program: e.target.value })}
            className="h-10 rounded-md border border-input bg-white px-3 text-[15px] font-medium hover:border-[#9ca3af]"
          >
            {!program && <option value="">Program</option>}
            {programs.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>

      {summary.isLoading ? (
        <Skeleton className="h-96" />
      ) : summary.isError ? (
        <Card>
          <ErrorState title="The cohorts could not be loaded." onRetry={() => summary.refetch()} />
        </Card>
      ) : rows.length === 0 ? (
        <Card>
          <EmptyState title="No survey responses yet">
            When graduates answer the survey, their responses are listed here by class and program.
          </EmptyState>
        </Card>
      ) : year && program ? (
        <Cohort year={year} program={program} />
      ) : null}
    </div>
  );
}

/* --------------------------------- one cohort -------------------------------- */

function Cohort({ year, program }: { year: string; program: string }) {
  const { data, isLoading, isError, refetch } = useGetGraduatesPerRow(Number(year), program);
  const people = useMemo(() => data ?? [], [data]);
  const [query, setQuery] = useState("");
  const [employed, setEmployed] = useState("");
  const [related, setRelated] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const [toDelete, setToDelete] = useState<SurveyResponseRow | null>(null);

  useEffect(() => setPage(1), [query, employed, related, pageSize, year, program]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return people.filter(
      (p) =>
        (!q || p.fullName.toLowerCase().includes(q) || p.email.toLowerCase().includes(q)) &&
        (!employed || p.isEmployed?.toLowerCase() === employed) &&
        (!related || p.isJobAligned?.toLowerCase() === related),
    );
  }, [people, query, employed, related]);

  const { sorted, sort, toggle } = useSort<SurveyResponseRow>(filtered, { key: "fullName", dir: "ascending" });
  const pages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const current = Math.min(page, pages);
  const visible = sorted.slice((current - 1) * pageSize, current * pageSize);
  const filtersOn = Boolean(query || employed || related);

  const exportCsv = async () => {
    setExporting(true);
    try {
      const blob = await client.admin.exportResponsesCsv({ yearOfGraduation: year, program });
      downloadBlob(blob, `respondents-${program}-${year}.csv`);
      toast.success("CSV downloaded");
    } catch {
      toast.error("The export could not be created. Try again.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <Coverage year={year} program={program} traced={people.length} loading={isLoading} />

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-end gap-3 px-5 py-4 sm:px-6">
          <div className="grid min-w-[220px] flex-[1_1_260px] gap-1">
            <label htmlFor="search" className="text-[13px] font-semibold text-muted-foreground">
              Search
            </label>
            <input
              id="search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Name or email"
              className="h-10 rounded-md border border-input bg-white px-3 text-[15px] hover:border-[#9ca3af]"
            />
          </div>
          <div className="grid gap-1">
            <label htmlFor="f-employed" className="text-[13px] font-semibold text-muted-foreground">
              Employed
            </label>
            <select
              id="f-employed"
              value={employed}
              onChange={(e) => setEmployed(e.target.value)}
              className="h-10 rounded-md border border-input bg-white px-3 text-[15px]"
            >
              <option value="">Any</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
          <div className="grid gap-1">
            <label htmlFor="f-related" className="text-[13px] font-semibold text-muted-foreground">
              Related to course
            </label>
            <select
              id="f-related"
              value={related}
              onChange={(e) => setRelated(e.target.value)}
              className="h-10 rounded-md border border-input bg-white px-3 text-[15px]"
            >
              <option value="">Any</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
          {filtersOn && (
            <Button variant="ghost" onClick={() => { setQuery(""); setEmployed(""); setRelated(""); }}>
              Clear
            </Button>
          )}
          <p className="ml-auto self-center text-[14px] text-muted-foreground tabular" aria-live="polite">
            {isLoading ? "Loading…" : `${sorted.length} of ${people.length} respondents`}
          </p>
          <Button onClick={exportCsv} loading={exporting} disabled={isLoading || people.length === 0}>
            Export CSV
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-px border-t border-line" aria-busy="true" aria-label="Loading respondents">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-[53px] rounded-none" />
            ))}
          </div>
        ) : isError ? (
          <div className="border-t border-line">
            <ErrorState title="The respondents could not be loaded." onRetry={() => refetch()} />
          </div>
        ) : people.length === 0 ? (
          <div className="border-t border-line">
            <EmptyState title={`No ${program} graduates from ${year} have answered yet`}>
              Share the survey link with this class. Their answers appear here as they come in.
            </EmptyState>
          </div>
        ) : sorted.length === 0 ? (
          <div className="border-t border-line">
            <EmptyState title="No respondent matches these filters" action={<Button size="sm" onClick={() => { setQuery(""); setEmployed(""); setRelated(""); }}>Clear filters</Button>}>
              Try a shorter name, or set Employed and Related to course back to Any.
            </EmptyState>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] border-collapse text-[15px]">
              <caption className="sr-only">
                Respondents from {program}, class of {year}. Sortable; page {current} of {pages}.
              </caption>
              <thead>
                <tr className="border-y border-line bg-band text-[13px] font-semibold text-muted-foreground">
                  <SortHeader label="Name" k="fullName" sort={sort} onSort={toggle} align="left" />
                  <SortHeader label="Major" k="major" sort={sort} onSort={toggle} align="left" />
                  <SortHeader label="Employed" k="isEmployed" sort={sort} onSort={toggle} align="left" />
                  <SortHeader label="Related" k="isJobAligned" sort={sort} onSort={toggle} align="left" />
                  <SortHeader label="Sector" k="typeOfOrganization" sort={sort} onSort={toggle} align="left" />
                  <SortHeader label="Works in" k="currentJobLocated" sort={sort} onSort={toggle} align="left" />
                  <SortHeader label="Further studies" k="isFurtherStudies" sort={sort} onSort={toggle} align="left" />
                  <th scope="col" className="px-6 py-2.5 text-right">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visible.map((p) => (
                  <tr key={p.id} className="border-b border-line last:border-b-0 hover:bg-band">
                    <td className="px-6 py-2.5">
                      <span className="block font-semibold text-ink">{p.fullName}</span>
                      <span className="block text-[13px] text-faint">{p.email}</span>
                    </td>
                    <td className="px-6 py-2.5 text-ink-2">{p.major ?? <span className="text-faint">–</span>}</td>
                    <td className="px-6 py-2.5">{answer(p.isEmployed)}</td>
                    <td className="px-6 py-2.5">{answer(p.isJobAligned)}</td>
                    <td className="px-6 py-2.5 text-ink-2">{SECTOR[p.typeOfOrganization] ?? <span className="text-faint">–</span>}</td>
                    <td className="px-6 py-2.5 text-ink-2">{LOCATION[p.currentJobLocated] ?? <span className="text-faint">–</span>}</td>
                    <td className="px-6 py-2.5">{answer(p.isFurtherStudies)}</td>
                    <td className="px-6 py-2.5 text-right">
                      <Button size="sm" variant="ghost-danger" onClick={() => setToDelete(p)}>
                        Delete<span className="sr-only"> the response of {p.fullName}</span>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && sorted.length > 0 && (
          <Pager page={current} pages={pages} pageSize={pageSize} total={sorted.length} onPage={setPage} onPageSize={setPageSize} />
        )}
      </Card>

      <DeleteDialog person={toDelete} onClose={() => setToDelete(null)} />
    </>
  );
}

/* ---------------------------------- coverage --------------------------------- */

function Coverage({ year, program, traced, loading }: { year: string; program: string; traced: number; loading: boolean }) {
  const { data: records, isLoading } = useGetTotalGraduates(year, program);
  const record = records?.[0];
  const total = record?.totalGraduates ?? 0;
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const queryClient = useQueryClient();

  const save = useMutation({
    mutationFn: (next: number) => client.admin.setTotalGraduates(record!.id!, next),
    onSuccess: () => {
      toast.success(`Total graduates set to ${value}`);
      queryClient.invalidateQueries({ queryKey: ["totalGraduates"] });
      setEditing(false);
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : "The total could not be saved. Try again."),
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const n = Number(value);
    if (!/^\d+$/.test(value.trim()) || n < 0) {
      setError("Enter the number of graduates as a whole number, like 160");
      return;
    }
    if (n < traced) {
      setError(`Enter at least ${traced}, the number who already answered`);
      return;
    }
    setError("");
    save.mutate(n);
  };

  const tracedRate = total > 0 ? rate(traced, total) : null;

  return (
    <Card className="grid gap-4 px-5 py-5 sm:px-6 md:grid-cols-[1fr_auto] md:items-center">
      <div className="grid gap-1">
        <h2 className="text-[20px] font-bold tracking-[-0.01em]">
          {program} · Class of {year}
        </h2>
        {loading || isLoading ? (
          <Skeleton className="mt-1 h-5 w-64" />
        ) : total > 0 ? (
          <>
            <p className="text-muted-foreground tabular">
              <b className="text-ink">{traced}</b> of {total} graduates traced ({formatRate(tracedRate)})
            </p>
            <Meter value={tracedRate ?? 0} label={`${program} class of ${year} traced`} className="mt-1 max-w-md" />
          </>
        ) : (
          <p className="text-muted-foreground">
            <b className="text-ink tabular">{traced}</b> traced. Set the class's total graduates to see the response rate.
          </p>
        )}
      </div>
      {record &&
        (editing ? (
          <form onSubmit={submit} noValidate className="grid gap-1.5">
            <label htmlFor="total-graduates" className="text-[13px] font-semibold text-muted-foreground">
              Total graduates in this class
            </label>
            {error && (
              <p id="total-error" className="text-[14px] font-semibold text-danger">
                {error}
              </p>
            )}
            <div className="flex gap-2">
              <input
                id="total-graduates"
                inputMode="numeric"
                autoFocus
                value={value}
                onChange={(e) => setValue(e.target.value)}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? "total-error" : undefined}
                className={cx("h-10 w-28 rounded-md border bg-white px-3 tabular", error ? "border-danger border-2" : "border-input")}
              />
              <Button type="submit" variant="primary" loading={save.isPending}>
                Save
              </Button>
              <Button type="button" variant="ghost" onClick={() => { setEditing(false); setError(""); }}>
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <Button onClick={() => { setValue(total ? String(total) : ""); setEditing(true); }}>
            {total > 0 ? "Change total graduates" : "Set total graduates"}
          </Button>
        ))}
    </Card>
  );
}

/* ----------------------------------- pager ----------------------------------- */

function Pager({
  page,
  pages,
  pageSize,
  total,
  onPage,
  onPageSize,
}: {
  page: number;
  pages: number;
  pageSize: number;
  total: number;
  onPage: (page: number) => void;
  onPageSize: (size: number) => void;
}) {
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const numbers = Array.from({ length: pages }, (_, i) => i + 1).filter(
    (n) => n === 1 || n === pages || Math.abs(n - page) <= 1,
  );
  return (
    <nav aria-label="Pages" className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-3 text-[14px] text-muted-foreground sm:px-6">
      <div className="flex items-center gap-2">
        <span className="tabular">
          {from}–{to} of {total}
        </span>
        <label htmlFor="page-size" className="sr-only">
          Rows per page
        </label>
        <select id="page-size" value={pageSize} onChange={(e) => onPageSize(Number(e.target.value))} className="h-9 rounded-md border border-input bg-white px-2">
          {PAGE_SIZES.map((n) => (
            <option key={n} value={n}>
              {n} per page
            </option>
          ))}
        </select>
      </div>
      <ul className="flex items-center gap-1">
        <li>
          <Button size="sm" variant="ghost" disabled={page === 1} onClick={() => onPage(page - 1)}>
            Previous
          </Button>
        </li>
        {numbers.map((n, i) => (
          <li key={n} className="flex items-center gap-1">
            {i > 0 && numbers[i - 1] !== n - 1 && <span aria-hidden="true">…</span>}
            <button
              type="button"
              onClick={() => onPage(n)}
              aria-current={n === page ? "page" : undefined}
              aria-label={`Page ${n}`}
              className={cx(
                "h-9 min-w-9 rounded-md px-2 font-semibold tabular",
                n === page ? "bg-brand text-white" : "text-ink-2 hover:bg-[#f3f4f6]",
              )}
            >
              {n}
            </button>
          </li>
        ))}
        <li>
          <Button size="sm" variant="ghost" disabled={page === pages} onClick={() => onPage(page + 1)}>
            Next
          </Button>
        </li>
      </ul>
    </nav>
  );
}

/* ---------------------------------- delete ----------------------------------- */

function DeleteDialog({ person, onClose }: { person: SurveyResponseRow | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const queryClient = useQueryClient();
  const remove = useMutation({
    mutationFn: (id: number) => client.admin.deleteResponse(id),
    onSuccess: () => {
      toast.success("Response deleted");
      queryClient.invalidateQueries({ queryKey: ["graduatesPerRow"] });
      queryClient.invalidateQueries({ queryKey: ["summaryData"] });
      onClose();
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "The response could not be deleted. Try again."),
  });

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (person && !dialog.open) dialog.showModal();
    if (!person && dialog.open) dialog.close();
  }, [person]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby="delete-title"
      className="m-auto w-[min(100%-32px,460px)] rounded-xl border border-line p-6 text-ink shadow-[0_24px_64px_-16px_rgb(17_24_39/0.35)] backdrop:bg-[rgb(17_24_39/0.45)]"
    >
      {person && (
        <form method="dialog" className="grid gap-4" onSubmit={(e) => { e.preventDefault(); remove.mutate(person.id); }}>
          <h2 id="delete-title" className="text-[20px] font-bold">
            Delete {person.fullName}'s response?
          </h2>
          <p className="text-muted-foreground">
            This removes their answers from every report and export. It cannot be undone, and they would need to
            answer the survey again.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" onClick={onClose} autoFocus>
              Keep it
            </Button>
            <Button type="submit" variant="danger" loading={remove.isPending}>
              Delete response
            </Button>
          </div>
        </form>
      )}
    </dialog>
  );
}
