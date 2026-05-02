// ─── Allowed Values (lowercase only, per API constraints) ─────────────────────

export type Stack = "backend" | "frontend";

export type Level = "debug" | "info" | "warn" | "error" | "fatal";

// Backend-only packages
export type BackendPackage =
  | "cache"
  | "controller"
  | "cron_job"
  | "db"
  | "domain"
  | "handler"
  | "repository"
  | "route"
  | "service";

// Frontend-only packages
export type FrontendPackage =
  | "api"
  | "component"
  | "hook"
  | "page"
  | "state"
  | "style";

// Shared packages (usable by both backend and frontend)
export type SharedPackage = "auth" | "config" | "middleware" | "utils";

export type Package = BackendPackage | FrontendPackage | SharedPackage;

//API Request / Response Shapes

export interface LogRequest {
  stack: Stack;
  level: Level;
  package: Package;
  message: string;
}

export interface LogResponse {
  logID: string;
  message: string;
}

//Logger Configuration

export interface LoggerConfig {
  /** Base URL of the logging server. Defaults to the evaluation server. */
  baseUrl?: string;
  /** Bearer token for the protected /logs route. */
  authToken?: string;
  /**
   * If true, failed log calls throw; otherwise they are silently swallowed
   * so that logging never crashes the application. Default: false.
   */
  throwOnError?: boolean;
}
