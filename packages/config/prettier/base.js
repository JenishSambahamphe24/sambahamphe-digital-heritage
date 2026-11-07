/** @type {import('prettier').Config} */
export const baseConfig = {
  semi: true,
  singleQuote: false,
  trailingComma: "all",
  plugins: ["@ianvs/prettier-plugin-sort-imports"],
  importOrder: [
    "<TYPES>",
    "",
    "<BUILTIN_MODULES>",
    "",
    "<THIRD_PARTY_MODULES>",
    "",
    "^@repo/(.*)$",
    "",
    "^#/(.*)$",
    "",
    "^[./]",
  ],
  importOrderCaseSensitive: false,
  importOrderParserPlugins: ["typescript", "decorators-legacy"],
  importOrderTypeScriptVersion: "5.0.0",
};

export default baseConfig;
