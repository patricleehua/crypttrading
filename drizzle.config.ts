import "dotenv/config";

import { defineConfig } from "drizzle-kit";

import path from "node:path";

import fs from "node:fs";

const DB_HOST = process.env.DB_HOST || "";

const DB_PORT = Number.parseInt(process.env.DB_PORT || "5432");

const DB_USER = process.env.DB_USER || "";

const DB_PASSWORD = process.env.DB_PASSWORD || "";

const DB_NAME = process.env.DB_NAME || "";

const certsPath = process.env.GCP_CERTS_PATH || "";

export default defineConfig({
  out: "./drizzle",

  schema: "./src/db/schema/index.ts",

  dialect: "postgresql",

  dbCredentials: {
    host: DB_HOST,

    port: DB_PORT,

    user: DB_USER,

    password: DB_PASSWORD,

    database: DB_NAME,

    ssl:
      process.env.NODE_ENV === "production" && process.env.GCP_CERTS_PATH
        ? {
            rejectUnauthorized: true,

            checkServerIdentity: () => undefined,

            ca: fs.readFileSync(path.join(certsPath, "server-ca.pem")),

            cert: fs.readFileSync(path.join(certsPath, "client-cert.pem")),

            key: fs.readFileSync(path.join(certsPath, "client-key.pem")),
          }
        : false,
  },

  verbose: true,

  strict: true,
});
