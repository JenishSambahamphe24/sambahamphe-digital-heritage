import { ApiClientFactory } from "@repo/api-client";

// Same-origin in the browser; the admin client header selects the admin_sid
// cookie and the admin-only rules in the API.
export const apiClient = ApiClientFactory.create({ baseUrl: "", client: "admin" });
