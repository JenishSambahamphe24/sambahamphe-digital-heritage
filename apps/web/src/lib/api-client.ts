import { ApiClientFactory } from "@repo/api-client";

// Browser-side client: same-origin, so the HttpOnly session cookie goes along.
// Server-side code must not use this (relative URLs are invalid on a server).
export const apiClient = ApiClientFactory.create({ baseUrl: "", client: "web" });
