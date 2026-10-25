/**
 * =============================================================================
 * ChartBar.tsx — Reusable bar chart card
 * =============================================================================
 *
 * PURPOSE
 * -------
 * Renders a titled Card containing a Recharts bar chart. One <Bar> is drawn per
 * key in `chartConfig`, so the same component can show any number of series.
 *
 * PROPS (type: ChartTypes, from ../../types/type)
 * -----------------------------------------------
 *   chartData    Array of row objects, e.g.
 *                  [{ year: "2023", employed: 40, unemployed: 5 }, ...]
 *   chartConfig  Object whose KEYS are the series to plot and whose values are
 *                the label/color config used by ChartContainer, e.g.
 *                  { employed: { label: "Employed" }, unemployed: { label: "Unemployed" } }
 *   dataKey      Key in each chartData row used for the X axis (e.g. "year").
 *   title        Card title.
 *   description  Card subtitle.
 *
 * USAGE
 * -----
 *   <ChartBar
 *     title="Employment by Year"
 *     description="Graduates per year"
 *     dataKey="year"
 *     chartData={rows}
 *     chartConfig={config}
 *   />
 *
 * DEBUGGING GUIDE
 * ---------------
 *   - Chart is empty            -> `chartData` is empty/undefined, or the keys in
 *                                  `chartConfig` don't match the keys in each row.
 *   - X axis labels missing     -> `dataKey` doesn't exist in the row objects.
 *   - A series is missing       -> it is not a key of `chartConfig`
 *                                  (bars are generated from Object.keys(chartConfig)).
 *   - Tooltip / legend blank    -> check `label` entries in `chartConfig`.
 *   - Quick trace (temporary):
 *       console.debug("[ChartBar]", { dataKey, keys: Object.keys(chartConfig), rows: chartData?.length });
 *
 * NOTES (documented, intentionally NOT changed — behavior preserved)
 * ------------------------------------------------------------------
 *   1. All bars share one fixed color (CHART_BAR_FILL), so multiple series are
 *      not visually distinguishable by color.
 *   2. Chart size is fixed at 600x400 (CHART_WIDTH / CHART_HEIGHT); ChartContainer
 *      may override this to fit its parent depending on its implementation.
 *   3. No empty-state or loading UI; the parent should handle those cases.
 *
 * DEPENDENCIES
 * ------------
 *   recharts, ../ui/card, ../ui/chart, ../../types/type
 * =============================================================================
 */

import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  ChartContainer,
  ChartLegendContent,
  ChartTooltipContent,
} from "../ui/chart";
import { ChartTypes } from "../../types/type";

/* -----------------------------------------------------------------------------
 * Constants (defined once, outside the component)
 * ---------------------------------------------------------------------------*/

const CHART_WIDTH = 600;
const CHART_HEIGHT = 400;
const CHART_BAR_FILL = "hsl(0, 100%, 21%)";
const CHART_BAR_RADIUS: [number, number, number, number] = [4, 4, 0, 0];

/* -----------------------------------------------------------------------------
 * Component
 * ---------------------------------------------------------------------------*/

export function ChartBar({
  chartData,
  chartConfig,
  dataKey,
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

      {/* Chart body */}
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart width={CHART_WIDTH} height={CHART_HEIGHT} data={chartData}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey={dataKey} tickLine={false} axisLine={false} />
            <YAxis allowDecimals={false} />
            <Tooltip content={<ChartTooltipContent hideLabel />} />
            <Legend content={<ChartLegendContent />} />

            {/* One <Bar> per series defined in chartConfig */}
            {Object.keys(chartConfig).map((key) => (
              <Bar
                key={key}
                dataKey={key}
                fill={CHART_BAR_FILL}
                radius={CHART_BAR_RADIUS}
              />
            ))}
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}