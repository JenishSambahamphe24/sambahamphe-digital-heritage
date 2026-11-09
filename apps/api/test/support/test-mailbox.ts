import type { StartedTestContainer } from "testcontainers";

import { GenericContainer, Wait } from "testcontainers";

const MAILPIT_IMAGE = "axllent/mailpit:v1.32.0";
const SMTP_PORT = 1025;
const API_PORT = 8025;
const POLL_INTERVAL_MS = 250;
const DEFAULT_WAIT_MS = 15_000;

interface IMailpitSummary {
  ID: string;
  Subject: string;
  To: Array<{ Address: string }>;
}

export interface IReceivedEmail {
  subject: string;
  text: string;
}

export class TestMailbox {
  private constructor(private readonly container: StartedTestContainer) {}

  static async start(): Promise<TestMailbox> {
    const container = await new GenericContainer(MAILPIT_IMAGE)
      .withExposedPorts(SMTP_PORT, API_PORT)
      .withWaitStrategy(Wait.forHttp("/livez", API_PORT))
      .start();
    return new TestMailbox(container);
  }

  get smtpUrl(): string {
    return `smtp://${this.container.getHost()}:${this.container.getMappedPort(SMTP_PORT)}`;
  }

  async waitFor(
    to: string,
    subjectIncludes: string,
    timeoutMs = DEFAULT_WAIT_MS,
  ): Promise<IReceivedEmail> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const messages = await this.fetchJson<{ messages: IMailpitSummary[] }>(
        `/api/v1/search?query=${encodeURIComponent(`to:"${to}"`)}`,
      );
      const match = messages.messages.find((message) => message.Subject.includes(subjectIncludes));
      if (match) {
        const full = await this.fetchJson<{ Subject: string; Text: string }>(
          `/api/v1/message/${match.ID}`,
        );
        return { subject: full.Subject, text: full.Text };
      }
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    }
    throw new Error(
      `No email to ${to} with subject containing "${subjectIncludes}" within ${timeoutMs} ms`,
    );
  }

  async countTo(to: string): Promise<number> {
    const messages = await this.fetchJson<{ messages: IMailpitSummary[] }>(
      `/api/v1/search?query=${encodeURIComponent(`to:"${to}"`)}`,
    );
    return messages.messages.length;
  }

  static tokenFrom(email: IReceivedEmail): string {
    const match = /#token=([\w-]+)/.exec(email.text);
    if (!match?.[1]) {
      throw new Error("Email contains no token link");
    }
    return match[1];
  }

  async stop(): Promise<void> {
    await this.container.stop();
  }

  private async fetchJson<T>(path: string): Promise<T> {
    const base = `http://${this.container.getHost()}:${this.container.getMappedPort(API_PORT)}`;
    const response = await fetch(`${base}${path}`);
    return (await response.json()) as T;
  }
}
