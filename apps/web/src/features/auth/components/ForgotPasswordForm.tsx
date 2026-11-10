"use client";

import { useForm } from "@tanstack/react-form";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Alert, Button, FormField, Input } from "@repo/ui";

import { apiClient } from "#/lib/api-client";
import { ProblemMessageHelper } from "#/lib/problem-message.helper";

import { AuthValidationHelper } from "../auth-validation.helper";
import { AuthCard } from "./AuthCard";
import { CheckEmailNotice } from "./CheckEmailNotice";

export function ForgotPasswordForm() {
  const t = useTranslations();
  const [formError, setFormError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const form = useForm({
    defaultValues: { email: "" },
    onSubmit: async ({ value }) => {
      setFormError(null);
      try {
        const { error } = await apiClient.POST("/api/v1/auth/password-reset", { body: value });
        if (error) {
          setFormError(t(ProblemMessageHelper.keyFor(error.code)));
          return;
        }
        setSubmitted(true);
      } catch {
        setFormError(t("error_network"));
      }
    },
  });

  return (
    <AuthCard title={t("auth_forgot_title")}>
      {submitted ? (
        <CheckEmailNotice />
      ) : (
        <form
          noValidate
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            void form.handleSubmit();
          }}
        >
          <p className="text-foreground-muted text-sm">{t("auth_forgot_intro")}</p>
          {formError ? <Alert tone="danger">{formError}</Alert> : null}
          <form.Field
            name="email"
            validators={{ onBlur: ({ value }) => AuthValidationHelper.email(value, t) }}
          >
            {(field) => {
              const error = field.state.meta.isTouched
                ? (field.state.meta.errors[0] ?? null)
                : null;
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
              <Button type="submit" loading={isSubmitting}>
                {t("auth_forgot_submit")}
              </Button>
            )}
          </form.Subscribe>
        </form>
      )}
    </AuthCard>
  );
}
