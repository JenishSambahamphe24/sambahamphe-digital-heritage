import { useTranslations } from "use-intl";

import { Alert } from "@repo/ui";

import { ApiError } from "#/lib/api-error";

const FORBIDDEN = "forbidden";

export interface QueryErrorProps {
  error: unknown;
}

export function QueryError({ error }: QueryErrorProps) {
  const t = useTranslations();
  const code = error instanceof ApiError ? error.code : null;
  return <Alert tone="danger">{t(code === FORBIDDEN ? "no_permission" : "error_generic")}</Alert>;
}
