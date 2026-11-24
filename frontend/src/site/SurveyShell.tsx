import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import seal from "../assets/seal-96.webp";
import { Chip, cx } from "../components/kit";
import { NUMBERED, STEPS, TITLES, type Step } from "./surveySteps";

const isPreview = import.meta.env.VITE_MOCK_API === "true";

const RAIL: { step: Exclude<Step, "done">; asks: string }[] = [
  { step: "privacy", asks: "Privacy notice and consent" },
  { step: "about", asks: "Name, email and year you graduated" },
  { step: "degree", asks: "College, program and major" },
  { step: "work", asks: "Work and further studies" },
  { step: "check", asks: "Review, then submit" },
];

const Tick = ({ className }: { className?: string }) => (
  <svg aria-hidden="true" viewBox="0 0 12 12" className={className}>
    <path d="M2.5 6.3 5 8.6l4.5-5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * The survey's frame (DESIGN.md › Layout › Survey, Components › Survey shell):
 * an ink step rail beside a white pane at `lg`, an ink step bar above the pane below it.
 */
export default function SurveyShell({ step, children }: { step: Step; children: ReactNode }) {
  const current = STEPS.indexOf(step);
  const number = NUMBERED[step];
  const done = step === "done";
  const filled = number ?? (step === "check" ? 3 : 0);

  return (
    <div className="grid min-h-svh bg-white lg:grid-cols-[380px_minmax(0,1fr)]">
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-gold px-4 py-2 font-semibold text-ink focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        Skip to main content
      </a>

      {/* step rail: lg and up */}
      <div className="sticky top-0 hidden h-svh grid-rows-[auto_1fr_auto] gap-10 overflow-y-auto bg-ink px-10 py-9 text-white lg:grid">
        <Link to="/" className="flex items-center gap-3 text-white no-underline">
          <img src={seal} alt="" width={40} height={40} className="size-10 rounded-full bg-white" />
          <span className="grid leading-tight">
            <span className="text-[13px] text-[#d1d5db]">Ilocos Sur Polytechnic State College</span>
            <span className="text-[19px] font-bold">Graduate Tracer</span>
          </span>
        </Link>

        <ol aria-label="Survey steps" className="grid content-start">
          {RAIL.map((item, index) => {
            const state = done || STEPS.indexOf(item.step) < current ? "done" : item.step === step ? "now" : "next";
            const last = index === RAIL.length - 1;
            return (
              <li
                key={item.step}
                aria-current={state === "now" ? "step" : undefined}
                className="relative grid grid-cols-[28px_minmax(0,1fr)] gap-3.5 pb-6.5 last:pb-0"
              >
                {!last && (
                  <span
                    aria-hidden="true"
                    className={cx(
                      "absolute top-[30px] bottom-0.5 left-[13px] w-0.5",
                      state === "done" ? "bg-[#9ca3af]" : "bg-[#374151]",
                    )}
                  />
                )}
                <span
                  aria-hidden="true"
                  className={cx(
                    "relative z-10 grid size-7 place-items-center rounded-full border-2 text-[13px] font-bold",
                    state === "done" && "border-white bg-white text-ink",
                    state === "now" && "border-white bg-ink text-white shadow-[0_0_0_4px_rgb(255_255_255/0.14)]",
                    state === "next" && "border-[#4b5563] bg-ink text-[#9ca3af]",
                  )}
                >
                  {state === "done" ? <Tick className="size-3" /> : index + 1}
                </span>
                <span>
                  <span
                    className={cx(
                      "block text-[17px] leading-7 font-semibold",
                      state === "now" ? "text-white" : state === "done" ? "text-[#e5e7eb]" : "text-[#9ca3af]",
                    )}
                  >
                    {TITLES[item.step]}
                    <span className="sr-only">
                      {state === "done" ? " (done)" : state === "now" ? " (current step)" : ""}
                    </span>
                  </span>
                  <span className="mt-0.5 block text-[14px] text-[#9ca3af]">{item.asks}</span>
                </span>
              </li>
            );
          })}
        </ol>

        <div className="grid justify-items-start gap-2.5 border-t border-[#374151] pt-4.5 text-[14px] text-[#9ca3af]">
          <p>{done ? "Thank you for taking part." : "About 5 minutes. Your answers stay in this browser tab until you submit."}</p>
          {isPreview && <Chip>Sample data</Chip>}
        </div>
      </div>

      <div className="grid min-w-0 grid-rows-[auto_1fr_auto]">
        {/* step bar: below lg */}
        <div className="grid gap-3 bg-ink px-4 pt-3 pb-4 text-white sm:px-8 lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <Link to="/" className="flex min-h-11 items-center gap-2.5 text-[17px] font-bold text-white no-underline">
              <img src={seal} alt="" width={30} height={30} className="size-[30px] rounded-full bg-white" />
              Graduate Tracer
            </Link>
            {isPreview && <Chip>Sample data</Chip>}
          </div>
          {!done && (
            <>
              <p className="flex justify-between gap-3 text-[15px] text-[#d1d5db]">
                <b className="font-semibold text-white">{number ? `Step ${number} of 3` : TITLES[step]}</b>
                {number && <span>{TITLES[step]}</span>}
              </p>
              <div aria-hidden="true" className="grid grid-cols-3 gap-1.5">
                {[1, 2, 3].map((i) => (
                  <span key={i} className={cx("h-[5px] rounded-full", filled >= i ? "bg-white" : "bg-[#374151]")} />
                ))}
              </div>
            </>
          )}
        </div>

        <main id="main" tabIndex={-1} className="min-w-0 px-4 pt-4 pb-10 outline-none sm:px-8 lg:px-18 lg:pt-10 lg:pb-16">
          <div className="max-w-[640px]">{children}</div>
        </main>

        <footer className="flex flex-wrap items-center justify-between gap-x-5 gap-y-1 border-t border-line px-4 py-2 text-[14px] text-faint sm:px-8 lg:px-18">
          <p>Ilocos Sur Polytechnic State College · Sta. Maria campus</p>
          <Link to="/privacy" className="inline-flex min-h-11 items-center text-ink-2 underline underline-offset-2 hover:text-ink">
            Privacy notice
          </Link>
        </footer>
      </div>
    </div>
  );
}
