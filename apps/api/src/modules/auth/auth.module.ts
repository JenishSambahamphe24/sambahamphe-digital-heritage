import { Module } from "@nestjs/common";

import { AccessModule } from "../access/access.module.js";
import { UsersModule } from "../users/users.module.js";
import { AuthService } from "./application/auth.service.js";
import { SessionService } from "./application/session.service.js";
import { AuthController } from "./http/auth.controller.js";
import { MeController } from "./http/me.controller.js";
import { OneTimeTokensRepository } from "./internal/one-time-tokens.repository.js";
import { SessionsRepository } from "./internal/sessions.repository.js";

@Module({
  imports: [UsersModule, AccessModule],
  controllers: [AuthController, MeController],
  providers: [AuthService, SessionService, SessionsRepository, OneTimeTokensRepository],
  exports: [SessionService],
})
export class AuthModule {}
