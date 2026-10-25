/**
 * =============================================================================
 * ChartBarhorizontal.tsx — Reusable horizontal bar chart card
 * =============================================================================
 *
 * PURPOSE
 * -------
 * Renders a titled Card containing a horizontal Recharts bar chart (categories
 * on the Y axis, numeric values on the X axis). One <Bar> is drawn per key in
 * `chartConfig`, so the same component can show any number of series.
 *
 * PROPS (type: ChartTypes, from ../../types/type)
 * -----------------------------------------------
 *   chartData    Array of row objects, e.g.
 *                  [{ program: "BSIT", total: 120 }, { program: "BSBA", total: 80 }]
 *   chartConfig  Object whose KEYS are the series to plot and whose values are
 *                the label/color config used by ChartContainer, e.g.
 *                  { total: { label: "Graduates" } }
 *   dataKey      Key in each row used for the category (Y) axis, e.g. "program".
 *   valueKey     Key in each row used for the numeric (X) axis, e.g. "total".
 *   title        Card title.
 *   description  Card subtitle.
 *
 * USAGE
 * -----
 *   <ChartBarhorizontal
 *     title="Graduates per Program"
 *     description="Total traced graduates"
 *     dataKey="program"
 *     valueKey="total"
 *     chartData={rows}
 *     chartConfig={config}
 *   />
 *
 * LAYOUT
 * ------
 *   The card body has a fixed height of 500px (CARD_CONTENT_CLASS); the chart
 *   fills it (h-full w-full).
 *
 * DEBUGGING GUIDE
 * ---------------
 *   - Chart is empty            -> `chartData` is empty/undefined, or the keys in
 *                                  `chartConfig` don't match the keys in each row.
 *   - Category labels missing   -> `dataKey` doesn't exist in the row objects.
 *   - Bars have no length       -> `valueKey` / `chartConfig` keys don't match
 *                                  numeric fields in the rows.
 *   - Chart has zero height     -> the card body (500px) or a parent was changed.
 *   - Tooltip blank             -> check `label` entries in `chartConfig`.
 *   - Quick trace (temporary):
 *       console.debug("[ChartBarhorizontal]", { dataKey, valueKey, keys: Object.keys(chartConfig), rows: chartData?.length });
 *
 * NOTES (documented, intentionally NOT changed — behavior preserved)
 * ------------------------------------------------------------------
 *   1. All bars share one fixed color (CHART_BAR_FILL).
 *   2. Bar thickness is fixed at 100px (CHART_BAR_SIZE); with many categories
 *      the bars may overlap or overflow the 500px height.
 *   3. `tickFormatter={(value) => value}` returns the value unchanged (no-op).
 *   4. `allowDecimals` on the category (Y) axis has no effect; it only applies
 *      to numeric axes.
 *   5. Bar radius [2, 2, 0, 0] rounds the top corners, which on a horizontal
 *      bar is the top edge rather than the bar's end.
 *   6. No empty-state or loading UI; the parent should handle those cases.
 *
 * DEPENDENCIES
 * ------------
 *   recharts, ../ui/card, ../ui/chart, ../../types/type
 * =============================================================================
 */

import { Bar, BarChart, XAxis, YAxis } from "recharts";

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

const CARD_CONTENT_CLASS = "h-[500px]";
const CHART_CONTAINER_CLASS = "h-full w-full";
const CHART_BAR_FILL = "hsl(0, 100%, 21%)";
const CHART_BAR_RADIUS: [number, number, number, number] = [2, 2, 0, 0];
const CHART_BAR_SIZE = 100;

/* -----------------------------------------------------------------------------
 * Component
 * ---------------------------------------------------------------------------*/

export function ChartBarhorizontal({
  chartData,
  chartConfig,
  dataKey,
  valueKey,
  title,
  description,
}: ChartTypes) {
  return (
    <Card>
      {/* Card header: title + description */}
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      {/* Chart body (fixed height) */}
      <CardContent className={CARD_CONTENT_CLASS}>
        <ChartContainer config={chartConfig} className={CHART_CONTAINER_CLASS}>
          <BarChart accessibilityLayer data={chartData} layout="vertical">
            {/* X axis: numeric values */}
            <XAxis type="number" dataKey={valueKey} allowDecimals={false} />
            {/* Y axis: categories */}
            <YAxis
              dataKey={dataKey}
              type="category"
              tickFormatter={(value) => value}
              allowDecimals={false}
            />

            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />

            {/* One <Bar> per series defined in chartConfig */}
            {Object.keys(chartConfig).map((key) => (
              <Bar
                key={key}
                dataKey={key}
                fill={CHART_BAR_FILL}
                radius={CHART_BAR_RADIUS}
                barSize={CHART_BAR_SIZE}
              />
            ))}
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}