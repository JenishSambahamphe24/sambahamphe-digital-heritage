export const OUTBOX_TOPIC = {
  sendEmail: "email.send",
} as const;

export type TOutboxTopic = (typeof OUTBOX_TOPIC)[keyof typeof OUTBOX_TOPIC];
