import reactHooks from "eslint-plugin-react-hooks";

import { apiConfig } from "./api.js";

// Typed TypeScript rules from the api preset, plus the rules of hooks.
export const reactConfig = [
  ...apiConfig,
  reactHooks.configs.flat["recommended-latest"],
];

export default reactConfig;
