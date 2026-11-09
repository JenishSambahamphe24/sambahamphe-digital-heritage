import { Module } from "@nestjs/common";

import { AdminUsersController } from "./http/admin-users.controller.js";
import { UsersRepository } from "./users.repository.js";

@Module({
  controllers: [AdminUsersController],
  providers: [UsersRepository],
  exports: [UsersRepository],
})
export class UsersModule {}
