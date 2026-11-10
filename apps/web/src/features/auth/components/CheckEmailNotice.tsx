import { useTranslations } from "next-intl";

import { Alert } from "@repo/ui";

export function CheckEmailNotice() {
  const t = useTranslations();
  return (
    <Alert tone="success">
      <p className="font-medium">{t("auth_check_email_title")}</p>
      <p className="mt-1">{t("auth_check_email_body")}</p>
    </Alert>
  );
}
