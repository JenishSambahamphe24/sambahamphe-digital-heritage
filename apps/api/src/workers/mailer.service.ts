import type { IRenderedEmail } from "../modules/email/email.types.js";
import type { OnModuleDestroy } from "@nestjs/common";
import type { Transporter } from "nodemailer";

import { Injectable } from "@nestjs/common";
import nodemailer from "nodemailer";

import { AppConfig } from "../core/config/app-config.js";

@Injectable()
export class MailerService implements OnModuleDestroy {
  private readonly transport: Transporter;

  constructor(private readonly config: AppConfig) {
    this.transport = nodemailer.createTransport(config.smtpUrl);
  }

  async send(to: string, email: IRenderedEmail): Promise<void> {
    await this.transport.sendMail({ from: this.config.mailFrom, to, ...email });
  }

  onModuleDestroy(): void {
    this.transport.close();
  }
}
