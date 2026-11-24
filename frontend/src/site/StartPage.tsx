import { Link } from "react-router-dom";
import seal from "../assets/seal-96.webp";
import church800 from "../assets/santa-maria-church-800.jpg";
import church1600 from "../assets/santa-maria-church-1600.jpg";
import { Chip } from "../components/kit";
import { SiteFooter } from "./SiteLayout";

const isPreview = import.meta.env.VITE_MOCK_API === "true";

/** The survey's three numbered steps, in the order the survey asks them. */
const STEPS = [
  { title: "About you", asks: "Your name, email and year of graduation" },
  { title: "Your degree", asks: "Your college, program and major" },
  { title: "Your work", asks: "Whether you are working, and whether your job is related to your course" },
];

const PHOTO_PAGE =
  "https://commons.wikimedia.org/wiki/File:Side_Facade_of_Nuestra_Senora_Dela_Asuncion_Church,_Santa_Maria,_Ilocos_Sur.jpg";

/**
 * The start page (DESIGN.md › Layout › Start page): a photo-led hero of Santa Maria's church with the title
 * and Start now, then the survey's steps, privacy and contacts on white.
 */
export default function StartPage() {
  return (
    <div className="relative flex min-h-svh flex-col bg-white">
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-gold px-4 py-2 font-semibold text-ink focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        Skip to main content
      </a>

      {/* brand row, laid over the top of the hero */}
      <header className="absolute inset-x-0 top-0 z-20">
        <div className="mx-auto flex w-[min(100%-32px,1040px)] items-center gap-3 py-5">
          <Link to="/" className="flex min-h-11 items-center gap-3 text-white no-underline">
            <img src={seal} alt="" width={36} height={36} className="size-9 rounded-full bg-white" />
            <span className="grid leading-tight">
              <span className="hidden text-[13px] text-[#d1d5db] md:block">Ilocos Sur Polytechnic State College</span>
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

      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        {/* hero */}
        <section
          aria-labelledby="start-title"
          className="relative isolate grid min-h-[560px] overflow-hidden bg-[#3b4a5a] text-white md:min-h-[640px]"
        >
          <img
            src={church1600}
            srcSet={`${church800} 800w, ${church1600} 1600w`}
            sizes="100vw"
            width={1600}
            height={901}
            alt="Nuestra Señora de la Asunción Church and its bell tower in Santa Maria, Ilocos Sur"
            fetchPriority="high"
            decoding="async"
            className="photo-settle absolute inset-0 -z-20 size-full object-cover object-[38%_50%] md:object-[50%_45%]"
          />
          <div aria-hidden="true" className="hero-scrim absolute inset-0 -z-10" />

          <div className="mx-auto w-[min(100%-32px,1040px)] self-end pt-24 pb-8 md:pb-16">
            <div className="grid max-w-[640px] gap-[18px] md:gap-[22px]">
              <h1 id="start-title" className="text-[38px] leading-[1.02] font-bold tracking-[-0.03em] md:text-[60px]">
                Graduate tracer survey
              </h1>
              <p className="max-w-[620px] text-[17px] leading-[1.55] text-[#e5e7eb] md:text-[20px]">
                Tell Ilocos Sur Polytechnic State College, Sta. Maria campus, what you have done since you graduated.
                The college reports the totals to the Commission on Higher Education (CHED) and uses them to improve
                its programs.
              </p>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
                <Link
                  to="/survey"
                  className="group inline-flex h-14 w-full items-center justify-center gap-3 rounded-md bg-brand px-7 text-[20px] font-bold text-white no-underline shadow-[inset_0_-3px_0_rgb(0_0_0/0.25)] transition-[background-color,box-shadow,transform] duration-150 hover:bg-brand-hover focus-visible:outline-gold active:translate-y-px active:shadow-none md:w-auto"
                >
                  Start now
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 33 40"
                    fill="currentColor"
                    className="h-5 w-4 transition-transform duration-200 ease-[var(--ease-out)] group-hover:translate-x-[3px]"
                  >
                    <path d="M0 0h13l20 20-20 20H0l20-20z" />
                  </svg>
                </Link>
                <p className="text-[16px] text-[#d1d5db]">About 5 minutes · Once, with your own email</p>
              </div>
            </div>
          </div>
        </section>

        {/* body */}
        <div className="mx-auto grid w-[min(100%-32px,1040px)] gap-x-18 gap-y-12 pt-9 pb-14 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] md:pt-14 md:pb-22">
          <div className="grid max-w-[660px] content-start gap-7">
            <h2 id="asked" className="text-[26px] leading-tight font-bold tracking-[-0.01em]">
              You will be asked about
            </h2>
            <ol aria-labelledby="asked" className="border-t border-line">
              {STEPS.map((step, index) => (
                <li key={step.title} className="grid grid-cols-[36px_minmax(0,1fr)] gap-4 border-b border-line py-4">
                  <span
                    aria-hidden="true"
                    className="tabular grid size-9 place-items-center rounded-full border-2 border-brand text-[16px] font-bold text-brand"
                  >
                    {index + 1}
                  </span>
                  <span>
                    <span className="block text-[18px] leading-[1.3] font-semibold">{step.title}</span>
                    <span className="mt-0.5 block text-[16px] text-ink-2">{step.asks}</span>
                  </span>
                </li>
              ))}
            </ol>
            <div className="grid gap-2.5">
              <h2 className="text-[22px] font-bold">Before you start</h2>
              <p className="text-[18px] leading-[1.6] text-ink-2">
                Each graduate answers once, using their own email address. Your answers are personal data under the
                Data Privacy Act of 2012 (RA 10173). Only the college's MIS office sees them, and reports show totals,
                never names.{" "}
                <Link to="/privacy" className="text-link">
                  Read the privacy notice
                </Link>
                .
              </p>
            </div>
          </div>

          <aside aria-labelledby="related" className="grid content-start gap-[22px] self-start border-t-4 border-brand pt-[18px]">
            <div>
              <h2 id="related" className="text-[19px] font-bold">
                Questions about the survey
              </h2>
              <p className="mt-1.5 text-[16px] text-ink-2">
                Contact the MIS office of ISPSC Sta. Maria campus. Graduates of other ISPSC campuses answer their own
                campus's survey.
              </p>
            </div>
            <div>
              <h2 className="text-[19px] font-bold">College staff</h2>
              <p className="mt-1.5 text-[16px]">
                <Link to="/admin/login" className="text-link inline-flex min-h-11 items-center">
                  Sign in to the admin
                </Link>
              </p>
            </div>
          </aside>
        </div>
      </main>

      <SiteFooter
        credit={
          <>
            Photo: Nuestra Señora de la Asunción Church, Santa Maria, by Luzviminda7641, CC0, via{" "}
            <a href={PHOTO_PAGE} className="underline underline-offset-2 hover:text-ink-2">
              Wikimedia Commons
            </a>
            .
          </>
        }
      />
    </div>
  );
}
