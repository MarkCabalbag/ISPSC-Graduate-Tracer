import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import seal from "../assets/seal-96.webp";
import { Chip } from "../components/kit";

const isPreview = import.meta.env.VITE_MOCK_API === "true";

/** The public service frame (GOV.UK pattern): a header with the service name, one column, a footer. */
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col bg-white">
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-gold px-4 py-2 font-semibold text-ink focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        Skip to main content
      </a>
      <header className="border-b-[6px] border-brand bg-ink text-white">
        <div className="mx-auto flex min-h-16 w-[min(100%-32px,1040px)] flex-wrap items-center gap-x-6 gap-y-2 py-2.5">
          <Link to="/" className="flex items-center gap-3 text-white no-underline hover:underline">
            <img src={seal} alt="" width={36} height={36} className="size-9 rounded-full bg-white" />
            <span className="grid leading-tight">
              <span className="text-[13px] text-[#d1d5db]">Ilocos Sur Polytechnic State College</span>
              <span className="text-[19px] font-bold">Graduate Tracer</span>
            </span>
          </Link>
          {isPreview && (
            <span className="ml-auto">
              <Chip>Sample data</Chip>
            </span>
          )}
        </div>
      </header>
      <main id="main" tabIndex={-1} className="mx-auto w-[min(100%-32px,1040px)] flex-1 pt-8 pb-20 outline-none sm:pt-10">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}

/** The public footer: service line, privacy and staff links, and an optional photo credit. */
export function SiteFooter({ credit }: { credit?: ReactNode }) {
  return (
    <footer className="border-t border-line bg-band">
      <div className="mx-auto grid w-[min(100%-32px,1040px)] gap-3 py-8 text-[15px] text-muted-foreground">
        <div className="grid gap-3 sm:flex sm:items-center sm:justify-between">
          <p>Ilocos Sur Polytechnic State College · Sta. Maria campus · MIS office</p>
          <ul className="flex flex-wrap gap-x-5 gap-y-1">
            <li>
              <Link className="inline-flex min-h-11 items-center text-ink-2 underline underline-offset-2 hover:text-ink" to="/privacy">
                Privacy notice
              </Link>
            </li>
            <li>
              <Link className="inline-flex min-h-11 items-center text-ink-2 underline underline-offset-2 hover:text-ink" to="/admin/login">
                Staff sign-in
              </Link>
            </li>
          </ul>
        </div>
        {credit && <p className="text-[13px] text-faint">{credit}</p>}
      </div>
    </footer>
  );
}

/** "Back" link at the top of a question page. */
export const BackLink = ({ to, onClick }: { to?: string; onClick?: () => void }) =>
  onClick ? (
    <button type="button" onClick={onClick} className="mb-6 inline-flex items-center gap-1.5 text-[16px] text-ink underline underline-offset-2">
      <svg aria-hidden="true" viewBox="0 0 10 10" className="size-2.5"><path d="M6.5 1.5 3 5l3.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
      Back
    </button>
  ) : (
    <Link to={to ?? "/"} className="mb-6 inline-flex items-center gap-1.5 text-[16px] text-ink underline underline-offset-2">
      <svg aria-hidden="true" viewBox="0 0 10 10" className="size-2.5"><path d="M6.5 1.5 3 5l3.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
      Back
    </Link>
  );
