/**
 * =============================================================================
 * ChartPie.tsx — Reusable donut (pie) chart card
 * =============================================================================
 *
 * PURPOSE
 * -------
 * Renders a titled Card containing a donut-style Recharts pie chart. The first
 * slice is always shown enlarged (highlighted) by `activeIndex={0}`.
 *
 * PROPS (type: ChartTypes, from ../../types/type)
 * -----------------------------------------------
 *   chartData    Array of slice objects, e.g.
 *                  [{ status: "Employed", total: 120, fill: "hsl(0, 100%, 21%)" },
 *                   { status: "Unemployed", total: 30, fill: "hsl(63, 100%, 48%)" }]
 *   chartConfig  Label/color config used by ChartContainer (tooltip names), e.g.
 *                  { Employed: { label: "Employed" }, Unemployed: { label: "Unemployed" } }
 *   dataKey      Key in each row holding the numeric value (slice size), e.g. "total".
 *   nameKey      Key in each row holding the slice name, e.g. "status".
 *   title        Card title.
 *   description  Card subtitle.
 *
 * USAGE
 * -----
 *   <ChartPie
 *     title="Employment Status"
 *     description="Share of graduates"
 *     dataKey="total"
 *     nameKey="status"
 *     chartData={rows}
 *     chartConfig={config}
 *   />
 *
 * COLORS
 * ------
 *   Default slice color is PIE_FILL (dark red). To color slices differently,
 *   include a `fill` field in each chartData row (Recharts uses the row's
 *   `fill` over the Pie's default).
 *
 * DEBUGGING GUIDE
 * ---------------
 *   - Chart is empty / no slices -> `chartData` is empty, or `dataKey` isn't a
 *                                   numeric field in the rows.
 *   - Tooltip shows wrong names  -> `nameKey` doesn't match a field in the rows,
 *                                   or `chartConfig` has no matching entry.
 *   - All slices same color      -> rows have no `fill` field (see COLORS).
 *   - Wrong slice is enlarged    -> the active slice is hardcoded to index 0
 *                                   (PIE_ACTIVE_INDEX).
 *   - Quick trace (temporary):
 *       console.debug("[ChartPie]", { dataKey, nameKey, rows: chartData?.length });
 *
 * NOTES (documented, intentionally NOT changed — behavior preserved)
 * ------------------------------------------------------------------
 *   1. The first slice is always highlighted/enlarged by 10px
 *      (PIE_ACTIVE_INDEX, ACTIVE_OUTER_RADIUS_OFFSET), regardless of hover.
 *   2. `PieSectorDataItem` is imported from a recharts internal path
 *      ("recharts/types/polar/Pie"); this may break on recharts upgrades.
 *   3. No empty-state or loading UI; the parent should handle those cases.
 *
 * DEPENDENCIES
 * ------------
 *   recharts, ../ui/card, ../ui/chart, ../../types/type
 * =============================================================================
 */

import { Pie, PieChart, Sector } from "recharts";
import { PieSectorDataItem } from "recharts/types/polar/Pie";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "../ui/chart";
import { ChartTypes } from "../../types/type";

/* -----------------------------------------------------------------------------
 * Constants (defined once, outside the component)
 * ---------------------------------------------------------------------------*/

const PIE_FILL = "hsl(0, 100%, 21%)";
const PIE_INNER_RADIUS = 60;
const PIE_STROKE_WIDTH = 5;
const PIE_ACTIVE_INDEX = 0;
const ACTIVE_OUTER_RADIUS_OFFSET = 10;

/**
 * Renders the highlighted slice: same as a normal slice but with a larger
 * outer radius so it "pops out".
 */
const renderActiveShape = ({
  outerRadius = 0,
  ...props
}: PieSectorDataItem) => (
  <Sector {...props} outerRadius={outerRadius + ACTIVE_OUTER_RADIUS_OFFSET} />
);

/* -----------------------------------------------------------------------------
 * Component
 * ---------------------------------------------------------------------------*/

export function ChartPie({
  chartData,
  chartConfig,
  dataKey,
  nameKey,
  title,
  description,
}: ChartTypes) {
  return (
    <Card className="flex flex-col">
      {/* Card header: title + description */}
      <CardHeader className="justify-start pb-0">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      {/* Chart body */}
      <CardContent className="flex-1 pb-0">
        <ChartContainer config={chartConfig}>
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />

            <Pie
              data={chartData}
              dataKey={dataKey}
              nameKey={nameKey}
              innerRadius={PIE_INNER_RADIUS}
              fill={PIE_FILL}
              strokeWidth={PIE_STROKE_WIDTH}
              activeIndex={PIE_ACTIVE_INDEX}
              activeShape={renderActiveShape}
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}