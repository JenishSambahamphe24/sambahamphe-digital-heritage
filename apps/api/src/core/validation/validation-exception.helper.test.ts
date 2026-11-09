import { describe, expect, it } from "vitest";
import { z } from "zod";

import { ValidationExceptionHelper } from "./validation-exception.helper.js";

describe("ValidationExceptionHelper", () => {
  it("turns schema issues into a 422 with one field error per issue", async () => {
    const schema = z.object({ email: z.email(), names: z.array(z.string().min(1)) });
    const result = await schema["~standard"].validate({ email: "nope", names: [""] });
    if (!("issues" in result) || !result.issues) {
      throw new Error("expected validation issues");
    }

    const exception = ValidationExceptionHelper.fromIssues(result.issues);

    expect(exception.status).toBe(422);
    expect(exception.code).toBe("validation_error");
    expect(exception.detail).toBe("2 fields are invalid.");
    expect(exception.errors?.map((error) => error.path)).toEqual([["email"], ["names", 0]]);
  });
});
