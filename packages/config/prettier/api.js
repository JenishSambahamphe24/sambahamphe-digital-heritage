import { baseConfig } from "./base.js";

/** @type {import('prettier').Config} */
export const apiConfig = {
  ...baseConfig,
  printWidth: 100,
};

export default apiConfig;
