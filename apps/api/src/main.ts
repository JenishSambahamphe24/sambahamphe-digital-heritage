import { AppFactory } from "./app.factory.js";
import { EnvHelper } from "./core/config/env.helper.js";

const env = EnvHelper.loadOrExit();
const app = await AppFactory.create(env);
await app.listen(env.PORT);
