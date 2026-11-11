import { ApiClientFactory } from "@repo/api-client";

const DEFAULT_API_INTERNAL_URL = "http://localhost:3001";

// For server components: an absolute URL and no cookie, so every request is
// the anonymous, most restrictive view and its result is the same for everyone.
export const serverApiClient = ApiClientFactory.create({
  baseUrl: process.env.API_INTERNAL_URL ?? DEFAULT_API_INTERNAL_URL,
  client: "web",
});
