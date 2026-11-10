import reactRefresh from "eslint-plugin-react-refresh";

import { reactConfig } from "@repo/config/eslint/react";

export default [
  { ignores: ["dist/**", "src/routeTree.gen.ts"] },
  ...reactConfig,
  reactRefresh.configs.vite,
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      // TanStack Router's documented control flow is `throw redirect(...)`;
      // allow exactly that, and keep the rule for everything else.
      "@typescript-eslint/only-throw-error": [
        "error",
        { allow: [{ from: "package", package: "@tanstack/router-core", name: "Redirect" }] },
      ],
    },
  },
];
