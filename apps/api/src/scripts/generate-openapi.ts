import { writeFile } from "node:fs/promises";

import { AppFactory } from "../app.factory.js";
import { OPENAPI_PLACEHOLDER_ENV } from "../core/openapi/openapi-env.js";
import { OpenApiHelper } from "../core/openapi/openapi.helper.js";

const SPEC_PATH = new URL("../../../../packages/api-client/openapi.json", import.meta.url);

const app = await AppFactory.create(OPENAPI_PLACEHOLDER_ENV);
try {
  await writeFile(SPEC_PATH, OpenApiHelper.serialize(OpenApiHelper.createDocument(app)));
  process.stdout.write(`OpenAPI spec written to ${SPEC_PATH.pathname}\n`);
} finally {
  await app.close();
}
