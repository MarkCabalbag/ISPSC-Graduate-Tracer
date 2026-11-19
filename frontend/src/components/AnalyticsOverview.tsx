import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { DownloadIcon } from "lucide-react";
import { client } from "../api/client";
import { useGetAnalytics } from "../context/hooks";
import {
  chartConfigBarHorizontal,
  type ChartTypes,
} from "../types/type";
import { ChartBar } from "./charts/ChartBar";
import { ChartBarhorizontal } from "./charts/ChartBarHorizontal";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Skeleton } from "./ui/skeleton";

const chartConfigEmployment: ChartTypes["chartConfig"] = {
  traced: { label: "Traced", color: "hsl(var(--chart-1))" },
  employed: { label: "Employed", color: "hsl(var(--chart-2))" },
};

/** Formats a percentage such as `72.5`, or a dash when there is no data. */
const formatRate = (value: number | null): string =>
  value === null ? "—" : `${value}%`;

const StatTile = ({ label, value }: { label: string; value: string }) => (
  <Card className="p-4 text-center">
    <p className="text-2xl font-bold text-primary">{value}</p>
    <p className="text-sm text-neutral-600">{label}</p>
  </Card>
);

/**
 * Overall analytics for the admin dashboard: key rates and charts of graduates
 * by year, by program, by sector and by job location. Also offers the CSV
 * export of every response.
 */
const AnalyticsOverview = () => {
  const { data, isLoading, isError, refetch } = useGetAnalytics();
  const [isExporting, setIsExporting] = useState(false);

  // Stable arrays, so the memoized charts only redraw when the data changes.
  const yearData = useMemo(
    () =>
      (data?.byYear ?? []).map((row) => ({
        ...row,
        yearOfGraduation: String(row.yearOfGraduation ?? "Unknown"),
      })),
    [data],
  );
  const programData = useMemo(
    () =>
      (data?.byProgram ?? []).map((row) => ({
        ...row,
        program: row.program ?? "Unknown",
      })),
    [data],
  );

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const blob = await client.admin.exportResponsesCsv();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "graduate-responses.csv";
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("The export could not be created. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <section
      aria-labelledby="analytics-heading"
      className="w-[90%] mx-auto my-5 space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="analytics-heading" className="text-primary font-bold text-xl">
          Analytics
        </h2>
        <Button
          onClick={handleExport}
          disabled={isExporting}
          className="text-xs sm:text-sm"
        >
          <DownloadIcon className="h-4 w-4" aria-hidden="true" />
          <span className="ml-1">
            {isExporting ? "Preparing..." : "Export all responses (CSV)"}
          </span>
        </Button>
      </div>

      {isLoading && (
        <div aria-busy="true" className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      )}

      {isError && (
        <Card role="alert" className="p-6 text-center space-y-3">
          <p>The analytics could not be loaded.</p>
          <Button onClick={() => refetch()}>Try again</Button>
        </Card>
      )}

      {data && data.totals.traced === 0 && (
        <Card className="p-6 text-center">
          <p>No survey responses yet. Charts appear after graduates respond.</p>
        </Card>
      )}

      {data && data.totals.traced > 0 && (
        <>
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <StatTile label="Traced graduates" value={String(data.totals.traced)} />
            <StatTile
              label="Employment rate"
              value={formatRate(data.totals.employmentRate)}
            />
            <StatTile
              label="Jobs related to course"
              value={formatRate(data.totals.jobAlignmentRate)}
            />
            <StatTile
              label="In further studies"
              value={String(data.totals.furtherStudies)}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <ChartBar
              chartData={yearData}
              chartConfig={chartConfigEmployment}
              dataKey="yearOfGraduation"
              title="Graduates by Year"
              description="Traced and employed graduates per graduation year"
            />
            <ChartBar
              chartData={programData}
              chartConfig={chartConfigEmployment}
              dataKey="program"
              title="Graduates by Program"
              description="Traced and employed graduates per program"
            />
            <ChartBar
              chartData={data.organization}
              chartConfig={chartConfigBarHorizontal}
              dataKey="organization"
              valueKey="total"
              title="Sector of Employment"
              description="Government, private or entrepreneurial"
            />
            <ChartBarhorizontal
              chartData={data.location}
              chartConfig={chartConfigBarHorizontal}
              dataKey="location"
              valueKey="total"
              title="Job Location"
              description="Working locally or abroad"
            />
          </div>
        </>
      )}
    </section>
  );
};

export default AnalyticsOverview;
