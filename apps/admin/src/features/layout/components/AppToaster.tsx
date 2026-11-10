import { useTranslations } from "use-intl";

import { Toaster } from "@repo/ui";

export function AppToaster() {
  const t = useTranslations();
  return <Toaster closeLabel={t("toast_close")} />;
}
