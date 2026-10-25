/**
 * HTTP core of the Graduate Tracer frontend.
 *
 * @remarks
 * Every request to the API goes through `request` (or the `http` shortcuts), so
 * the rules below are written once and apply everywhere.
 *
 * **File location:** `src/api/http.ts`. The endpoints themselves are in
 * `src/api/client.ts`.
 *
 * **What every request does**
 *
 * - Goes to `API_BASE_URL` (see below).
 * - Sends the admin session cookie (`credentials: "include"`). The cookie is
 *   `HttpOnly`, so this code never sees the token and a script injected into
 *   the page cannot steal it.
 * - Adds `X-Requested-With: XMLHttpRequest` to every request that is not `GET`.
 *   The server requires it on admin routes as protection against cross-site
 *   request forgery (CSRF).
 * - Stops waiting after `REQUEST_TIMEOUT_MS` and throws a clear error.
 * - Retries a failed read (see "Retries") instead of failing on the first
 *   network hiccup.
 * - Throws `ApiError` with the server's own message when the answer is not
 *   `2xx`, so screens can show it directly.
 * - Fires `UNAUTHORIZED_EVENT` when the server answers `401` to a request that
 *   needs an admin session, so `AuthProvider` can sign the admin out.
 *
 * **Base address**
 *
 * Read at build time from `VITE_API_URL`. When it is not set, the address
 * depends on the mode: the live address in a production build, and
 * `http://localhost:8080/api/graduateTracer` in development. Vite copies
 * `VITE_` variables into the bundle when it builds, so after changing
 * `VITE_API_URL` on your host you must rebuild and redeploy the frontend.
 *
 * A relative value such as `/api/graduateTracer` also works. Use it when the
 * frontend host forwards `/api` to the backend (see "Cookies and domains" in
 * `client.ts`).
 *
 * **Retries**
 *
 * Only requests that are safe to repeat are retried, at most twice, with a short
 * growing pause: reads (`GET`) and requests marked `idempotent: true`. They are
 * retried when the network fails or the server answers `502`, `503` or `504`
 * (a host that is waking up or restarting). Requests that change data are never
 * retried, because a repeated survey submission would send a second email and a
 * repeated delete could remove the wrong record. A timeout is not retried.
 *
 * **Slow first request on free hosting**
 *
 * Free Render services go to sleep when unused, and the first request can take
 * 30 to 60 seconds. `REQUEST_TIMEOUT_MS` is set to 45 seconds so that wake-up
 * does not look like a failure. Show a loading state, not an error, while a
 * request is running.
 *
 * @packageDocumentation
 */

/* -------------------------------------------------------------------------- */
/*                                  Constants                                 */
/* -------------------------------------------------------------------------- */

/** Address used when `VITE_API_URL` is not set. */
const DEFAULT_API_URL = import.meta.env.PROD
  ? "https://ispsc-graduate-tracer.onrender.com/api/graduateTracer"
  : "http://localhost:8080/api/graduateTracer";

/** Base address of the API, without a trailing slash. */
export const API_BASE_URL = (
  (import.meta.env.VITE_API_URL as string | undefined)?.trim() ||
  DEFAULT_API_URL
).replace(/\/+$/, "");

/** Name of the browser event fired when the server rejects the admin session. */
export const UNAUTHORIZED_EVENT = "admin:unauthorized";

/** How long to wait for one answer, in milliseconds. */
const REQUEST_TIMEOUT_MS = 45_000;

/** How many times a repeatable request is retried after the first attempt. */
const MAX_RETRIES = 2;

/** Pause before the first retry, in milliseconds. It grows with each retry. */
const RETRY_DELAY_MS = 1_500;

/** Server answers that mean "try again in a moment". */
const RETRYABLE_STATUS = new Set([502, 503, 504]);

/** Message shown when the server cannot be reached. */
const NETWORK_MESSAGE =
  "Cannot reach the server. Please check your connection and try again.";

/** Message shown when the server takes too long to answer. */
const TIMEOUT_MESSAGE =
  "The server took too long to answer. Please try again in a moment.";

/* -------------------------------------------------------------------------- */
/*                                    Types                                   */
/* -------------------------------------------------------------------------- */

/** Why a request failed. */
export type ApiErrorCode = "http" | "network" | "timeout";

/**
 * Error thrown for every request that did not succeed.
 *
 * @remarks
 * `message` is safe to show to the user: it is the server's own message when
 * there is one, and a general sentence otherwise.
 */
export class ApiError extends Error {
  /** HTTP status code, or `0` when no answer arrived (network error, timeout). */
  readonly status: number;

  /** `"http"` for a server answer, `"network"` or `"timeout"` for no answer. */
  readonly code: ApiErrorCode;

  constructor(status: number, message: string, code: ApiErrorCode = "http") {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

/** Options of `request`. */
export type RequestOptions = {
  method?: "GET" | "POST" | "DELETE";
  /** Sent as JSON. */
  body?: unknown;
  /**
   * `true` (default) when the request needs an admin session: a `401` answer
   * then means the admin was signed out. Use `false` for public requests and
   * for login and logout, where a `401` is a normal answer (wrong password).
   */
  auth?: boolean;
  /**
   * `true` when repeating the request is harmless. Defaults to `true` for `GET`
   * and `false` for everything else. Some read-only endpoints in this API use
   * `POST`; mark those `true`.
   */
  idempotent?: boolean;
  /** Lets the caller cancel the request, for example when a page is left. */
  signal?: AbortSignal;
  /** Overrides `REQUEST_TIMEOUT_MS` for this request. */
  timeoutMs?: number;
};

/** What one attempt produced. */
type Answer = {
  ok: boolean;
  status: number;
  payload: unknown;
};

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

/**
 * Makes a value safe to put inside a URL path.
 *
 * @remarks
 * Program names can contain spaces or slashes, for example `BS Information
 * Technology`. Always build paths with this function.
 *
 * @param value - An id, year or name.
 * @returns The encoded text.
 */
export const segment = (value: string | number): string =>
  encodeURIComponent(String(value));

/**
 * Parses the body of an answer.
 *
 * @param text - The raw body.
 * @returns The parsed JSON, or `null` if the body is empty or is not JSON (for
 * example an HTML error page from a proxy).
 */
const parseJson = (text: string): unknown => {
  if (text === "") {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

/**
 * Chooses the message of a failed answer.
 *
 * @param payload - The parsed JSON of the answer, if any.
 * @param status - The HTTP status code.
 * @returns The server's `message`, or a general sentence for the status.
 */
const readMessage = (payload: unknown, status: number): string => {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "message" in payload &&
    typeof payload.message === "string" &&
    payload.message !== ""
  ) {
    return payload.message;
  }

  if (status === 429) {
    return "Too many requests. Please wait a moment and try again.";
  }

  if (status >= 500) {
    return "The server had a problem. Please try again later.";
  }

  return "Something went wrong. Please try again.";
};

/** Waits for a number of milliseconds. */
const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => window.setTimeout(resolve, ms));

/**
 * Runs one attempt: sends the request and reads the whole answer, all inside
 * the time limit.
 *
 * @throws `ApiError` with code `"network"` or `"timeout"` when no answer
 * arrives. If the caller cancelled with its own signal, the original abort error
 * is rethrown unchanged.
 */
const attempt = async (
  url: string,
  init: RequestInit,
  timeoutMs: number,
  callerSignal: AbortSignal | undefined,
): Promise<Answer> => {
  const controller = new AbortController();
  let timedOut = false;

  const timer = window.setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  const forwardAbort = () => controller.abort();
  callerSignal?.addEventListener("abort", forwardAbort, { once: true });
  if (callerSignal?.aborted) {
    controller.abort();
  }

  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    const text = await response.text();

    return {
      ok: response.ok,
      status: response.status,
      payload: parseJson(text),
    };
  } catch (error) {
    if (callerSignal?.aborted) {
      throw error;
    }

    if (timedOut) {
      throw new ApiError(0, TIMEOUT_MESSAGE, "timeout");
    }

    throw new ApiError(0, NETWORK_MESSAGE, "network");
  } finally {
    window.clearTimeout(timer);
    callerSignal?.removeEventListener("abort", forwardAbort);
  }
};

/* -------------------------------------------------------------------------- */
/*                                   Request                                  */
/* -------------------------------------------------------------------------- */

/**
 * Sends a request to the API and returns the parsed JSON answer.
 *
 * @param path - Path after the base address, starting with `/`, for example
 * `"/admin/getAllData"`. Build dynamic parts with `segment`.
 * @param options - Method, body and behavior flags.
 * @returns The parsed JSON of the answer.
 * @throws `ApiError` for every failure (see `ApiError.code`). A request that the
 * caller cancelled throws the browser's `AbortError` instead, which screens
 * should ignore.
 *
 * @example
 * ```ts
 * try {
 *   const rows = await request<ProgramSummary[]>("/admin/getAllData");
 * } catch (error) {
 *   setMessage(error instanceof ApiError ? error.message : "Unexpected error");
 * }
 * ```
 */
export const request = async <T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> => {
  const {
    method = "GET",
    body,
    auth = true,
    signal,
    timeoutMs = REQUEST_TIMEOUT_MS,
  } = options;
  const idempotent = options.idempotent ?? method === "GET";

  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (method !== "GET") {
    headers["X-Requested-With"] = "XMLHttpRequest";
  }

  const init: RequestInit = {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    credentials: "include",
  };

  const url = `${API_BASE_URL}${path}`;
  const maxAttempts = idempotent ? MAX_RETRIES + 1 : 1;

  for (let attemptNumber = 1; ; attemptNumber += 1) {
    let answer: Answer;

    try {
      answer = await attempt(url, init, timeoutMs, signal);
    } catch (error) {
      const canRetry =
        error instanceof ApiError &&
        error.code === "network" &&
        attemptNumber < maxAttempts;

      if (!canRetry) {
        throw error;
      }

      await sleep(RETRY_DELAY_MS * attemptNumber);
      continue;
    }

    if (answer.ok) {
      return answer.payload as T;
    }

    if (RETRYABLE_STATUS.has(answer.status) && attemptNumber < maxAttempts) {
      await sleep(RETRY_DELAY_MS * attemptNumber);
      continue;
    }

    if (answer.status === 401 && auth) {
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }

    throw new ApiError(answer.status, readMessage(answer.payload, answer.status));
  }
};

/** Shortcuts for `request`. */
export const http = {
  get: <T>(path: string, options?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...options, method: "GET" }),

  post: <T>(
    path: string,
    body?: unknown,
    options?: Omit<RequestOptions, "method" | "body">,
  ) => request<T>(path, { ...options, method: "POST", body }),

  delete: <T>(path: string, options?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...options, method: "DELETE" }),
};