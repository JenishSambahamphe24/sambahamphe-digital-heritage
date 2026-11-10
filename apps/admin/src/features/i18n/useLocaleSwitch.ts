import { useContext } from "react";

import { LocaleContext } from "./LocaleContext";

export function useLocaleSwitch() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocaleSwitch must be used inside LocaleProvider");
  }
  return context;
}
