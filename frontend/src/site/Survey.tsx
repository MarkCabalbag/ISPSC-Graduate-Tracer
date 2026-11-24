import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { client } from "../api/client";
import { ApiError } from "../api/http";
import { Button, ErrorSummary, Radios, SelectField, Skeleton, TextField, type SummaryError } from "../components/kit";
import { BackLink } from "./SiteLayout";
import SurveyShell from "./SurveyShell";
import { NUMBERED, STEPS, TITLES, type Step } from "./surveySteps";
import { PrivacyPoints } from "./PrivacyNotice";

/* ----------------------------------- model ----------------------------------- */

type Answers = {
  consent: boolean;
  fullName: string;
  email: string;
  yearOfGraduation: string;
  departmentId: string;
  programId: string;
  majorId: string;
  isEmployed: string;
  isJobAligned: string;
  typeOfOrganization: string;
  currentJobLocated: string;
  isSelfEmployed: string;
  isFurtherStudies: string;
};

const EMPTY: Answers = {
  consent: false,
  fullName: "",
  email: "",
  yearOfGraduation: "",
  departmentId: "",
  programId: "",
  majorId: "",
  isEmployed: "",
  isJobAligned: "",
  typeOfOrganization: "",
  currentJobLocated: "",
  isSelfEmployed: "",
  isFurtherStudies: "",
};

const STORAGE_KEY = "ispsc-tracer-survey";

const THIS_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: THIS_YEAR - 1979 }, (_, i) => String(THIS_YEAR - i));
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NOT_APPLICABLE = "not applicable";

const YES_NO = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];
const SECTORS = [
  { value: "government", label: "Government" },
  { value: "private institution", label: "Private company or institution" },
  { value: "entrepreneurial / freelance", label: "My own business or freelance work" },
];
const LOCATIONS = [
  { value: "locally", label: "In the Philippines" },
  { value: "abroad", label: "Abroad" },
];

const load = (): Answers => {
  try {
    return { ...EMPTY, ...JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "{}") };
  } catch {
    return EMPTY;
  }
};

type Errors = Partial<Record<keyof Answers | "form", string>>;

const validate = (step: Step, a: Answers, hasMajors: boolean): Errors => {
  const e: Errors = {};
  if (step === "privacy" && !a.consent) e.consent = "Select that you agree to the privacy notice to continue";
  if (step === "about") {
    if (!a.fullName.trim()) e.fullName = "Enter your full name";
    else if (a.fullName.trim().length > 150) e.fullName = "Full name must be 150 characters or fewer";
    if (!a.email.trim()) e.email = "Enter your email address";
    else if (!EMAIL.test(a.email.trim())) e.email = "Enter an email address in the correct format, like name@example.com";
    if (!a.yearOfGraduation) e.yearOfGraduation = "Select the year you graduated";
  }
  if (step === "degree") {
    if (!a.departmentId) e.departmentId = "Select your college";
    else if (!a.programId) e.programId = "Select your program";
    else if (hasMajors && !a.majorId) e.majorId = "Select your major";
  }
  if (step === "work") {
    if (!a.isEmployed) e.isEmployed = "Select yes if you are currently employed";
    if (a.isEmployed === "yes") {
      if (!a.isJobAligned) e.isJobAligned = "Select yes if your job is related to your course";
      if (!a.typeOfOrganization) e.typeOfOrganization = "Select who you work for";
      if (!a.currentJobLocated) e.currentJobLocated = "Select where you work";
    }
    if (!a.isSelfEmployed) e.isSelfEmployed = "Select yes if you run your own business or work freelance";
    if (!a.isFurtherStudies) e.isFurtherStudies = "Select yes if you are taking further studies";
  }
  return e;
};

/* ---------------------------------- the page --------------------------------- */

export default function Survey() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const stepParam = params.get("step") as Step | null;
  const step: Step = stepParam && STEPS.includes(stepParam) ? stepParam : "privacy";
  const returnToCheck = params.get("from") === "check";

  const [answers, setAnswers] = useState<Answers>(load);
  const [errors, setErrors] = useState<Errors>({});
  const summaryRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
    } catch {
      /* private mode: answers stay in memory */
    }
  }, [answers]);

  // A graduate who skipped ahead by URL is sent back to the first unanswered step.
  useEffect(() => {
    if (step === "done") return;
    const order = STEPS.indexOf(step);
    for (const earlier of STEPS.slice(0, order)) {
      if (earlier === "check" || earlier === "done") continue;
      if (Object.keys(validate(earlier, answers, false)).length > 0) {
        setParams({ step: earlier }, { replace: true });
        return;
      }
    }
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    document.title = `${TITLES[step]} – Graduate tracer survey – ISPSC`;
    setErrors({});
    headingRef.current?.focus();
    window.scrollTo({ top: 0 });
  }, [step]);

  const update = (patch: Partial<Answers>) => {
    setAnswers((current) => ({ ...current, ...patch }));
    setErrors((current) => {
      const next = { ...current };
      for (const key of Object.keys(patch)) delete next[key as keyof Answers];
      return next;
    });
  };

  const go = (next: Step, extra?: Record<string, string>) => setParams({ step: next, ...extra });

  const departments = useQuery({ queryKey: ["survey-departments"], queryFn: () => client.getDepartment() });
  const programs = useQuery({
    queryKey: ["survey-programs", answers.departmentId],
    queryFn: () => client.getRelatedProgram(Number(answers.departmentId)),
    enabled: Boolean(answers.departmentId),
  });
  const majors = useQuery({
    queryKey: ["survey-majors", answers.programId],
    queryFn: () => client.getRelatedMajor(Number(answers.programId)),
    enabled: Boolean(answers.programId),
  });
  const hasMajors = (majors.data?.length ?? 0) > 0;

  const submit = useMutation({
    mutationFn: () => {
      const employed = answers.isEmployed === "yes";
      return client.addResponse({
        yearOfSurvey: THIS_YEAR,
        email: answers.email.trim(),
        fullName: answers.fullName.trim(),
        yearOfGraduation: Number(answers.yearOfGraduation),
        departmentId: Number(answers.departmentId),
        programId: Number(answers.programId),
        majorId: answers.majorId ? Number(answers.majorId) : undefined,
        isEmployed: answers.isEmployed,
        isJobAligned: employed ? answers.isJobAligned : NOT_APPLICABLE,
        typeOfOrganization: employed ? answers.typeOfOrganization : NOT_APPLICABLE,
        currentJobLocated: employed ? answers.currentJobLocated : NOT_APPLICABLE,
        isSelfEmployed: answers.isSelfEmployed,
        isFurtherStudies: answers.isFurtherStudies,
      });
    },
    onSuccess: () => {
      try {
        sessionStorage.removeItem(STORAGE_KEY);
      } catch {
        /* nothing stored */
      }
      navigate("/survey?step=done", { replace: true });
    },
    onError: (error) => {
      const message =
        error instanceof ApiError && error.status === 409
          ? "This email address has already answered the survey. Each graduate answers once."
          : error instanceof ApiError && error.code !== "http"
            ? "The survey could not be sent because the connection dropped. Your answers are kept. Try again."
            : error instanceof ApiError
              ? error.message
              : "The survey could not be sent. Your answers are kept. Try again.";
      setErrors({ form: message });
      requestAnimationFrame(() => summaryRef.current?.focus());
    },
  });

  const onContinue = (event: FormEvent) => {
    event.preventDefault();
    const found = validate(step, answers, hasMajors);
    if (Object.keys(found).length > 0) {
      setErrors(found);
      requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }
    if (step === "check") {
      submit.mutate();
      return;
    }
    const next = returnToCheck ? "check" : STEPS[STEPS.indexOf(step) + 1];
    go(next);
  };

  const back = () => (step === "privacy" ? navigate("/") : navigate(-1));

  const summary: SummaryError[] = Object.entries(errors).map(([key, text]) => ({
    href: key === "form" ? "#main" : `#field-${key}`,
    text: text as string,
  }));

  if (step === "done") return <Done />;

  const number = NUMBERED[step];

  return (
    <SurveyShell step={step}>
        <BackLink onClick={back} />
        <form onSubmit={onContinue} noValidate className="grid gap-8">
          {summary.length > 0 && <ErrorSummary ref={summaryRef} errors={summary} />}

          <div className="grid gap-2">
            {number && (
              <p className="hidden text-[17px] text-muted-foreground lg:block">
                Step {number} of 3 <span className="sr-only">: {TITLES[step]}</span>
              </p>
            )}
            <h1 ref={headingRef} tabIndex={-1} className="text-[32px] leading-[1.15] font-bold tracking-[-0.02em] outline-none sm:text-[40px]">
              {TITLES[step]}
            </h1>
          </div>

          {step === "privacy" && <PrivacyStep answers={answers} update={update} error={errors.consent} />}
          {step === "about" && <AboutStep answers={answers} update={update} errors={errors} />}
          {step === "degree" && (
            <DegreeStep
              answers={answers}
              update={update}
              errors={errors}
              departments={departments}
              programs={programs}
              majors={majors}
            />
          )}
          {step === "work" && <WorkStep answers={answers} update={update} errors={errors} />}
          {step === "check" && (
            <CheckStep
              answers={answers}
              department={departments.data?.find((d) => String(d.id) === answers.departmentId)?.department}
              program={programs.data?.find((p) => String(p.id) === answers.programId)?.program}
              major={majors.data?.find((m) => String(m.id) === answers.majorId)?.major}
            />
          )}

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Button type="submit" variant="primary" size="lg" full className="sm:w-auto" loading={submit.isPending}>
              {step === "check" ? "Submit the survey" : step === "privacy" ? "Agree and continue" : "Continue"}
            </Button>
            {step === "check" && (
              <p className="text-[15px] text-muted-foreground">You cannot change your answers after you submit.</p>
            )}
          </div>
        </form>
    </SurveyShell>
  );
}

/* ----------------------------------- steps ----------------------------------- */

type StepProps = { answers: Answers; update: (patch: Partial<Answers>) => void; errors: Errors };

function PrivacyStep({ answers, update, error }: { answers: Answers; update: StepProps["update"]; error?: string }) {
  return (
    <>
      <p className="text-[19px] text-ink-2">
        This survey takes about 5 minutes. Read how the college uses your answers before you begin.
      </p>
      <div className="rounded-lg border border-line bg-band px-6 py-5">
        <h2 className="mb-4 text-[19px] font-bold">Privacy notice</h2>
        <PrivacyPoints />
      </div>
      <div id="field-consent" className={error ? "border-l-4 border-danger pl-4" : undefined}>
        {error && (
          <p id="consent-error" className="mb-2 text-[15px] font-semibold text-danger">
            <span className="sr-only">Error: </span>
            {error}
          </p>
        )}
        <label className="flex cursor-pointer items-start gap-3.5 rounded-md border-2 border-line-strong bg-white px-4 py-3.5 text-[17px] transition-colors hover:border-ink-2 has-checked:border-brand has-checked:bg-brand-50 has-focus-visible:outline-[3px] has-focus-visible:outline-offset-2 has-focus-visible:outline-gold">
          <input
            type="checkbox"
            checked={answers.consent}
            onChange={(e) => update({ consent: e.target.checked })}
            aria-describedby={error ? "consent-error" : undefined}
            aria-invalid={error ? true : undefined}
            className="mt-0.5 size-6 shrink-0 cursor-pointer accent-brand focus-visible:outline-none"
          />
          <span>
            I have read the privacy notice and I agree that ISPSC may use my answers as described.
          </span>
        </label>
      </div>
    </>
  );
}

function AboutStep({ answers, update, errors }: StepProps) {
  return (
    <div className="grid gap-7">
      <TextField
        id="field-fullName"
        label="Full name"
        autoComplete="name"
        spellCheck={false}
        value={answers.fullName}
        onChange={(e) => update({ fullName: e.target.value })}
        error={errors.fullName}
      />
      <TextField
        id="field-email"
        label="Email address"
        hint="The college may write to you about the survey. Each email address can answer once."
        type="email"
        inputMode="email"
        autoComplete="email"
        spellCheck={false}
        value={answers.email}
        onChange={(e) => update({ email: e.target.value })}
        error={errors.email}
      />
      <SelectField
        id="field-yearOfGraduation"
        label="Year you graduated"
        value={answers.yearOfGraduation}
        onChange={(e) => update({ yearOfGraduation: e.target.value })}
        error={errors.yearOfGraduation}
        width="max-w-[12rem]"
      >
        <option value="">Select a year</option>
        {YEARS.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </SelectField>
    </div>
  );
}

type ListQuery<T> = { data?: T[]; isLoading: boolean; isError: boolean; refetch: () => unknown };

function DegreeStep({
  answers,
  update,
  errors,
  departments,
  programs,
  majors,
}: StepProps & {
  departments: ListQuery<{ id?: number; department?: string }>;
  programs: ListQuery<{ id: number; program: string }>;
  majors: ListQuery<{ id?: number; major?: string }>;
}) {
  return (
    <div className="grid gap-9">
      <ListQuestion
        id="field-departmentId"
        legend="Which college did you graduate from?"
        query={departments}
        error={errors.departmentId}
        value={answers.departmentId}
        options={(departments.data ?? []).map((d) => ({ value: String(d.id), label: titleCase(d.department ?? "") }))}
        onChange={(value) => update({ departmentId: value, programId: "", majorId: "" })}
      />
      {answers.departmentId && (
        <ListQuestion
          id="field-programId"
          legend="Which program?"
          query={programs}
          error={errors.programId}
          value={answers.programId}
          options={(programs.data ?? []).map((p) => ({ value: String(p.id), label: p.program }))}
          onChange={(value) => update({ programId: value, majorId: "" })}
          empty="This college has no programs listed yet. Contact the MIS office."
        />
      )}
      {answers.programId && (majors.isLoading || (majors.data?.length ?? 0) > 0) && (
        <ListQuestion
          id="field-majorId"
          legend="Which major?"
          query={majors}
          error={errors.majorId}
          value={answers.majorId}
          options={(majors.data ?? []).map((m) => ({ value: String(m.id), label: m.major ?? "" }))}
          onChange={(value) => update({ majorId: value })}
        />
      )}
    </div>
  );
}

function ListQuestion({
  id,
  legend,
  query,
  error,
  value,
  options,
  onChange,
  empty,
}: {
  id: string;
  legend: string;
  query: ListQuery<unknown>;
  error?: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  empty?: string;
}) {
  if (query.isLoading) {
    return (
      <div className="grid gap-3" aria-busy="true">
        <p className="text-[17px] font-semibold">{legend}</p>
        <Skeleton className="h-14 w-full max-w-[440px]" />
        <Skeleton className="h-14 w-full max-w-[440px]" />
      </div>
    );
  }
  if (query.isError) {
    return (
      <div role="alert" className="grid justify-items-start gap-2">
        <p className="text-[17px] font-semibold">{legend}</p>
        <p className="text-ink-2">The list could not be loaded. Check your connection.</p>
        <Button size="sm" type="button" onClick={() => query.refetch()}>
          Try again
        </Button>
      </div>
    );
  }
  if (options.length === 0 && empty) return <p className="text-ink-2">{empty}</p>;
  return (
    <div id={id}>
      <Radios name={id} legend={legend} options={options} value={value} onChange={onChange} error={error} />
    </div>
  );
}

function WorkStep({ answers, update, errors }: StepProps) {
  const employed = answers.isEmployed === "yes";
  return (
    <div className="grid gap-9">
      <div id="field-isEmployed">
        <Radios
          name="isEmployed"
          legend="Are you currently employed?"
          hint="Count full-time, part-time and contract work."
          options={YES_NO}
          inline
          value={answers.isEmployed}
          onChange={(value) => update({ isEmployed: value })}
          error={errors.isEmployed}
        />
      </div>
      {employed && (
        <div className="grid gap-9 border-l-4 border-line-strong pl-5">
          <div id="field-isJobAligned">
            <Radios
              name="isJobAligned"
              legend="Is your job related to the course you took?"
              options={YES_NO}
              inline
              value={answers.isJobAligned}
              onChange={(value) => update({ isJobAligned: value })}
              error={errors.isJobAligned}
            />
          </div>
          <div id="field-typeOfOrganization">
            <Radios
              name="typeOfOrganization"
              legend="Who do you work for?"
              options={SECTORS}
              value={answers.typeOfOrganization}
              onChange={(value) => update({ typeOfOrganization: value })}
              error={errors.typeOfOrganization}
            />
          </div>
          <div id="field-currentJobLocated">
            <Radios
              name="currentJobLocated"
              legend="Where do you work?"
              options={LOCATIONS}
              inline
              value={answers.currentJobLocated}
              onChange={(value) => update({ currentJobLocated: value })}
              error={errors.currentJobLocated}
            />
          </div>
        </div>
      )}
      <div id="field-isSelfEmployed">
        <Radios
          name="isSelfEmployed"
          legend="Do you run your own business or work freelance?"
          options={YES_NO}
          inline
          value={answers.isSelfEmployed}
          onChange={(value) => update({ isSelfEmployed: value })}
          error={errors.isSelfEmployed}
        />
      </div>
      <div id="field-isFurtherStudies">
        <Radios
          name="isFurtherStudies"
          legend="Are you taking further studies?"
          hint="For example a master's degree, a second degree or a review course."
          options={YES_NO}
          inline
          value={answers.isFurtherStudies}
          onChange={(value) => update({ isFurtherStudies: value })}
          error={errors.isFurtherStudies}
        />
      </div>
    </div>
  );
}

const label = (options: { value: string; label: string }[], value: string) =>
  options.find((o) => o.value === value)?.label ?? value;

function CheckStep({
  answers,
  department,
  program,
  major,
}: {
  answers: Answers;
  department?: string;
  program?: string;
  major?: string;
}) {
  const employed = answers.isEmployed === "yes";
  const Row = ({ term, value, step, field }: { term: string; value: ReactNode; step: Step; field: string }) => (
    <div className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 border-b border-line py-3.5 text-[17px] sm:grid-cols-[38%_1fr_auto] sm:gap-4">
      <dt className="col-span-full font-semibold sm:col-span-1">{term}</dt>
      <dd className="min-w-0 text-ink-2 [overflow-wrap:anywhere]">{value}</dd>
      <dd>
        <Link to={`/survey?step=${step}&from=check`} className="text-link">
          Change<span className="sr-only"> {field}</span>
        </Link>
      </dd>
    </div>
  );
  return (
    <>
      <section aria-labelledby="check-you">
        <h2 id="check-you" className="text-[22px] font-bold">
          About you
        </h2>
        <dl className="mt-2 border-t border-line">
          <Row term="Full name" value={answers.fullName} step="about" field="full name" />
          <Row term="Email address" value={answers.email} step="about" field="email address" />
          <Row term="Year you graduated" value={answers.yearOfGraduation} step="about" field="year you graduated" />
        </dl>
      </section>
      <section aria-labelledby="check-degree">
        <h2 id="check-degree" className="text-[22px] font-bold">
          Your degree
        </h2>
        <dl className="mt-2 border-t border-line">
          <Row term="College" value={titleCase(department ?? "")} step="degree" field="college" />
          <Row term="Program" value={program ?? ""} step="degree" field="program" />
          {major && <Row term="Major" value={major} step="degree" field="major" />}
        </dl>
      </section>
      <section aria-labelledby="check-work">
        <h2 id="check-work" className="text-[22px] font-bold">
          Your work
        </h2>
        <dl className="mt-2 border-t border-line">
          <Row term="Currently employed" value={label(YES_NO, answers.isEmployed)} step="work" field="currently employed" />
          {employed && (
            <>
              <Row term="Job related to your course" value={label(YES_NO, answers.isJobAligned)} step="work" field="job related to your course" />
              <Row term="Works for" value={label(SECTORS, answers.typeOfOrganization)} step="work" field="who you work for" />
              <Row term="Works in" value={label(LOCATIONS, answers.currentJobLocated)} step="work" field="where you work" />
            </>
          )}
          <Row term="Own business or freelance" value={label(YES_NO, answers.isSelfEmployed)} step="work" field="own business or freelance" />
          <Row term="Further studies" value={label(YES_NO, answers.isFurtherStudies)} step="work" field="further studies" />
        </dl>
      </section>
    </>
  );
}

function Done() {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    document.title = "Survey complete – Graduate tracer survey – ISPSC";
    headingRef.current?.focus();
  }, []);
  return (
    <SurveyShell step="done">
        <div className="grid gap-3 rounded-lg border-2 border-[#bbe5c9] bg-ok-50 p-7">
          <span aria-hidden="true" className="grid size-11 place-items-center rounded-full bg-ok text-white">
            <svg viewBox="0 0 24 24" className="size-[22px]">
              <path d="M5 12.5 10 17l9-10" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <h1
            ref={headingRef}
            tabIndex={-1}
            className="text-[32px] leading-tight font-bold tracking-[-0.02em] outline-none sm:text-[40px]"
          >
            Survey complete
          </h1>
          <p className="text-[19px] text-[#14532d]">Thank you for answering the graduate tracer survey.</p>
        </div>
        <h2 className="mt-10 text-[24px] font-bold">What happens next</h2>
        <p className="mt-3 text-[19px] text-ink-2">
          Your answers are now part of your class's figures for the college's report to CHED. You do not need to
          do anything else.
        </p>
        <p className="mt-4 text-[19px] text-ink-2">
          To correct or remove your answers, contact the MIS office of ISPSC Sta. Maria campus.
        </p>
        <p className="mt-8 text-[17px]">
          <Link to="/" className="text-link">
            Back to the start page
          </Link>
        </p>
    </SurveyShell>
  );
}

const titleCase = (value: string) =>
  value.toLowerCase().replace(/\b(\w)(\w*)/g, (_, first: string, rest: string) =>
    ["of", "and", "in"].includes(first + rest) ? first + rest : first.toUpperCase() + rest,
  );
