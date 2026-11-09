import type { TDbExecutor } from "../../../core/database/database.types.js";
import type { IEmailJob } from "../../email/email.types.js";
import type { TUserRow } from "../../users/users.repository.js";
import type { IRequestMeta, TAuthClient } from "../auth.types.js";
import type { TTokenPurpose } from "../internal/one-time-tokens.repository.js";
import type { TLoginRequest, TRegisterRequest, TUserResponse } from "@repo/contracts";

import { HttpStatus, Injectable } from "@nestjs/common";

import { AuditService } from "../../../core/audit/audit.service.js";
import { AppConfig } from "../../../core/config/app-config.js";
import { DatabaseErrorHelper } from "../../../core/database/database-error.helper.js";
import { DatabaseService } from "../../../core/database/database.service.js";
import { AppException } from "../../../core/errors/app.exception.js";
import { OutboxService } from "../../../core/outbox/outbox.service.js";
import { OUTBOX_TOPIC } from "../../../core/outbox/outbox.topics.js";
import { AccessService } from "../../access/application/access.service.js";
import { UserResponseHelper } from "../../users/user-response.helper.js";
import { UsersRepository } from "../../users/users.repository.js";
import { EMAIL_VERIFICATION_TTL_MS, PASSWORD_RESET_TTL_MS } from "../auth.constants.js";
import { PasswordHelper } from "../domain/password.helper.js";
import { TokenHelper } from "../domain/token.helper.js";
import { OneTimeTokensRepository } from "../internal/one-time-tokens.repository.js";
import { SessionsRepository } from "../internal/sessions.repository.js";
import { SessionService } from "./session.service.js";

const VERIFY_EMAIL_PATH = "/verify-email";
const RESET_PASSWORD_PATH = "/reset-password";

export interface ILoginResult {
  user: TUserResponse;
  token: string;
  expiresAt: Date;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly database: DatabaseService,
    private readonly users: UsersRepository,
    private readonly tokens: OneTimeTokensRepository,
    private readonly sessionRows: SessionsRepository,
    private readonly sessions: SessionService,
    private readonly outbox: OutboxService,
    private readonly config: AppConfig,
    private readonly audit: AuditService,
    private readonly access: AccessService,
  ) {}

  async register(request: TRegisterRequest): Promise<void> {
    const passwordHash = await PasswordHelper.hash(request.password);
    try {
      await this.database.db.transaction(async (tx) => {
        const existing = await this.users.findByEmail(request.email, tx);
        if (existing) {
          await this.sendEmail(tx, existing, "account_exists", {});
          return;
        }
        const user = await this.users.create(
          {
            email: request.email,
            passwordHash,
            displayName: request.displayName,
            preferredLocale: request.locale,
          },
          tx,
        );
        await this.sendTokenEmail(tx, user, "email_verification");
        await this.audit.record(
          { action: "auth.registered", entityType: "user", entityId: user.id },
          tx,
        );
      });
    } catch (error) {
      // Two simultaneous sign-ups with one email: the loser hits the unique
      // index. Answer exactly as for an existing account.
      if (!DatabaseErrorHelper.isUniqueViolation(error)) {
        throw error;
      }
    }
  }

  async resendVerification(email: string): Promise<void> {
    await this.database.db.transaction(async (tx) => {
      const user = await this.users.findByEmail(email, tx);
      if (!user || user.emailVerifiedAt || user.status !== "active") {
        return;
      }
      await this.tokens.invalidateOutstanding(user.id, "email_verification", tx);
      await this.sendTokenEmail(tx, user, "email_verification");
    });
  }

  async verifyEmail(token: string): Promise<void> {
    await this.database.db.transaction(async (tx) => {
      const row = await this.consumeToken(tx, token, "email_verification");
      await this.users.markEmailVerified(row.userId, tx);
      await this.audit.record(
        {
          action: "auth.email_verified",
          entityType: "user",
          entityId: row.userId,
          actorId: row.userId,
        },
        tx,
      );
    });
  }

  async login(
    request: TLoginRequest,
    client: TAuthClient,
    meta: IRequestMeta,
  ): Promise<ILoginResult> {
    const user = await this.users.findByEmail(request.email);
    const passwordOk = user?.passwordHash
      ? await PasswordHelper.verify(user.passwordHash, request.password)
      : await PasswordHelper.verifyAgainstDummy(request.password);

    if (!user || !passwordOk) {
      // Never record the attempted email: it may be a typo of someone else's
      // address, or not an email at all.
      await this.audit.record({
        action: "auth.login_failed",
        entityType: user ? "user" : undefined,
        entityId: user?.id ?? null,
      });
      throw new AppException(
        HttpStatus.UNAUTHORIZED,
        "invalid_credentials",
        "Invalid credentials",
        "The email or password is incorrect.",
      );
    }
    if (user.status !== "active") {
      throw new AppException(
        HttpStatus.FORBIDDEN,
        "account_disabled",
        "Account disabled",
        "This account is not active.",
      );
    }

    if (client === "admin" && !(await this.access.hasAnyRole(user.id))) {
      throw new AppException(
        HttpStatus.FORBIDDEN,
        "admin_access_required",
        "Admin access required",
        "This account has no role in the admin system.",
      );
    }

    const { token, session } = await this.sessions.create(user.id, client, meta);
    await this.users.touchLastLogin(user.id);
    await this.audit.record({
      action: "auth.login_succeeded",
      entityType: "session",
      entityId: session.id,
      actorId: user.id,
      changes: { client },
    });
    return { user: UserResponseHelper.fromRow(user), token, expiresAt: session.absoluteExpiresAt };
  }

  async requestPasswordReset(email: string): Promise<void> {
    await this.database.db.transaction(async (tx) => {
      const user = await this.users.findByEmail(email, tx);
      if (!user || user.status !== "active") {
        return;
      }
      await this.tokens.invalidateOutstanding(user.id, "password_reset", tx);
      await this.sendTokenEmail(tx, user, "password_reset");
      await this.audit.record(
        { action: "auth.password_reset_requested", entityType: "user", entityId: user.id },
        tx,
      );
    });
  }

  async confirmPasswordReset(token: string, newPassword: string): Promise<void> {
    const passwordHash = await PasswordHelper.hash(newPassword);
    await this.database.db.transaction(async (tx) => {
      const row = await this.consumeToken(tx, token, "password_reset");
      await this.users.updatePassword(row.userId, passwordHash, tx);
      // The reset link proves control of the inbox.
      await this.users.markEmailVerified(row.userId, tx);
      await this.sessionRows.revokeAllForUser(row.userId, "password_reset", tx);
      await this.audit.record(
        {
          action: "auth.password_reset_completed",
          entityType: "user",
          entityId: row.userId,
          actorId: row.userId,
        },
        tx,
      );
    });
  }

  private async consumeToken(tx: TDbExecutor, token: string, purpose: TTokenPurpose) {
    const row = await this.tokens.findUsable(TokenHelper.hash(token), purpose, new Date(), tx);
    if (!row) {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        "invalid_token",
        "Invalid or expired link",
        "This link is invalid, already used or expired. Request a new one.",
      );
    }
    await this.tokens.markUsed(row.id, tx);
    return row;
  }

  private async sendTokenEmail(
    tx: TDbExecutor,
    user: TUserRow,
    purpose: "email_verification" | "password_reset",
  ): Promise<void> {
    const token = TokenHelper.generate();
    const ttl =
      purpose === "email_verification" ? EMAIL_VERIFICATION_TTL_MS : PASSWORD_RESET_TTL_MS;
    await this.tokens.insert(
      {
        userId: user.id,
        purpose,
        tokenHash: TokenHelper.hash(token),
        expiresAt: new Date(Date.now() + ttl),
      },
      tx,
    );
    const path = purpose === "email_verification" ? VERIFY_EMAIL_PATH : RESET_PASSWORD_PATH;
    // The token goes after "#": browsers never send the fragment to a server,
    // so it can't end up in web-server or proxy logs.
    const link = `${this.config.publicWebUrl}${path}#token=${token}`;
    await this.sendEmail(
      tx,
      user,
      purpose === "email_verification" ? "verify_email" : "password_reset",
      {
        link,
      },
    );
  }

  private async sendEmail(
    tx: TDbExecutor,
    user: TUserRow,
    template: IEmailJob["template"],
    params: Record<string, string>,
  ): Promise<void> {
    if (!user.email) {
      return;
    }
    const job: IEmailJob = {
      template,
      to: user.email,
      locale: user.preferredLocale,
      params: { displayName: user.displayName, ...params },
    };
    await this.outbox.enqueue(tx, OUTBOX_TOPIC.sendEmail, job);
  }
}
