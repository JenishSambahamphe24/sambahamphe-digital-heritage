"use client";

import { useForm } from "@tanstack/react-form";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { PASSWORD_MIN_LENGTH } from "@repo/contracts";
import { Alert, Button, FormField, Input, Spinner, ToastHelper } from "@repo/ui";

import { Link } from "#/i18n/navigation";
import { apiClient } from "#/lib/api-client";
import { ProblemMessageHelper } from "#/lib/problem-message.helper";
import { ROUTES } from "#/lib/routes";

import { AuthValidationHelper } from "../auth-validation.helper";
import { useHashToken } from "../hooks/useHashToken";
import { AuthTitle } from "./AuthTitle";

export function ResetPasswordForm() {
  const t = useTranslations();
  const hashToken = useHashToken();
  const [done, setDone] = useState(false);

  const form = useForm({
    defaultValues: { newPassword: "" },
    onSubmit: async ({ value }) => {
      if (hashToken.status !== "found") {
        return;
      }
      try {
        const { error } = await apiClient.POST("/api/v1/auth/password-reset/confirm", {
          body: { token: hashToken.token, newPassword: value.newPassword },
        });
        if (error) {
          ToastHelper.show({
            tone: "danger",
            description: t(ProblemMessageHelper.keyFor(error.code)),
          });
          return;
        }
        setDone(true);
      } catch {
        ToastHelper.show({ tone: "danger", description: t("error_network") });
      }
    },
  });

  if (hashToken.status === "reading") {
    return (
      <>
        <AuthTitle>{t("auth_reset_title")}</AuthTitle>
        <Spinner />
      </>
    );
  }
  if (hashToken.status === "missing") {
    return (
      <>
        <AuthTitle>{t("auth_reset_title")}</AuthTitle>
        <Alert tone="warning">{t("auth_missing_token")}</Alert>
        <Link
          href={ROUTES.forgotPassword}
          className="text-primary hover:text-primary-hover text-sm font-medium"
        >
          {t("auth_forgot_title")}
        </Link>
      </>
    );
  }
  if (done) {
    return (
      <>
        <AuthTitle>{t("auth_reset_title")}</AuthTitle>
        <Alert tone="success">{t("auth_reset_success")}</Alert>
        <Link
          href={ROUTES.login}
          className="text-primary hover:text-primary-hover text-sm font-medium"
        >
          {t("auth_go_login")}
        </Link>
      </>
    );
  }

  return (
    <>
      <AuthTitle>{t("auth_reset_title")}</AuthTitle>
      <form
        noValidate
        className="flex flex-col gap-1"
        onSubmit={(event) => {
          event.preventDefault();
          void form.handleSubmit();
        }}
      >
        <form.Field
          name="newPassword"
          validators={{ onBlur: ({ value }) => AuthValidationHelper.newPassword(value, t) }}
        >
          {(field) => {
            const error = field.state.meta.isTouched ? (field.state.meta.errors[0] ?? null) : null;
            return (
              <FormField
                id="reset-password"
                label={t("auth_new_password_label")}
                error={error}
                hint={t("auth_password_hint", { min: PASSWORD_MIN_LENGTH })}
              >
                <Input
                  id="reset-password"
                  type="password"
                  autoComplete="new-password"
                  invalid={Boolean(error)}
                  aria-describedby="reset-password-message"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
              </FormField>
            );
          }}
        </form.Field>
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <Button type="submit" loading={isSubmitting} className="mt-3 w-full">
              {t("auth_reset_submit")}
            </Button>
          )}
        </form.Subscribe>
      </form>
    </>
  );
}
