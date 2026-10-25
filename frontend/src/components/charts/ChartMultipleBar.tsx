/**
 * =============================================================================
 * ChartMultipleBar.tsx — Grouped (multi-series) bar chart card
 * =============================================================================
 *
 * PURPOSE
 * -------
 * Renders a Card containing a grouped Recharts bar chart that compares several
 * series side by side for each X-axis category. It is used for "Employment and
 * Further Education Status Among Respondents" (graduate outcomes).
 * One <Bar> is drawn per key in `chartConfig`, colored from COLOR_PALETTE.
 *
 * PROPS (type: ChartTypes, from ../../types/type)
 * -----------------------------------------------
 *   chartData    Array of row objects, e.g.
 *                  [{ year: "2023", employed: 40, furtherStudy: 12 }, ...]
 *   chartConfig  Object whose KEYS are the series to plot and whose values are
 *                the label/color config used by ChartContainer, e.g.
 *                  { employed: { label: "Employed" }, furtherStudy: { label: "Further Study" } }
 *   dataKey      Key in each row used for the X axis (e.g. "year").
 *
 *   NOTE: `title` and `description` are NOT used by this component. The card
 *   title and description are hardcoded (see CARD_TITLE / CARD_DESCRIPTION).
 *
 * USAGE
 * -----
 *   <ChartMultipleBar dataKey="year" chartData={rows} chartConfig={config} />
 *
 * COLORS
 * ------
 *   Series are colored by their position in `chartConfig`:
 *     1st series -> dark red   hsl(0, 100%, 21%)
 *     2nd series -> gold       hsl(63, 100%, 48%)
 *     3rd+       -> palette repeats (index % palette length)
 *
 * DEBUGGING GUIDE
 * ---------------
 *   - Chart is empty            -> `chartData` is empty/undefined, or the keys in
 *                                  `chartConfig` don't match the keys in each row.
 *   - X axis labels missing     -> `dataKey` doesn't exist in the row objects.
 *   - A series is missing       -> it is not a key of `chartConfig`
 *                                  (bars are generated from Object.keys(chartConfig)).
 *   - Wrong bar color           -> colors follow key ORDER in `chartConfig`.
 *   - Legend/tooltip names odd  -> check `label` entries in `chartConfig`.
 *   - Quick trace (temporary):
 *       console.debug("[ChartMultipleBar]", { dataKey, keys: Object.keys(chartConfig), rows: chartData?.length });
 *
 * NOTES (documented, intentionally NOT changed — behavior preserved)
 * ------------------------------------------------------------------
 *   1. Card title/description are hardcoded; passing `title` / `description`
 *      has no effect.
 *   2. Chart size is fixed at 600x400 (CHART_WIDTH / CHART_HEIGHT);
 *      ChartContainer may override this to fit its parent.
 *   3. Only two colors are defined; with 3+ series, colors repeat.
 *   4. No empty-state or loading UI; the parent should handle those cases.
 *
 * DEPENDENCIES
 * ------------
 *   recharts, ../ui/card, ../ui/chart, ../../types/type
 * =============================================================================
 */

import { Bar, BarChart, CartesianGrid, XAxis, Legend, YAxis } from "recharts";

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

// Color palette applied to series by position (repeats if more series than colors)
const colorPalette = [
  "hsl(0, 100%, 21%)", // Red
  "hsl(63, 100%, 48%)", // Gold
];

const CARD_TITLE = "Employment and Further Education Status Among Respondents";
const CARD_DESCRIPTION = "Graduate Outcomes based on the data";

const CHART_WIDTH = 600;
const CHART_HEIGHT = 400;
const CHART_BAR_RADIUS: [number, number, number, number] = [4, 4, 0, 0];

/* -----------------------------------------------------------------------------
 * Component
 * ---------------------------------------------------------------------------*/

export function ChartMultipleBar({
  chartData,
  chartConfig,
  dataKey,
}: ChartTypes) {
  return (
    <Card>
      {/* Card header: hardcoded title + description */}
      <CardHeader>
        <CardTitle>{CARD_TITLE}</CardTitle>
        <CardDescription>{CARD_DESCRIPTION}</CardDescription>
      </CardHeader>

      {/* Chart body */}
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart data={chartData} width={CHART_WIDTH} height={CHART_HEIGHT}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={dataKey} tickLine={false} tickMargin={10} />
            <YAxis allowDecimals={false} />
            <Legend />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />

            {/* One <Bar> per series in chartConfig, colored by position */}
            {Object.keys(chartConfig).map((key, index) => (
              <Bar
                key={key}
                dataKey={key}
                fill={colorPalette[index % colorPalette.length]}
                radius={CHART_BAR_RADIUS}
              />
            ))}
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}