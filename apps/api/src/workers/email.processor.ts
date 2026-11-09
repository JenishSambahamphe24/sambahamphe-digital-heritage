import type { IEmailJob } from "../modules/email/email.types.js";
import type { Job } from "bullmq";

import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";

import { EMAIL_QUEUE } from "../core/queue/queue.constants.js";
import { EmailTemplateHelper } from "../modules/email/email-template.helper.js";
import { MailerService } from "./mailer.service.js";

@Processor(EMAIL_QUEUE)
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private readonly mailer: MailerService) {
    super();
  }

  async process(job: Job<IEmailJob>): Promise<void> {
    const { template, to, params } = job.data;
    await this.mailer.send(to, EmailTemplateHelper.render(template, params));
    // Never log the recipient address or params (personal data, one-time links).
    this.logger.log({ jobId: job.id, template }, "Email sent");
  }
}
