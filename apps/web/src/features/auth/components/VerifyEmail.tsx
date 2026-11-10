"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { Alert, Spinner } from "@repo/ui";

import { Link } from "#/i18n/navigation";
import { apiClient } from "#/lib/api-client";
import { ROUTES } from "#/lib/routes";

import { useHashToken } from "../hooks/useHashToken";
import { AuthTitle } from "./AuthTitle";

type TVerifyState = "pending" | "success" | "failed";

export function VerifyEmail() {
  const t = useTranslations();
  const hashToken = useHashToken();
  const [state, setState] = useState<TVerifyState>("pending");
  // React may run effects twice in development; the token is single-use, so
  // a second request would turn a success into "already used".
  const sent = useRef(false);

  useEffect(() => {
    if (hashToken.status !== "found" || sent.current) {
      return;
    }
    sent.current = true;
    apiClient
      .POST("/api/v1/auth/verify-email", { body: { token: hashToken.token } })
      .then(({ error }) => setState(error ? "failed" : "success"))
      .catch(() => setState("failed"));
  }, [hashToken]);

  return (
    <>
      <AuthTitle>{t("auth_verify_title")}</AuthTitle>
      {hashToken.status === "missing" ? (
        <Alert tone="warning">{t("auth_missing_token")}</Alert>
      ) : state === "pending" ? (
        <p className="text-foreground-muted flex items-center gap-2 text-sm">
          <Spinner /> {t("auth_verify_pending")}
        </p>
      ) : state === "success" ? (
        <Alert tone="success">{t("auth_verify_success")}</Alert>
      ) : (
        <Alert tone="danger">{t("auth_verify_failed")}</Alert>
      )}
      <Link
        href={ROUTES.login}
        className="text-primary hover:text-primary-hover text-sm font-medium"
      >
        {t("auth_go_login")}
      </Link>
    </>
  );
}
