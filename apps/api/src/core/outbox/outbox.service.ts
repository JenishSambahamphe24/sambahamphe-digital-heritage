import type { TDbExecutor } from "../database/database.types.js";
import type { TOutboxTopic } from "./outbox.topics.js";

import { Injectable } from "@nestjs/common";

import { outbox } from "../database/schema/index.js";

@Injectable()
export class OutboxService {
  async enqueue(executor: TDbExecutor, topic: TOutboxTopic, payload: object): Promise<void> {
    await executor.insert(outbox).values({ topic, payload });
  }
}
