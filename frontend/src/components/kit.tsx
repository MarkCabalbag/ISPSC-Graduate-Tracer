/**
 * The app's own small component kit: native elements with the design system applied.
 * Every control is a standard one (button, input, select, radio, checkbox), so keyboard,
 * screen-reader and autofill behaviour come from the browser, not from a library.
 */
import {
  forwardRef,
  useId,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";
import { Link, type LinkProps } from "react-router-dom";

const cx = (...parts: (string | false | null | undefined)[]) =>
  parts.filter(Boolean).join(" ");

/* ---------------------------------- buttons --------------------------------- */

type Variant = "primary" | "secondary" | "ghost" | "danger" | "ghost-danger";
type Size = "md" | "sm" | "lg";

const buttonClass = (variant: Variant, size: Size, full?: boolean) =>
  cx(
    "inline-flex items-center justify-center gap-2 rounded-md font-semibold whitespace-nowrap select-none",
    "transition-[background-color,border-color,color,box-shadow] duration-150",
    "disabled:cursor-not-allowed disabled:opacity-55 aria-busy:cursor-progress",
    size === "sm" && "h-9 px-3 text-sm",
    size === "md" && "h-10 px-4 text-[15px]",
    size === "lg" && "h-12 px-6 text-[17px]",
    variant === "primary" &&
      "bg-brand text-white shadow-[inset_0_-2px_0_rgb(0_0_0/0.18)] hover:bg-brand-hover active:shadow-none",
    variant === "secondary" &&
      "border border-input bg-white text-ink hover:bg-band hover:border-[#9ca3af]",
    variant === "ghost" && "text-ink-2 hover:bg-[#f3f4f6]",
    variant === "ghost-danger" && "text-danger hover:bg-danger-50",
    variant === "danger" &&
      "bg-danger text-white shadow-[inset_0_-2px_0_rgb(0_0_0/0.18)] hover:bg-[#912018]",
    full && "w-full",
  );

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  full?: boolean;
  loading?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = "secondary", size = "md", full, loading, className, children, disabled, ...rest },
    ref,
  ) => (
    <button
      ref={ref}
      className={cx(buttonClass(variant, size, full), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <Spinner />}
      {children}
    </button>
  ),
);
Button.displayName = "Button";

export const LinkButton = ({
  variant = "secondary",
  size = "md",
  full,
  className,
  ...rest
}: LinkProps & { variant?: Variant; size?: Size; full?: boolean }) => (
  <Link className={cx(buttonClass(variant, size, full), "no-underline", className)} {...rest} />
);

export const Spinner = ({ className }: { className?: string }) => (
  <span
    aria-hidden="true"
    className={cx(
      "inline-block size-4 animate-spin rounded-full border-2 border-current border-r-transparent",
      className,
    )}
  />
);

/* ----------------------------------- fields --------------------------------- */

type FieldShellProps = {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
  className?: string;
};

/** Label, hint and error wired to one control (GOV.UK pattern: the error sits above the input). */
export const FieldShell = ({ id, label, hint, error, children, className }: FieldShellProps) => (
  <div className={cx("grid gap-1.5", error && "border-l-4 border-danger pl-4", className)}>
    <label htmlFor={id} className="text-[17px] font-semibold text-ink">
      {label}
    </label>
    {hint && (
      <p id={`${id}-hint`} className="text-[15px] text-muted-foreground">
        {hint}
      </p>
    )}
    {error && (
      <p id={`${id}-error`} className="text-[15px] font-semibold text-danger">
        <span className="sr-only">Error: </span>
        {error}
      </p>
    )}
    {children}
  </div>
);

export const describedBy = (id: string, hint?: unknown, error?: unknown) =>
  [hint ? `${id}-hint` : "", error ? `${id}-error` : ""].filter(Boolean).join(" ") || undefined;

const controlClass = (error?: string) =>
  cx(
    "h-12 w-full rounded-md border-2 bg-white px-3 text-[17px] text-ink",
    "placeholder:text-faint transition-colors",
    error ? "border-danger" : "border-[#6b7280] hover:border-ink",
    "focus-visible:outline-[3px] focus-visible:outline-offset-0 focus-visible:outline-gold focus-visible:border-ink",
  );

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  width?: string;
};

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({ id: idProp, label, hint, error, width, className, ...rest }, ref) => {
    const auto = useId();
    const id = idProp ?? auto;
    return (
      <FieldShell id={id} label={label} hint={hint} error={error} className={className}>
        <input
          ref={ref}
          id={id}
          className={cx(controlClass(error), width)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, hint, error)}
          {...rest}
        />
      </FieldShell>
    );
  },
);
TextField.displayName = "TextField";

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  width?: string;
};

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ id: idProp, label, hint, error, width, className, children, ...rest }, ref) => {
    const auto = useId();
    const id = idProp ?? auto;
    return (
      <FieldShell id={id} label={label} hint={hint} error={error} className={className}>
        <select
          ref={ref}
          id={id}
          className={cx(controlClass(error), "appearance-auto pr-2", width)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, hint, error)}
          {...rest}
        >
          {children}
        </select>
      </FieldShell>
    );
  },
);
SelectField.displayName = "SelectField";

/* ----------------------------------- radios --------------------------------- */

export type RadioOption = { value: string; label: ReactNode; hint?: ReactNode };

type RadiosProps = {
  name: string;
  legend: ReactNode;
  hint?: ReactNode;
  error?: string;
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
  inline?: boolean;
  legendAs?: "h1" | "h2" | "default";
};

/** A GOV.UK-style radio group: a fieldset whose legend is the question. */
export const Radios = ({
  name,
  legend,
  hint,
  error,
  options,
  value,
  onChange,
  inline,
  legendAs = "default",
}: RadiosProps) => {
  const id = useId();
  return (
    <fieldset
      className={cx("grid gap-3 border-0 p-0 m-0 min-w-0", error && "border-l-4 border-danger pl-4")}
      aria-describedby={describedBy(id, hint, error)}
    >
      <legend
        className={cx(
          "mb-1 p-0 text-ink",
          legendAs === "h1" && "text-[28px] leading-tight font-bold tracking-[-0.01em] sm:text-[32px]",
          legendAs === "h2" && "text-[22px] leading-snug font-bold",
          legendAs === "default" && "text-[17px] font-semibold",
        )}
      >
        {legendAs === "h1" ? <h1 className="m-0 text-inherit font-inherit">{legend}</h1> : legend}
      </legend>
      {hint && (
        <p id={`${id}-hint`} className="-mt-1 text-[15px] text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-[15px] font-semibold text-danger">
          <span className="sr-only">Error: </span>
          {error}
        </p>
      )}
      <div className={cx("grid gap-2", inline && "sm:grid-flow-col sm:auto-cols-max sm:gap-6")}>
        {options.map((option) => {
          const optionId = `${id}-${option.value.replace(/\W+/g, "-")}`;
          return (
            <label
              key={option.value}
              htmlFor={optionId}
              className="flex min-h-11 cursor-pointer items-start gap-3 py-1.5 text-[17px] text-ink"
            >
              <input
                id={optionId}
                type="radio"
                name={name}
                value={option.value}
                checked={value === option.value}
                onChange={() => onChange(option.value)}
                className="mt-0.5 size-7 shrink-0 cursor-pointer accent-ink"
              />
              <span className="grid">
                <span>{option.label}</span>
                {option.hint && <span className="text-[15px] text-muted-foreground">{option.hint}</span>}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
};

/* --------------------------------- feedback --------------------------------- */

export type SummaryError = { href: string; text: string };

/** GOV.UK error summary: shown above the form after a failed submit, focused, linking each field. */
export const ErrorSummary = forwardRef<HTMLDivElement, { errors: SummaryError[]; title?: string }>(
  ({ errors, title = "There is a problem" }, ref) => {
    if (errors.length === 0) return null;
    return (
      <div
        ref={ref}
        tabIndex={-1}
        role="alert"
        aria-labelledby="error-summary-title"
        className="rounded-md border-[3px] border-danger bg-white p-5 focus-visible:outline-gold"
      >
        <h2 id="error-summary-title" className="text-[22px] font-bold text-ink">
          {title}
        </h2>
        <ul className="mt-3 grid gap-1.5">
          {errors.map((error) => (
            <li key={error.href}>
              <a href={error.href} className="font-semibold text-danger underline underline-offset-2">
                {error.text}
              </a>
            </li>
          ))}
        </ul>
      </div>
    );
  },
);
ErrorSummary.displayName = "ErrorSummary";

export const Chip = ({ children, tone = "gold" }: { children: ReactNode; tone?: "gold" | "neutral" | "ok" | "danger" }) => (
  <span
    className={cx(
      "inline-flex h-6 items-center gap-1.5 rounded-full border px-2.5 text-xs font-semibold whitespace-nowrap",
      tone === "gold" && "border-[#f1dfb1] bg-gold-50 text-gold-ink",
      tone === "neutral" && "border-line bg-band text-muted-foreground",
      tone === "ok" && "border-[#bbe5c9] bg-ok-50 text-ok",
      tone === "danger" && "border-[#fecdca] bg-danger-50 text-danger",
    )}
  >
    {children}
  </span>
);

export const Skeleton = ({ className }: { className?: string }) => (
  <span aria-hidden="true" className={cx("block animate-pulse rounded-md bg-[#eef0f3]", className)} />
);

export const Card = ({
  children,
  className,
  as: As = "section",
  ...rest
}: { children: ReactNode; className?: string; as?: "section" | "div" | "article" } & Record<string, unknown>) => (
  <As className={cx("min-w-0 rounded-lg border border-line bg-white", className)} {...rest}>
    {children}
  </As>
);

export const EmptyState = ({
  title,
  children,
  action,
}: {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) => (
  <div className="grid justify-items-start gap-2 px-6 py-10">
    <h3 className="text-[17px] font-semibold text-ink">{title}</h3>
    {children && <div className="max-w-[60ch] text-muted-foreground">{children}</div>}
    {action && <div className="mt-2">{action}</div>}
  </div>
);

export const ErrorState = ({ title, onRetry }: { title: string; onRetry?: () => void }) => (
  <div role="alert" className="grid justify-items-start gap-3 px-6 py-8">
    <p className="font-semibold text-ink">{title}</p>
    <p className="text-muted-foreground">Check your connection, then try again.</p>
    {onRetry && (
      <Button size="sm" onClick={onRetry}>
        Try again
      </Button>
    )}
  </div>
);

export { cx };
