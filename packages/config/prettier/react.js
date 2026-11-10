import { baseConfig } from "./base.js";

/** @type {import('prettier').Config} */
export const reactConfig = {
  ...baseConfig,
  printWidth: 100,
  plugins: [...(baseConfig.plugins ?? []), "prettier-plugin-tailwindcss"],
  importOrderParserPlugins: ["typescript", "jsx", "decorators-legacy"],
  importOrder: [
    "^.*\\.css$",
    "",
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
  tailwindFunctions: ["clsx", "cn"],
};

export default reactConfig;
