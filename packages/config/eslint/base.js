import js from "@eslint/js";

export const baseConfig = [
  {
    ignores: [
      "**/dist/**",
      "**/.next/**",
      "**/.turbo/**",
      "**/coverage/**",
      "**/.expo/**",
    ],
  },
  js.configs.recommended,
  {
    rules: {
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },
];

export default baseConfig;
