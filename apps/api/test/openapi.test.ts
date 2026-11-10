import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import { AppFactory } from "../src/app.factory.js";
import { OPENAPI_PLACEHOLDER_ENV } from "../src/core/openapi/openapi-env.js";
import { OpenApiHelper } from "../src/core/openapi/openapi.helper.js";

const COMMITTED_SPEC = new URL("../../../packages/api-client/openapi.json", import.meta.url);

describe("committed OpenAPI spec", () => {
  it("matches the API (run `pnpm openapi:generate` after changing endpoints or contracts)", async () => {
    const app = await AppFactory.create(OPENAPI_PLACEHOLDER_ENV);
    try {
      const current = OpenApiHelper.serialize(OpenApiHelper.createDocument(app));
      expect(current).toBe(await readFile(COMMITTED_SPEC, "utf8"));
    } finally {
      await app.close();
    }
  });
});
