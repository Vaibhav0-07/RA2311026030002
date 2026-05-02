"use strict";
/**
 * @module logging-middleware
 *
 * This is a reusable logging package that ships structured log events to the
 * centralised evaluation logging server.
 *
 * Quick start
 * ───────────
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
Object.defineProperty(exports, "__esModule", { value: true });
export const createLogger = exports.Logger = void 0;
import { Logger, createLogger } from "./logger";
Object.defineProperty(exports, "Logger", { enumerable: true, get: function () { return Logger; } });
Object.defineProperty(exports, "createLogger", { enumerable: true, get: function () { return createLogger; } });
//# sourceMappingURL=index.js.map