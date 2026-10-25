/**
 * Admin authentication context.
 *
 * @remarks
 * Holds the shape of the auth state and the `useAuth` hook. The provider that
 * fills it is in `AuthProvider.tsx`.
 *
 * Put this file at `src/admin/auth/auth-context.ts`.
 */

import { createContext, useContext } from "react";

/** Where the admin is sent to sign in. Change it if your route is different. */
export const ADMIN_LOGIN_PATH = "/admin/login";

/** Where the admin lands after signing in, when there is no earlier page. */
export const ADMIN_HOME_PATH = "/admin";

/** What `useAuth` returns. */
export type AuthContextValue = {
  /** `true` while the server accepts the admin's session. */
  isAuthenticated: boolean;
  /**
   * `true` until the first check with the server is done. The session cookie
   * cannot be read by the page, so the server has to be asked. Show nothing, or
   * a loading message, instead of redirecting while this is `true`.
   */
  isLoading: boolean;
  /**
   * Signs the admin in.
   * @throws `ApiError` with the server's message when the sign-in fails.
   */
  login: (username: string, password: string) => Promise<void>;
  /** Signs the admin out. */
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Gives access to the admin auth state.
 *
 * @returns The auth state and its actions.
 * @throws If it is used outside `AuthProvider`.
 *
 * @example
 * ```tsx
 * const { isAuthenticated, logout } = useAuth();
 * ```
 */
export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }

  return context;
};