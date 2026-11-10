import createMiddleware from "next-intl/middleware";

import { routing } from "./i18n/routing";

export default createMiddleware(routing);

// Locale routing for pages only: /api is forwarded to the API untouched.
export const config = {
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
