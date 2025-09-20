import "dotenv/config";

import { drizzle } from "drizzle-orm/node-postgres";

import { Pool, type PoolConfig } from "pg";

import { config } from "@/config";

import path from "node:path";

import fs from "node:fs";

const poolConfig: PoolConfig = {
  host: config.DB_HOST,

  port: config.DB_PORT,

  user: config.DB_USER,

  password: config.DB_PASSWORD,

  database: config.DB_NAME,

  ssl:
    process.env.NODE_ENV === "production" && process.env.GCP_CERTS_PATH
      ? {
          rejectUnauthorized: true,

          checkServerIdentity: () => undefined,

          ca: fs.readFileSync(
            path.join(config.GCP_CERTS_PATH, "server-ca.pem")
          ),

          cert: fs.readFileSync(
            path.join(config.GCP_CERTS_PATH, "client-cert.pem")
          ),

          key: fs.readFileSync(
            path.join(config.GCP_CERTS_PATH, "client-key.pem")
          ),
        }
      : undefined,

  max: 20,

  idleTimeoutMillis: 30000,

  connectionTimeoutMillis: 60000,

  query_timeout: 60000,

  keepAlive: true,

  keepAliveInitialDelayMillis: 10000,
};

const pool = new Pool(poolConfig);

pool.on(
  "error",
  (err: Error & { code?: string; hostname?: string; port?: number }) => {
    console.error("❌ Unexpected error on idle client:", err);

    console.error("Error details:", {
      code: err.code || "unknown",

      message: err.message,

      stack: err.stack,
    });
  }
);

pool.on("connect", () => {
  console.log("✅ New client connected to database");
});

pool.on("remove", () => {
  console.log("🔌 Client removed from pool");
});

const isBuildTime =
  process.env.NEXT_PHASE === "phase-production-build" ||
  process.argv.includes("build") ||
  process.env.DB_HOST?.includes("build-placeholder");

if (!isBuildTime) {
  pool

    .connect()

    .then((client) => {
      console.log("✅ Database pool initialized successfully");

      client.release();
    })

    .catch((err) => {
      console.error("❌ Failed to initialize database pool:", err);

      console.error("Connection details:", {
        code: err.code,

        message: err.message,

        host: err.hostname || "unknown",

        port: err.port || "unknown",
      });
    });
}

export const db = drizzle({ client: pool });
