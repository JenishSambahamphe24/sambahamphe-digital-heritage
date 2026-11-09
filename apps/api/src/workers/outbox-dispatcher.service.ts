import type { TOutboxTopic } from "../core/outbox/outbox.topics.js";
import type { OnApplicationBootstrap, OnApplicationShutdown } from "@nestjs/common";
import type { Queue } from "bullmq";

import { InjectQueue } from "@nestjs/bullmq";
import { Injectable, Logger } from "@nestjs/common";
import { asc, inArray } from "drizzle-orm";

import { DatabaseService } from "../core/database/database.service.js";
import { outbox } from "../core/database/schema/index.js";
import { OUTBOX_TOPIC } from "../core/outbox/outbox.topics.js";
import {
  EMAIL_JOB_OPTIONS,
  EMAIL_QUEUE,
  OUTBOX_BATCH_SIZE,
  OUTBOX_POLL_INTERVAL_MS,
} from "../core/queue/queue.constants.js";

// Rows with an unknown topic are left untouched (and visible in the table)
// instead of blocking every other row behind them.
const KNOWN_TOPICS: TOutboxTopic[] = Object.values(OUTBOX_TOPIC);

@Injectable()
export class OutboxDispatcherService implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(OutboxDispatcherService.name);
  private timer: NodeJS.Timeout | null = null;
  private running = false;

  constructor(
    private readonly database: DatabaseService,
    @InjectQueue(EMAIL_QUEUE) private readonly emailQueue: Queue,
  ) {}

  onApplicationBootstrap(): void {
    this.timer = setInterval(() => {
      void this.tick();
    }, OUTBOX_POLL_INTERVAL_MS);
  }

  onApplicationShutdown(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  async dispatchBatch(): Promise<number> {
    return this.database.db.transaction(async (tx) => {
      const rows = await tx
        .select()
        .from(outbox)
        .where(inArray(outbox.topic, KNOWN_TOPICS))
        .orderBy(asc(outbox.createdAt))
        .limit(OUTBOX_BATCH_SIZE)
        .for("update", { skipLocked: true });

      for (const row of rows) {
        await this.queueFor(row.topic as TOutboxTopic).add(row.topic, row.payload, {
          ...EMAIL_JOB_OPTIONS,
          // Same id as the outbox row: if this transaction fails after the
          // add, the retry re-adds the same job and BullMQ ignores the duplicate.
          jobId: row.id,
        });
      }
      if (rows.length > 0) {
        await tx.delete(outbox).where(
          inArray(
            outbox.id,
            rows.map((row) => row.id),
          ),
        );
      }
      return rows.length;
    });
  }

  private async tick(): Promise<void> {
    if (this.running) {
      return;
    }
    this.running = true;
    try {
      await this.dispatchBatch();
    } catch (error) {
      this.logger.error({ err: error }, "Outbox dispatch failed; will retry");
    } finally {
      this.running = false;
    }
  }

  private queueFor(topic: TOutboxTopic): Queue {
    switch (topic) {
      case OUTBOX_TOPIC.sendEmail:
        return this.emailQueue;
    }
  }
}
