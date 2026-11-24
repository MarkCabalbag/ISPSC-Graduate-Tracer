import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import type { Location } from "react-router-dom";
import { ApiError } from "../api/http";
import { ADMIN_HOME_PATH, useAuth } from "./auth/auth-context";
import { Button, ErrorSummary, PasswordField, Spinner, TextField, type SummaryError } from "../components/kit";
import seal from "../assets/seal-96.webp";
import campus640 from "../assets/campus-aerial-640.jpg";
import campus971 from "../assets/campus-aerial-971.jpg";

const isPreview = import.meta.env.VITE_MOCK_API === "true";

/**
 * The sign-in frame: the campus from the air beside the form on wide screens,
 * a photo band above the form below `lg`. Used for the session check too, so nothing jumps.
 */
function LoginShell({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-svh grid-rows-[auto_1fr] bg-white lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)] lg:grid-rows-none">
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-gold px-4 py-2 font-semibold text-ink focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        Skip to main content
      </a>

      <div className="relative h-[196px] overflow-hidden bg-[#2b3a2c] sm:h-[240px] lg:h-auto">
        <img
          src={campus971}
          srcSet={`${campus640} 640w, ${campus971} 971w`}
          sizes="(min-width: 1024px) 46vw, 100vw"
          width={971}
          height={1157}
          alt="Aerial view of the ISPSC Sta. Maria campus"
          decoding="async"
          fetchPriority="high"
          className="photo-settle absolute inset-0 size-full object-cover object-[50%_30%] lg:object-[50%_40%]"
        />
        {/* legibility scrim behind the name (the one gradient DESIGN.md allows) */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(to_top,rgb(17_24_39/0.88)_0%,rgb(17_24_39/0.55)_55%,rgb(17_24_39/0.2)_100%)] lg:bg-[linear-gradient(to_top,rgb(17_24_39/0.82)_0%,rgb(17_24_39/0.35)_34%,rgb(17_24_39/0)_58%)]"
        />
        <div className="absolute inset-x-4 bottom-4 grid gap-1.5 text-white sm:inset-x-8 sm:bottom-6 lg:inset-x-12 lg:bottom-11 lg:gap-3.5">
          <p className="flex items-center gap-3 text-[15px] text-[#e5e7eb]">
            <img src={seal} alt="" width={44} height={44} className="size-9 rounded-full bg-white lg:size-11" />
            Ilocos Sur Polytechnic State College
          </p>
          <p className="text-[28px] leading-[1.05] font-bold tracking-[-0.02em] lg:text-[40px]">Graduate Tracer</p>
          <p className="hidden text-[16px] text-[#d1d5db] lg:block">Sta. Maria campus · MIS office</p>
        </div>
      </div>

      <div className="grid min-w-0 grid-rows-[auto_1fr_auto] px-4 pb-6 sm:px-8 lg:px-14 lg:pt-4 lg:pb-7">
        <div className="flex lg:justify-end">
          <Link
            to="/"
            className="inline-flex min-h-11 items-center gap-1.5 text-[15px] font-semibold text-ink-2 no-underline hover:text-ink hover:underline"
          >
            <svg aria-hidden="true" viewBox="0 0 10 10" className="size-2.5">
              <path d="M6.5 1.5 3 5l3.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Go to the graduate survey
          </Link>
        </div>
        <main
          id="main"
          tabIndex={-1}
          className="grid content-start py-2 pb-8 outline-none lg:content-center lg:justify-items-center lg:py-6"
        >
          <div className="grid w-full max-w-[400px] gap-7">{children}</div>
        </main>
        <p className="text-[14px] text-faint lg:text-center">Ilocos Sur Polytechnic State College · Sta. Maria campus</p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const { isAuthenticated, isLoading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ username?: string; password?: string; form?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const summaryRef = useRef<HTMLDivElement>(null);

  const from = (location.state as { from?: Location } | null)?.from?.pathname ?? ADMIN_HOME_PATH;

  useEffect(() => {
    document.title = "Sign in – ISPSC Graduate Tracer";
  }, []);

  if (isLoading) {
    return (
      <LoginShell>
        <p className="flex items-center gap-2 text-muted-foreground" role="status">
          <Spinner /> Checking your session
        </p>
      </LoginShell>
    );
  }
  if (isAuthenticated) return <Navigate to={from} replace />;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const found: typeof errors = {};
    if (username.trim() === "") found.username = "Enter your username";
    if (password === "") found.password = "Enter your password";
    if (found.username || found.password) {
      setErrors(found);
      requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      await login(username.trim(), password);
      navigate(from, { replace: true });
    } catch (caught) {
      setErrors({
        form:
          caught instanceof ApiError && caught.status === 401
            ? "The username or password is not correct"
            : caught instanceof ApiError && caught.status === 429
              ? "Too many attempts. Wait 15 minutes, then try again"
              : caught instanceof ApiError
                ? caught.message
                : "Cannot reach the server. Check your connection and try again",
      });
      requestAnimationFrame(() => summaryRef.current?.focus());
    } finally {
      setSubmitting(false);
    }
  };

  const summary: SummaryError[] = [
    ...(errors.form ? [{ href: "#username", text: errors.form }] : []),
    ...(errors.username ? [{ href: "#username", text: errors.username }] : []),
    ...(errors.password ? [{ href: "#password", text: errors.password }] : []),
  ];

  return (
    <LoginShell>
      <form onSubmit={handleSubmit} noValidate className="grid gap-6">
        {summary.length > 0 && <ErrorSummary ref={summaryRef} errors={summary} />}
        <div className="grid gap-2">
          <h1 className="text-[30px] leading-tight font-bold tracking-[-0.02em] sm:text-[32px]">Sign in</h1>
          <p className="text-[17px] text-ink-2">For the MIS office of ISPSC Sta. Maria campus.</p>
        </div>
        {isPreview && (
          <p className="border-l-[6px] border-gold bg-gold-50 px-4 py-3 text-[15px] text-gold-ink">
            Preview with sample data. Sign in with <b>admin</b> and <b>preview</b>.
          </p>
        )}
        <TextField
          id="username"
          label="Username"
          autoComplete="username"
          spellCheck={false}
          autoCapitalize="none"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          error={errors.username}
        />
        <PasswordField
          id="password"
          label="Password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
        />
        <Button type="submit" variant="primary" size="lg" full loading={submitting}>
          Sign in
        </Button>
      </form>
      <p className="text-[15px] text-muted-foreground">
        This area holds graduates' personal data, protected under the Data Privacy Act of 2012 (RA 10173).{" "}
        <Link to="/privacy" className="text-link">
          Privacy notice
        </Link>
      </p>
    </LoginShell>
  );
}
