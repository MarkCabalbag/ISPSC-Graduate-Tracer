/**
 * Charts drawn with HTML and CSS: every bar carries its value as text, colour is never the
 * only cue, and each chart has an accessible table-like description. No chart library.
 */
import type { CSSProperties } from "react";
import { cx } from "./kit";

export type Series = { name: string; color: string };

export const Legend = ({ series }: { series: Series[] }) => (
  <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted-foreground">
    {series.map((s) => (
      <li key={s.name} className="inline-flex items-center gap-1.5">
        <span aria-hidden="true" className="size-2.5 rounded-[2px]" style={{ background: s.color }} />
        {s.name}
      </li>
    ))}
  </ul>
);

const pct = (value: number | null) => (value === null ? "–" : `${Math.round(value)}%`);

/** Vertical grouped bars on a 0–100% axis. */
export const GroupedBars = ({
  groups,
  series,
  label,
}: {
  groups: { label: string; values: (number | null)[] }[];
  series: Series[];
  label: string;
}) => (
  <figure className="m-0">
    <div
      role="img"
      aria-label={`${label}. ${groups
        .map((g) => `${g.label}: ${g.values.map((v, i) => `${series[i].name} ${pct(v)}`).join(", ")}`)
        .join("; ")}`}
      className="relative ml-8 mt-6 h-44 border-b border-input"
    >
      {[100, 75, 50, 25].map((tick) => (
        <div
          key={tick}
          aria-hidden="true"
          className="absolute inset-x-0 border-t border-dashed border-[#eceef1]"
          style={{ top: `${100 - tick}%` }}
        >
          <span className="absolute -left-8 -top-2.5 w-6 text-right text-xs text-faint tabular">{tick}</span>
        </div>
      ))}
      <span aria-hidden="true" className="absolute -left-8 bottom-[-9px] w-6 text-right text-xs text-faint">
        0
      </span>
      <div aria-hidden="true" className="absolute inset-0 flex items-end justify-around">
        {groups.map((group) => (
          <div key={group.label} className="flex h-full items-end gap-1.5">
            {group.values.map((value, i) => (
              <div
                key={series[i].name}
                className="bar-rise relative w-[clamp(14px,3.2vw,36px)] rounded-t-[3px]"
                style={{ height: `${Math.max(0, Math.min(100, value ?? 0))}%`, background: series[i].color } as CSSProperties}
              >
                <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs font-semibold text-ink tabular whitespace-nowrap">
                  {pct(value)}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
    <div aria-hidden="true" className="ml-8 flex justify-around pt-2 text-[13px] font-semibold text-ink-2">
      {groups.map((g) => (
        <span key={g.label} className="max-w-[9ch] truncate text-center">
          {g.label}
        </span>
      ))}
    </div>
  </figure>
);

/** One horizontal stacked bar with a list of counts and shares under it. */
export const StackedBar = ({
  items,
  label,
  totalLabel,
}: {
  items: { name: string; value: number; color: string }[];
  label: string;
  totalLabel: string;
}) => {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  const share = (value: number) => (total > 0 ? Math.round((value / total) * 100) : 0);
  return (
    <figure className="m-0">
      <div
        role="img"
        aria-label={`${label}. ${items.map((i) => `${i.name} ${i.value} (${share(i.value)}%)`).join(", ")}`}
        className="mt-6 flex h-8 gap-0.5 overflow-hidden rounded"
      >
        {total === 0 ? (
          <div className="flex-1 bg-[#f3f4f6]" />
        ) : (
          items.map((item) =>
            item.value > 0 ? (
              <div key={item.name} className="bar-grow h-full" style={{ flex: item.value, background: item.color }} />
            ) : null,
          )
        )}
      </div>
      <ul className="mt-5">
        {items.map((item) => (
          <li
            key={item.name}
            className="grid grid-cols-[16px_1fr_64px_48px] items-center border-t border-line py-2.5 text-[15px] first:border-t-0"
          >
            <span aria-hidden="true" className="size-2.5 rounded-[2px]" style={{ background: item.color }} />
            <span className="text-ink-2">{item.name}</span>
            <span className="text-right font-semibold tabular">{item.value}</span>
            <span className="text-right text-faint tabular">{share(item.value)}%</span>
          </li>
        ))}
      </ul>
      <div className="flex justify-between border-t border-line pt-2.5 text-[14px] text-muted-foreground">
        <span>{totalLabel}</span>
        <b className="text-ink tabular">{total}</b>
      </div>
    </figure>
  );
};

/** A thin progress meter, e.g. traced out of the cohort's graduates. */
export const Meter = ({ value, label, className }: { value: number; label: string; className?: string }) => (
  <div
    role="meter"
    aria-label={label}
    aria-valuemin={0}
    aria-valuemax={100}
    aria-valuenow={Math.round(value)}
    className={cx("h-1.5 overflow-hidden rounded-full bg-[#f3f4f6]", className)}
  >
    <div className="bar-grow h-full rounded-full bg-brand" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
  </div>
);
