"use client";

import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Alert, Button, FormField, Input } from "@repo/ui";

import { Link, useRouter } from "#/i18n/navigation";
import { apiClient } from "#/lib/api-client";
import { ProblemMessageHelper } from "#/lib/problem-message.helper";
import { QUERY_KEYS } from "#/lib/query-keys";
import { ROUTES } from "#/lib/routes";

import { AuthValidationHelper } from "../auth-validation.helper";
import { AuthCard } from "./AuthCard";

export function LoginForm() {
  const t = useTranslations();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: { email: "", password: "" },
    onSubmit: async ({ value }) => {
      setFormError(null);
      try {
        const { error } = await apiClient.POST("/api/v1/auth/login", { body: value });
        if (error) {
          setFormError(t(ProblemMessageHelper.keyFor(error.code)));
          return;
        }
        await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.me });
        router.push(ROUTES.account);
      } catch {
        setFormError(t("error_network"));
      }
    },
  });

  return (
    <AuthCard title={t("auth_login_title")}>
      <form
        noValidate
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          void form.handleSubmit();
        }}
      >
        {formError ? <Alert tone="danger">{formError}</Alert> : null}
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
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <Button type="submit" loading={isSubmitting}>
              {t("auth_login_submit")}
            </Button>
          )}
        </form.Subscribe>
      </form>
      <div className="flex flex-col gap-2 text-sm">
        <Link href={ROUTES.forgotPassword} className="text-primary hover:underline">
          {t("auth_login_forgot")}
        </Link>
        <p className="text-foreground-muted">
          {t("auth_login_no_account")}{" "}
          <Link href={ROUTES.register} className="text-primary hover:underline">
            {t("auth_login_register_link")}
          </Link>
        </p>
      </div>
    </AuthCard>
  );
}
