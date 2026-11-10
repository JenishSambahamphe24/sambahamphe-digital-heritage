import nextPlugin from "@next/eslint-plugin-next";

import { reactConfig } from "@repo/config/eslint/react";

export default [
  { ignores: [".next/**", "next-env.d.ts"] },
  ...reactConfig,
  {
    plugins: { "@next/next": nextPlugin },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
    },
  },
];
