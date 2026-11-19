import { Link } from "react-router-dom";
import SiteLayout from "./SiteLayout";

/** GOV.UK start-page pattern: what the service is, what you need, one Start button. */
export default function StartPage() {
  return (
    <SiteLayout>
      <div className="grid gap-12 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="max-w-[640px]">
          <h1 className="text-[32px] leading-[1.15] font-bold tracking-[-0.02em] sm:text-[44px]">
            Graduate tracer survey
          </h1>
          <p className="mt-5 text-[19px] leading-relaxed text-ink-2">
            Tell Ilocos Sur Polytechnic State College, Sta. Maria campus, what you have done since you graduated.
            The college reports the totals to the Commission on Higher Education (CHED) and uses them to improve
            its programs.
          </p>

          <p className="mt-6 text-[19px]">It takes about 5 minutes. You will be asked:</p>
          <ul className="mt-3 grid list-disc gap-1.5 pl-6 text-[19px] marker:text-faint">
            <li>your name, email and year of graduation</li>
            <li>your college, program and major</li>
            <li>whether you are working, and whether your job is related to your course</li>
          </ul>

          <Link
            to="/survey"
            className="mt-9 inline-flex h-14 items-center gap-3 rounded-md bg-brand px-7 text-[20px] font-bold text-white no-underline shadow-[inset_0_-3px_0_rgb(0_0_0/0.22)] transition-colors hover:bg-brand-hover"
          >
            Start now
            <svg aria-hidden="true" viewBox="0 0 33 40" className="h-5 w-4" fill="currentColor">
              <path d="M0 0h13l20 20-20 20H0l20-20z" />
            </svg>
          </Link>

          <h2 className="mt-14 text-[24px] font-bold">Before you start</h2>
          <p className="mt-3 text-[19px] leading-relaxed text-ink-2">
            Each graduate answers once, using their own email address. Your answers are personal data under the
            Data Privacy Act of 2012 (RA 10173). Only the college's MIS office sees them, and reports show totals,
            never names.{" "}
            <Link to="/privacy" className="text-link">
              Read the privacy notice
            </Link>
            .
          </p>
        </div>

        <aside aria-labelledby="related" className="border-t-4 border-brand pt-4 lg:mt-2 lg:self-start">
          <h2 id="related" className="text-[19px] font-bold">
            Questions about the survey
          </h2>
          <p className="mt-2 text-[16px] text-ink-2">
            Contact the MIS office of ISPSC Sta. Maria campus. Graduates of other ISPSC campuses answer their own
            campus's survey.
          </p>
          <h2 className="mt-6 text-[19px] font-bold">College staff</h2>
          <p className="mt-1 text-[16px]">
            <Link to="/admin/login" className="text-link inline-flex min-h-11 items-center">
              Sign in to the admin
            </Link>
          </p>
        </aside>
      </div>
    </SiteLayout>
  );
}
