import type { INestApplication } from "@nestjs/common";
import type { OpenAPIObject } from "@nestjs/swagger";

import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

export const DOCS_PATH = "api/docs";

const TITLE = "Sambahamphe Community API";
const VERSION = "1";
const DESCRIPTION =
  "REST API for the Sambahamphe Utthan Sangh platform. Errors use RFC 9457 problem details " +
  "(application/problem+json). See docs/api/api-conventions.md.";

export class OpenApiHelper {
  // Request and response schemas come from @repo/contracts: @nestjs/swagger
  // converts any Zod schema through its Standard JSON Schema interface.
  static createDocument(app: INestApplication): OpenAPIObject {
    const config = new DocumentBuilder()
      .setTitle(TITLE)
      .setVersion(VERSION)
      .setDescription(DESCRIPTION)
      .addCookieAuth("sid", { type: "apiKey", in: "cookie", name: "sid" }, "web_session")
      .addCookieAuth(
        "admin_sid",
        { type: "apiKey", in: "cookie", name: "admin_sid" },
        "admin_session",
      )
      .addBearerAuth({ type: "http", scheme: "bearer" }, "mobile_session")
      .build();
    return SwaggerModule.createDocument(app, config, {
      operationIdFactory: (controllerKey, methodKey) =>
        `${controllerKey.replace(/Controller$/, "")}_${methodKey}`,
    });
  }

  // Stable output: the committed spec must only change when the API does.
  static serialize(document: OpenAPIObject): string {
    return `${JSON.stringify(document, null, 2)}\n`;
  }
}
