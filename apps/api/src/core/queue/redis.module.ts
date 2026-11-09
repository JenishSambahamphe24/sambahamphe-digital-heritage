import { Global, Module } from "@nestjs/common";

import { RedisConnectionService } from "./redis-connection.service.js";

@Global()
@Module({
  providers: [RedisConnectionService],
  exports: [RedisConnectionService],
})
export class RedisModule {}
