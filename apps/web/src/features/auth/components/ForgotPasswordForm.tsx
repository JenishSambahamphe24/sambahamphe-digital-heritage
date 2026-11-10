"use client";

import { useForm } from "@tanstack/react-form";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button, FormField, Input, ToastHelper } from "@repo/ui";

import { Link } from "#/i18n/navigation";
import { apiClient } from "#/lib/api-client";
import { ProblemMessageHelper } from "#/lib/problem-message.helper";
import { ROUTES } from "#/lib/routes";

import { AuthValidationHelper } from "../auth-validation.helper";
import { AuthTitle } from "./AuthTitle";
import { CheckEmailNotice } from "./CheckEmailNotice";

export function ForgotPasswordForm() {
  const t = useTranslations();
  const [submitted, setSubmitted] = useState(false);

  const form = useForm({
    defaultValues: { email: "" },
    onSubmit: async ({ value }) => {
      try {
        const { error } = await apiClient.POST("/api/v1/auth/password-reset", { body: value });
        if (error) {
          ToastHelper.show({
            tone: "danger",
            description: t(ProblemMessageHelper.keyFor(error.code)),
          });
          return;
        }
        setSubmitted(true);
      } catch {
        ToastHelper.show({ tone: "danger", description: t("error_network") });
      }
    },
  });

  if (submitted) {
    return <CheckEmailNotice />;
  }

  return (
    <>
      <AuthTitle>{t("auth_forgot_title")}</AuthTitle>
      <p className="text-foreground-muted text-sm">{t("auth_forgot_intro")}</p>
      <form
        noValidate
        className="flex flex-col gap-1"
        onSubmit={(event) => {
          event.preventDefault();
          void form.handleSubmit();
        }}
      >
        <form.Field
          name="email"
          validators={{ onBlur: ({ value }) => AuthValidationHelper.email(value, t) }}
        >
          {(field) => {
            const error = field.state.meta.isTouched ? (field.state.meta.errors[0] ?? null) : null;
            return (
              <FormField id="forgot-email" label={t("auth_email_label")} error={error}>
                <Input
                  id="forgot-email"
                  type="email"
                  autoComplete="email"
                  invalid={Boolean(error)}
                  aria-describedby="forgot-email-message"
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
              {t("auth_forgot_submit")}
            </Button>
          )}
        </form.Subscribe>
      </form>
      <Link
        href={ROUTES.login}
        className="text-primary hover:text-primary-hover text-sm font-medium"
      >
        {t("auth_go_login")}
      </Link>
    </>
  );
}
