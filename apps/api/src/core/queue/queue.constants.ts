const SECOND_MS = 1_000;
const DAY_SECONDS = 24 * 60 * 60;

export const EMAIL_QUEUE = "email";

export const EMAIL_JOB_OPTIONS = {
  attempts: 8,
  backoff: { type: "exponential", delay: 5 * SECOND_MS },
  // Jobs carry one-time links: drop them as soon as they are done, and keep
  // failures only long enough to investigate.
  removeOnComplete: true,
  removeOnFail: { age: DAY_SECONDS },
} as const;

export const OUTBOX_POLL_INTERVAL_MS = SECOND_MS;
export const OUTBOX_BATCH_SIZE = 50;
