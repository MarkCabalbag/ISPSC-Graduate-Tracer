import { useEffect, useRef, useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import type { Location } from "react-router-dom";
import { ApiError } from "../api/http";
import { ADMIN_HOME_PATH, useAuth } from "./auth/auth-context";
import { Button, ErrorSummary, Spinner, TextField, type SummaryError } from "../components/kit";
import SiteLayout from "../site/SiteLayout";

const isPreview = import.meta.env.VITE_MOCK_API === "true";

export default function LoginPage() {
  const { isAuthenticated, isLoading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ username?: string; password?: string; form?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const summaryRef = useRef<HTMLDivElement>(null);

  const from = (location.state as { from?: Location } | null)?.from?.pathname ?? ADMIN_HOME_PATH;

  useEffect(() => {
    document.title = "Sign in – ISPSC Graduate Tracer";
  }, []);

  if (isLoading) {
    return (
      <SiteLayout>
        <p className="flex items-center gap-2 text-muted-foreground" role="status">
          <Spinner /> Checking your session
        </p>
      </SiteLayout>
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
    <SiteLayout>
      <div className="max-w-[460px]">
        <form onSubmit={handleSubmit} noValidate className="grid gap-7">
          {summary.length > 0 && <ErrorSummary ref={summaryRef} errors={summary} />}
          <div className="grid gap-2">
            <h1 className="text-[32px] leading-tight font-bold tracking-[-0.02em] sm:text-[40px]">Sign in</h1>
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
          <div className="grid gap-2">
            <TextField
              id="password"
              label="Password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
            />
            <label className="flex w-fit cursor-pointer items-center gap-2 text-[15px] text-ink-2">
              <input
                type="checkbox"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
                className="size-5 accent-ink"
              />
              Show password
            </label>
          </div>
          <div>
            <Button type="submit" variant="primary" size="lg" loading={submitting}>
              Sign in
            </Button>
          </div>
        </form>
      </div>
    </SiteLayout>
  );
}
