import axios, { AxiosInstance } from "axios";
import {
  Stack,
  Level,
  Package,
  LogRequest,
  LogResponse,
  LoggerConfig,
} from "./types";

//Constants

const DEFAULT_BASE_URL = "http://20.207.122.201";
const LOG_ENDPOINT = "/evaluation-service/logs";

const VALID_STACKS: Stack[] = ["backend", "frontend"];
const VALID_LEVELS: Level[] = ["debug", "info", "warn", "error", "fatal"];
const VALID_PACKAGES: Package[] = [
  // Backend-only
  "cache", "controller", "cron_job", "db", "domain",
  "handler", "repository", "route", "service",
  // Frontend-only
  "api", "component", "hook", "page", "state", "style",
  // Shared
  "auth", "config", "middleware", "utils",
];

//Validation Helpers

function validateParams(
  stack: string,
  level: string,
  pkg: string,
  message: string
): void {
  if (!VALID_STACKS.includes(stack as Stack)) {
    throw new Error(
      `Invalid stack "${stack}". Allowed values: ${VALID_STACKS.join(", ")}`
    );
  }
  if (!VALID_LEVELS.includes(level as Level)) {
    throw new Error(
      `Invalid level "${level}". Allowed values: ${VALID_LEVELS.join(", ")}`
    );
  }
  if (!VALID_PACKAGES.includes(pkg as Package)) {
    throw new Error(
      `Invalid package "${pkg}". Allowed values: ${VALID_PACKAGES.join(", ")}`
    );
  }
  if (!message || message.trim().length === 0) {
    throw new Error("Log message must not be empty.");
  }
}

//Logger Class

export class Logger {
  private readonly client: AxiosInstance;
  private readonly throwOnError: boolean;

  constructor(config: LoggerConfig = {}) {
    const baseUrl = config.baseUrl ?? DEFAULT_BASE_URL;
    this.throwOnError = config.throwOnError ?? false;

    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        "Content-Type": "application/json",
        ...(config.authToken
          ? { Authorization: `Bearer ${config.authToken}` }
          : {}),
      },
      timeout: 5000,
    });
  }

  /**
   * Send a structured log entry to the evaluation logging server.
   *
   * @param stack   - Origin of the log: "backend" | "frontend"
   * @param level   - Severity: "debug" | "info" | "warn" | "error" | "fatal"
   * @param pkg     - Package/module producing the log (must match allowed list)
   * @param message - Human-readable description of the event
   *
   * @example
   * await logger.Log("backend", "error", "handler", "received string, expected bool");
   * await logger.Log("backend", "fatal", "db", "Critical database connection failure.");
   */
  async Log(
    stack: Stack,
    level: Level,
    pkg: Package,
    message: string
  ): Promise<LogResponse | null> {
    //Validate inputs before hitting the network
    try {
      validateParams(stack, level, pkg, message);
    } catch (validationError) {
      const err = validationError as Error;
      console.error(`[Logger] Validation error: ${err.message}`);
      if (this.throwOnError) throw validationError;
      return null;
    }

    const body: LogRequest = {
      stack,
      level,
      package: pkg,
      message,
    };

    //POST to the log API
    try {
      const response = await this.client.post<LogResponse>(LOG_ENDPOINT, body);
      return response.data;
    } catch (networkError) {
      if (axios.isAxiosError(networkError)) {
        const status = networkError.response?.status;
        const detail = networkError.response?.data ?? networkError.message;
        console.error(`[Logger] HTTP ${status ?? "network"} error:`, detail);
      } else {
        console.error("[Logger] Unexpected error:", networkError);
      }
      if (this.throwOnError) throw networkError;
      return null;
    }
  }
}

//Standalone convenience factory

/**
 * Create and configure a Logger instance.
 *
 * @example
 * const { Log } = createLogger({ authToken: process.env.LOG_AUTH_TOKEN });
 * await Log("backend", "info", "service", "User signup completed successfully");
 */
export function createLogger(config: LoggerConfig = {}): {
  Log: Logger["Log"];
  logger: Logger;
} {
  const logger = new Logger(config);
  return {
    Log: logger.Log.bind(logger),
    logger,
  };
}
