import { AppFactory } from "./app.factory.js";
import { EnvHelper } from "./core/config/env.helper.js";
import { InvalidEnvError } from "./core/config/invalid-env.error.js";

function loadEnvOrExit() {
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

const env = loadEnvOrExit();
const app = await AppFactory.create(env);
await app.listen(env.PORT);
