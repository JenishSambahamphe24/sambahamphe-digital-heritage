import type { TEnv } from "./env.schema.js";

import { existsSync } from "node:fs";

import { envSchema } from "./env.schema.js";
import { InvalidEnvError } from "./invalid-env.error.js";

const ENV_FILE = ".env";

export class EnvHelper {
  static parse(source: Record<string, string | undefined>): TEnv {
    const result = envSchema.safeParse(source);
    if (!result.success) {
      throw new InvalidEnvError(
        result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`),
      );
    }
    return result.data;
  }

  static loadOrExit(): TEnv {
    try {
      return EnvHelper.load();
    } catch (error) {
      if (error instanceof InvalidEnvError) {
        console.error(error.message);
        process.exit(1);
      }
      throw error;
    }
  }

  static load(): TEnv {
    if (existsSync(ENV_FILE)) {
      process.loadEnvFile(ENV_FILE);
    }
    return EnvHelper.parse(process.env);
  }
}
