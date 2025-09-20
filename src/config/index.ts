import dotenv from "dotenv";

dotenv.config();

class Config {
  private _DB_HOST: string | null = null;

  private _DB_PORT: number | null = null;

  private _DB_USER: string | null = null;

  private _DB_PASSWORD: string | null = null;

  private _DB_NAME: string | null = null;

  private _GCP_CERTS_PATH: string | null = null;

  get DB_HOST(): string {
    if (this._DB_HOST === null) {
      this._DB_HOST = process.env.DB_HOST || "";

      if (!this._DB_HOST && !this.isBuildTime()) {
        throw new Error("Environment variable DB_HOST is not set");
      }
    }

    return this._DB_HOST;
  }

  get DB_PORT(): number {
    if (this._DB_PORT === null) {
      this._DB_PORT = Number.parseInt(process.env.DB_PORT || "5432");
    }

    return this._DB_PORT;
  }

  get DB_USER(): string {
    if (this._DB_USER === null) {
      this._DB_USER = process.env.DB_USER || "";

      if (!this._DB_USER && !this.isBuildTime()) {
        throw new Error("Environment variable DB_USER is not set");
      }
    }

    return this._DB_USER;
  }

  get DB_PASSWORD(): string {
    if (this._DB_PASSWORD === null) {
      this._DB_PASSWORD = process.env.DB_PASSWORD || "";

      if (!this._DB_PASSWORD && !this.isBuildTime()) {
        throw new Error("Environment variable DB_PASSWORD is not set");
      }
    }

    return this._DB_PASSWORD;
  }

  get DB_NAME(): string {
    if (this._DB_NAME === null) {
      this._DB_NAME = process.env.DB_NAME || "";

      if (!this._DB_NAME && !this.isBuildTime()) {
        throw new Error("Environment variable DB_NAME is not set");
      }
    }

    return this._DB_NAME;
  }

  get GCP_CERTS_PATH(): string {
    if (this._GCP_CERTS_PATH === null) {
      this._GCP_CERTS_PATH = process.env.GCP_CERTS_PATH || "";

      if (
        !this._GCP_CERTS_PATH &&
        process.env.NODE_ENV === "production" &&
        !this.isBuildTime()
      ) {
        throw new Error("Environment variable GCP_CERTS_PATH is not set");
      }
    }

    return this._GCP_CERTS_PATH;
  }

  private isBuildTime(): boolean {
    return (
      process.env.NEXT_PHASE === "phase-production-build" ||
      process.env.NODE_ENV !== "production" ||
      process.argv.includes("build")
    );
  }
}

export const config = new Config();
