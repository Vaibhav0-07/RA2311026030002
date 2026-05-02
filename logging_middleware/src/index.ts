/**
 * @module logging-middleware
 *
 * A reusable logging package that ships structured log events to the
 * centralised evaluation logging server.
 *
 * import { createLogger } from "logging-middleware";
 *
 * const { Log } = createLogger({ authToken: process.env.LOG_AUTH_TOKEN });
 *
 * // In a backend service:
 * await Log("backend", "info",  "service",    "User onboarding flow started – userId: 42");
 * await Log("backend", "error", "handler",    "Received string, expected bool for field 'active'");
 * await Log("backend", "fatal", "db",         "Critical database connection failure – retries exhausted");
 * await Log("backend", "warn",  "cache",      "Cache miss rate above 80 % – consider warming strategy");
 * await Log("backend", "debug", "repository", "Querying users table with filter: { role: 'admin' }");
 *
 * // In a frontend app:
 * await Log("frontend", "info",  "page",      "Dashboard page mounted – rendered 32 rows");
 * await Log("frontend", "error", "api",       "POST /orders failed – status 422, body: { error: 'qty < 1' }");
 * await Log("frontend", "warn",  "state",     "Cart state reset without user confirmation");
 *
 * // Shared packages work everywhere:
 * await Log("backend",  "info",  "auth",      "JWT verified successfully – sub: user_7f3a");
 * await Log("frontend", "warn",  "utils",     "formatCurrency received null – falling back to 0");
 */

export { Logger, createLogger } from "./logger";
export type {
  Stack,
  Level,
  Package,
  BackendPackage,
  FrontendPackage,
  SharedPackage,
  LogRequest,
  LogResponse,
  LoggerConfig,
} from "./types";
