import { EnvHelper } from "./core/config/env.helper.js";
import { WorkerFactory } from "./worker.factory.js";

const worker = await WorkerFactory.create(EnvHelper.loadOrExit());
await worker.init();
