"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
exports.createLogger = createLogger;
const axios_1 = __importDefault(require("axios"));
//Constants
const DEFAULT_BASE_URL = "http://20.207.122.201";
const LOG_ENDPOINT = "/evaluation-service/logs";
const VALID_STACKS = ["backend", "frontend"];
const VALID_LEVELS = ["debug", "info", "warn", "error", "fatal"];
const VALID_PACKAGES = [
    // Backend-only
    "cache", "controller", "cron_job", "db", "domain",
    "handler", "repository", "route", "service",
    // Frontend-only
    "api", "component", "hook", "page", "state", "style",
    // Shared
    "auth", "config", "middleware", "utils",
];
//Validation Helpers
function validateParams(stack, level, pkg, message) {
    if (!VALID_STACKS.includes(stack)) {
        throw new Error(`Invalid stack "${stack}". Allowed values: ${VALID_STACKS.join(", ")}`);
    }
    if (!VALID_LEVELS.includes(level)) {
        throw new Error(`Invalid level "${level}". Allowed values: ${VALID_LEVELS.join(", ")}`);
    }
    if (!VALID_PACKAGES.includes(pkg)) {
        throw new Error(`Invalid package "${pkg}". Allowed values: ${VALID_PACKAGES.join(", ")}`);
    }
    if (!message || message.trim().length === 0) {
        throw new Error("Log message must not be empty.");
    }
}
//Logger Class
class Logger {
    constructor(config = {}) {
        var _a, _b;
        const baseUrl = (_a = config.baseUrl) !== null && _a !== void 0 ? _a : DEFAULT_BASE_URL;
        this.throwOnError = (_b = config.throwOnError) !== null && _b !== void 0 ? _b : false;
        this.client = axios_1.default.create({
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
    async Log(stack, level, pkg, message) {
        var _a, _b, _c;
        //Validate inputs before hitting the network
        try {
            validateParams(stack, level, pkg, message);
        }
        catch (validationError) {
            const err = validationError;
            console.error(`[Logger] Validation error: ${err.message}`);
            if (this.throwOnError)
                throw validationError;
            return null;
        }
        const body = {
            stack,
            level,
            package: pkg,
            message,
        };
        //POST to the log API
        try {
            const response = await this.client.post(LOG_ENDPOINT, body);
            return response.data;
        }
        catch (networkError) {
            if (axios_1.default.isAxiosError(networkError)) {
                const status = (_a = networkError.response) === null || _a === void 0 ? void 0 : _a.status;
                const detail = (_c = (_b = networkError.response) === null || _b === void 0 ? void 0 : _b.data) !== null && _c !== void 0 ? _c : networkError.message;
                console.error(`[Logger] HTTP ${status !== null && status !== void 0 ? status : "network"} error:`, detail);
            }
            else {
                console.error("[Logger] Unexpected error:", networkError);
            }
            if (this.throwOnError)
                throw networkError;
            return null;
        }
    }
}
exports.Logger = Logger;
//Standalone convenience factory
/**
 * Create and configure a Logger instance.
 *
 * @example
 * const { Log } = createLogger({ authToken: process.env.LOG_AUTH_TOKEN });
 * await Log("backend", "info", "service", "User signup completed successfully");
 */
function createLogger(config = {}) {
    const logger = new Logger(config);
    return {
        Log: logger.Log.bind(logger),
        logger,
    };
}
//# sourceMappingURL=logger.js.map