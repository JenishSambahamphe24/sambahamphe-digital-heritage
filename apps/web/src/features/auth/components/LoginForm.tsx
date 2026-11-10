"use client";

import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

import { Button, FormField, Input, ToastHelper } from "@repo/ui";

import { Link, useRouter } from "#/i18n/navigation";
import { apiClient } from "#/lib/api-client";
import { ProblemMessageHelper } from "#/lib/problem-message.helper";
import { QUERY_KEYS } from "#/lib/query-keys";
import { ROUTES } from "#/lib/routes";

import { AuthValidationHelper } from "../auth-validation.helper";
import { AuthTabs } from "./AuthTabs";

export function LoginForm() {
  const t = useTranslations();
  const router = useRouter();
  const queryClient = useQueryClient();

  const form = useForm({
    defaultValues: { email: "", password: "" },
    onSubmit: async ({ value }) => {
      try {
        const { error } = await apiClient.POST("/api/v1/auth/login", { body: value });
        if (error) {
          ToastHelper.show({
            tone: "danger",
            description: t(ProblemMessageHelper.keyFor(error.code)),
          });
          return;
        }
        await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.me });
        router.push(ROUTES.account);
      } catch {
        ToastHelper.show({ tone: "danger", description: t("error_network") });
      }
    },
  });

  return (
    <>
      <AuthTabs active="login" />
      <h1 className="sr-only">{t("auth_login_title")}</h1>
      <form
        noValidate
        className="flex flex-col gap-4"
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
              <FormField id="login-email" label={t("auth_email_label")} error={error}>
                <Input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  invalid={Boolean(error)}
                  aria-describedby="login-email-message"
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
          validators={{ onBlur: ({ value }) => AuthValidationHelper.requiredPassword(value, t) }}
        >
          {(field) => {
            const error = field.state.meta.isTouched ? (field.state.meta.errors[0] ?? null) : null;
            return (
              <FormField id="login-password" label={t("auth_password_label")} error={error}>
                <Input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  invalid={Boolean(error)}
                  aria-describedby="login-password-message"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
              </FormField>
            );
          }}
        </form.Field>
        <div className="flex justify-end">
          <Link
            href={ROUTES.forgotPassword}
            className="text-primary hover:text-primary-hover py-3 text-sm font-medium lg:py-0"
          >
            {t("auth_login_forgot")}
          </Link>
        </div>
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <Button type="submit" loading={isSubmitting} className="w-full">
              {t("auth_login_submit")}
            </Button>
          )}
        </form.Subscribe>
      </form>
      <p className="text-foreground-muted text-center text-sm lg:text-left">
        {t("auth_login_no_account")}{" "}
        <Link href={ROUTES.register} className="text-primary hover:text-primary-hover font-medium">
          {t("auth_login_register_link")}
        </Link>
      </p>
    </>
  );
}
