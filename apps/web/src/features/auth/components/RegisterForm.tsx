"use client";

import type { TLocale } from "#/i18n/routing";

import { useForm } from "@tanstack/react-form";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { PASSWORD_MIN_LENGTH } from "@repo/contracts";
import { Button, FormField, Input, ToastHelper } from "@repo/ui";

import { Link } from "#/i18n/navigation";
import { apiClient } from "#/lib/api-client";
import { ProblemMessageHelper } from "#/lib/problem-message.helper";
import { ROUTES } from "#/lib/routes";

import { AuthValidationHelper } from "../auth-validation.helper";
import { AuthTabs } from "./AuthTabs";
import { CheckEmailNotice } from "./CheckEmailNotice";

export function RegisterForm() {
  const t = useTranslations();
  const locale = useLocale() as TLocale;
  const [submitted, setSubmitted] = useState(false);

  const form = useForm({
    defaultValues: { displayName: "", email: "", password: "" },
    onSubmit: async ({ value }) => {
      try {
        const { error } = await apiClient.POST("/api/v1/auth/register", {
          body: { ...value, locale },
        });
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
      <AuthTabs active="register" />
      <h1 className="sr-only">{t("auth_register_title")}</h1>
      <form
        noValidate
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          void form.handleSubmit();
        }}
      >
        <form.Field
          name="displayName"
          validators={{ onBlur: ({ value }) => AuthValidationHelper.displayName(value, t) }}
        >
          {(field) => {
            const error = field.state.meta.isTouched ? (field.state.meta.errors[0] ?? null) : null;
            return (
              <FormField id="register-name" label={t("auth_display_name_label")} error={error}>
                <Input
                  id="register-name"
                  autoComplete="name"
                  invalid={Boolean(error)}
                  aria-describedby="register-name-message"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
              </FormField>
            );
          }}
        </form.Field>
        <form.Field
          name="email"
          validators={{ onBlur: ({ value }) => AuthValidationHelper.email(value, t) }}
        >
          {(field) => {
            const error = field.state.meta.isTouched ? (field.state.meta.errors[0] ?? null) : null;
            return (
              <FormField id="register-email" label={t("auth_email_label")} error={error}>
                <Input
                  id="register-email"
                  type="email"
                  autoComplete="email"
                  invalid={Boolean(error)}
                  aria-describedby="register-email-message"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
              </FormField>
            );
          }}
        </form.Field>
        <form.Field
          name="password"
          validators={{ onBlur: ({ value }) => AuthValidationHelper.newPassword(value, t) }}
        >
          {(field) => {
            const error = field.state.meta.isTouched ? (field.state.meta.errors[0] ?? null) : null;
            return (
              <FormField
                id="register-password"
                label={t("auth_password_label")}
                error={error}
                hint={t("auth_password_hint", { min: PASSWORD_MIN_LENGTH })}
              >
                <Input
                  id="register-password"
                  type="password"
                  autoComplete="new-password"
                  invalid={Boolean(error)}
                  aria-describedby="register-password-message"
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
            <Button type="submit" loading={isSubmitting} className="w-full">
              {t("auth_register_submit")}
            </Button>
          )}
        </form.Subscribe>
      </form>
      <p className="text-foreground-muted text-center text-sm lg:text-left">
        {t("auth_register_have_account")}{" "}
        <Link href={ROUTES.login} className="text-primary hover:text-primary-hover font-medium">
          {t("auth_register_login_link")}
        </Link>
      </p>
    </>
  );
}
