/**
 * Provider of the admin authentication state.
 *
 * @remarks
 * The session token lives in an `HttpOnly` cookie that page scripts cannot read,
 * so this provider asks the server instead of reading storage:
 *
 * - When the app loads, it calls `GET /auth/me` to find out if the admin is
 *   signed in (`isLoading` is `true` until the answer comes). On a sleeping free
 *   host this first call can take up to a minute.
 * - It checks again when the browser window regains focus (at most once every
 *   30 seconds), so signing out in another tab is noticed.
 * - It signs the admin out in the UI when any request is answered with `401`
 *   (the `UNAUTHORIZED_EVENT` from `http.ts`) and when the session expires.
 *
 * Only a `401` signs the admin out. If the server cannot be reached while the
 * admin is already signed in, the pages stay open and the next request shows the
 * error. If it cannot be reached on the very first check, the login page is
 * shown, where signing in reports the problem.
 *
 * Signing out removes the cookie in this browser. The server keeps no session
 * list, so a token copied earlier stays valid until it expires.
 *
 * Wrap the whole app once, outside the router. File location:
 * `src/admin/auth/AuthProvider.tsx`.
 *
 * @example
 * ```tsx
 * <AuthProvider>
 *   <RouterProvider router={router} />
 * </AuthProvider>
 * ```
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { client } from "../../api/client";
import { ApiError, UNAUTHORIZED_EVENT } from "../../api/http";
import { AuthContext, type AuthContextValue } from "./auth-context";

type Status = "loading" | "authenticated" | "anonymous";

/** The longest delay `setTimeout` accepts (about 24.8 days). */
const MAX_TIMEOUT_MS = 2_147_483_647;

/** Shortest time between two checks caused by window focus. */
const MIN_RECHECK_INTERVAL_MS = 30_000;

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>("loading");
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const lastCheckRef = useRef(0);

  const markSignedOut = useCallback(() => {
    setExpiresAt(null);
    setStatus("anonymous");
  }, []);

  /** Asks the server whether the session is still valid. */
  const checkSession = useCallback(async () => {
    lastCheckRef.current = Date.now();

    try {
      const result = await client.auth.getSession();
      setExpiresAt(result.expiresAt);
      setStatus("authenticated");
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        markSignedOut();
        return;
      }

      // The server could not be reached. Keep an existing session, but do not
      // leave the first check hanging.
      setStatus((previous) => (previous === "loading" ? "anonymous" : previous));
    }
  }, [markSignedOut]);

  const login = useCallback(async (username: string, password: string) => {
    const result = await client.auth.login(username, password);

    lastCheckRef.current = Date.now();
    setExpiresAt(Date.now() + result.expiresIn * 1000);
    setStatus("authenticated");
  }, []);

  const logout = useCallback(async () => {
    try {
      await client.auth.logout();
    } catch {
      // Even if the server cannot be reached, leave the admin pages.
    }

    markSignedOut();
  }, [markSignedOut]);

  // Find out if the admin is already signed in when the app loads.
  useEffect(() => {
    void checkSession();
  }, [checkSession]);

  // Sign out in the UI when any request is answered with 401.
  useEffect(() => {
    window.addEventListener(UNAUTHORIZED_EVENT, markSignedOut);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, markSignedOut);
  }, [markSignedOut]);

  // Check again when the window regains focus (for example after a sign-out in
  // another tab).
  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }

    const handleFocus = () => {
      if (Date.now() - lastCheckRef.current >= MIN_RECHECK_INTERVAL_MS) {
        void checkSession();
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [status, checkSession]);

  // Sign out at the moment the session expires.
  useEffect(() => {
    if (expiresAt === null) {
      return;
    }

    const delay = Math.min(expiresAt - Date.now(), MAX_TIMEOUT_MS);
    const timer = window.setTimeout(markSignedOut, Math.max(delay, 0));

    return () => window.clearTimeout(timer);
  }, [expiresAt, markSignedOut]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: status === "authenticated",
      isLoading: status === "loading",
      login,
      logout,
    }),
    [status, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}