import { applyDecorators } from "@nestjs/common";
import { ApiDefaultResponse } from "@nestjs/swagger";

import { problemDetailsSchema } from "@repo/contracts";

const PROBLEM_CONTENT_TYPE = "application/problem+json";

// Written out because the standardSchema shortcut would document errors as
// application/json; ours are application/problem+json.
const problemSchema = problemDetailsSchema["~standard"].jsonSchema.output({
  target: "openapi-3.0",
});

export const ApiProblemResponse = () =>
  applyDecorators(
    ApiDefaultResponse({
      description: "Error, as RFC 9457 problem details",
      content: { [PROBLEM_CONTENT_TYPE]: { schema: problemSchema } },
    }),
  );
