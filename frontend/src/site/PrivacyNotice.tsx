import { Link } from "react-router-dom";
import SiteLayout, { BackLink } from "./SiteLayout";

/** The survey's data privacy notice (RA 10173), also shown in short on the survey's first page. */
export const PrivacyPoints = () => (
  <dl className="grid gap-4 text-[17px]">
    <div>
      <dt className="font-bold">What we collect</dt>
      <dd className="mt-1 text-ink-2">
        Your name, email, year of graduation, college, program and major, and your answers about work and
        further studies.
      </dd>
    </div>
    <div>
      <dt className="font-bold">Why</dt>
      <dd className="mt-1 text-ink-2">
        To count how many graduates are employed and in jobs related to their course, for the college's report to
        CHED and to improve its programs.
      </dd>
    </div>
    <div>
      <dt className="font-bold">Who sees it</dt>
      <dd className="mt-1 text-ink-2">
        Only the MIS office of ISPSC Sta. Maria campus. Reports show totals by program and year, never your name.
      </dd>
    </div>
    <div>
      <dt className="font-bold">Your rights</dt>
      <dd className="mt-1 text-ink-2">
        Under the Data Privacy Act of 2012 (RA 10173) you can ask the MIS office to show, correct or delete your
        answers.
      </dd>
    </div>
  </dl>
);

export default function PrivacyNotice() {
  return (
    <SiteLayout>
      <div className="max-w-[640px]">
        <BackLink to="/" />
        <h1 className="text-[32px] leading-tight font-bold tracking-[-0.02em] sm:text-[40px]">Privacy notice</h1>
        <p className="mt-4 text-[19px] text-ink-2">How the graduate tracer survey uses your personal data.</p>
        <div className="mt-8">
          <PrivacyPoints />
        </div>
        <p className="mt-10 text-[17px]">
          <Link to="/survey" className="text-link">
            Go to the survey
          </Link>
        </p>
      </div>
    </SiteLayout>
  );
}
