/**
 * examples/usage.ts
 *
 * This file is to demonstrates how to integrate the logging-middleware package
 * into both backend (Node/Express) and frontend (React/Next.js) code.
 *
 * Run with:  npx ts-node examples/usage.ts
 */

import { createLogger } from "../src";

declare const process: any;

//Initialise once, reuse everywhere

const { Log } = createLogger({
  authToken: process.env.LOG_AUTH_TOKEN, // set in your .env
  throwOnError: false,                   // never let logging crash the app
});

//  BACKEND EXAMPLES

//db layer
async function connectDatabase(): Promise<void> {
  await Log("backend", "info", "db", "Attempting to connect to PostgreSQL – host: db.prod.internal, port: 5432");

  try {
    //real DB connection logic here
    await Log("backend", "info", "db", "Database connection established successfully – pool size: 10");
  } catch (err) {
    await Log("backend", "fatal", "db", `Critical database connection failure – ${(err as Error).message}`);
    throw err;
  }
}

//service layer
async function createUser(payload: { email: string; role: string }): Promise<void> {
  await Log("backend", "info", "service", `User creation started – email: ${payload.email}, role: ${payload.role}`);

  if (!payload.email.includes("@")) {
    await Log("backend", "error", "service", `Invalid email format received – value: "${payload.email}"`);
    throw new Error("Invalid email");
  }

  //persistence
  await Log("backend", "info", "service", `User created successfully – email: ${payload.email}`);
}

//handler layer
async function handleCreateUserRequest(body: unknown): Promise<void> {
  await Log("backend", "debug", "handler", `POST /users received – body: ${JSON.stringify(body)}`);

  if (typeof (body as Record<string, unknown>).active !== "boolean") {
    await Log("backend", "error", "handler", "Type mismatch on field 'active': received string, expected bool");
  }
}

//repository layer
async function fetchUserById(id: string): Promise<void> {
  await Log("backend", "debug", "repository", `Querying users table – WHERE id = '${id}'`);
  // … query …
  await Log("backend", "info", "repository", `User record fetched – id: ${id}`);
}

//cache layer
async function getCachedSession(sessionId: string): Promise<null> {
  await Log("backend", "debug", "cache", `Cache lookup – key: session:${sessionId}`);
  // simulate miss
  await Log("backend", "warn", "cache", `Cache miss – key: session:${sessionId}; falling back to DB`);
  return null;
}

//route layer
async function registerRoutes(): Promise<void> {
  await Log("backend", "info", "route", "Registering API routes – /users, /auth, /orders");
}

//controller layer
async function ordersController(userId: string): Promise<void> {
  await Log("backend", "info", "controller", `Orders controller invoked – userId: ${userId}`);
}

//cron_job layer
async function runCleanupJob(): Promise<void> {
  await Log("backend", "info", "cron_job", "Expired-session cleanup job started – schedule: 0 3 * * *");
  // … cleanup …
  await Log("backend", "info", "cron_job", "Expired-session cleanup job completed – removed 142 records");
}

//domain layer
async function applyBusinessRule(orderId: string): Promise<void> {
  await Log("backend", "info", "domain", `Applying discount rule for order ${orderId}`);
}

//auth (shared)
async function verifyJwt(token: string): Promise<void> {
  await Log("backend", "info", "auth", `Verifying JWT – length: ${token.length} chars`);
  //verify
  await Log("backend", "info", "auth", "JWT verified successfully – sub: user_7f3a, exp valid");
}

//  FRONTEND EXAMPLES

//page layer
async function onDashboardMount(): Promise<void> {
  await Log("frontend", "info", "page", "Dashboard page mounted – rendered 32 rows, user: admin");
}

//component layer
async function onButtonClick(label: string): Promise<void> {
  await Log("frontend", "debug", "component", `Button clicked – label: "${label}", timestamp: ${Date.now()}`);
}

//hook layer
async function useFetchOrders(): Promise<void> {
  await Log("frontend", "info", "hook", "useFetchOrders: fetching orders for current user");
  // … fetch …
  await Log("frontend", "warn", "hook", "useFetchOrders: response delayed > 3 s – showing skeleton UI");
}

//api layer
async function postOrder(payload: object): Promise<void> {
  await Log("frontend", "info", "api", `POST /orders initiated – payload: ${JSON.stringify(payload)}`);
  // simulate 422
  await Log("frontend", "error", "api", "POST /orders failed – status 422, body: { error: 'qty must be >= 1' }");
}

//state layer
async function resetCartState(): Promise<void> {
  await Log("frontend", "warn", "state", "Cart state reset without user confirmation – possible data loss");
}

//style layer
async function applyTheme(theme: string): Promise<void> {
  await Log("frontend", "debug", "style", `Applying theme: ${theme} – updating CSS custom properties`);
}

//utils (shared)
async function formatCurrencyUtil(value: unknown): Promise<void> {
  if (value === null || value === undefined) {
    await Log("frontend", "warn", "utils", `formatCurrency received null/undefined – defaulting to 0`);
  }
}

//config (shared)
async function loadAppConfig(): Promise<void> {
  await Log("backend", "info", "config", "Loading application config – env: production");
}

//middleware (shared)
async function requestMiddleware(method: string, path: string): Promise<void> {
  await Log("backend", "debug", "middleware", `Incoming request – ${method} ${path}`);
}

//  RUN ALL EXAMPLES

(async () => {
  console.log("Running logging middleware examples…\n");

  await connectDatabase();
  await createUser({ email: "alice@example.com", role: "admin" });
  await handleCreateUserRequest({ name: "Bob", active: "yes" });
  await fetchUserById("usr_001");
  await getCachedSession("sess_abc123");
  await registerRoutes();
  await ordersController("usr_001");
  await runCleanupJob();
  await applyBusinessRule("ord_999");
  await verifyJwt("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.sample");

  await onDashboardMount();
  await onButtonClick("Place Order");
  await useFetchOrders();
  await postOrder({ productId: "prod_1", qty: 0 });
  await resetCartState();
  await applyTheme("dark");
  await formatCurrencyUtil(null);

  await loadAppConfig();
  await requestMiddleware("GET", "/api/users");

  console.log("\nAll examples completed.");
})();
