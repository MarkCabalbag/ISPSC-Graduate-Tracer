/**
 * Server entry point: starts the Express app from `app.ts` on `PORT`.
 *
 * @remarks
 * `PORT` defaults to `7000` when it is missing or not a valid port number. The
 * app itself (middleware and routes) lives in `app.ts` so tests can use it
 * without opening a port.
 */

import app from "./app.js";

/** Port used when `PORT` is not set or is not valid. */
const DEFAULT_PORT = 7000;

/**
 * Reads the port from the environment.
 *
 * @param value - The raw `PORT` value, for example `"5000"`.
 * @returns The port, or `DEFAULT_PORT` if it is missing or not a whole number
 * from 1 to 65535.
 */
const parsePort = (value: string | undefined): number => {
  if (!value || !/^\d+$/.test(value)) {
    return DEFAULT_PORT;
  }

  const port = Number(value);
  return port >= 1 && port <= 65535 ? port : DEFAULT_PORT;
};

const port = parsePort(process.env.PORT);

app.listen(port, () => {
  console.log(`App is running on port: ${port}`);
});