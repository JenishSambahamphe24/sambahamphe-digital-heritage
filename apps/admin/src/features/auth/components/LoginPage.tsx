import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslations } from "use-intl";

import { Alert, Button, Card, FormField, Input } from "@repo/ui";

import { apiClient } from "#/lib/api-client";
import { ProblemMessageHelper } from "#/lib/problem-message.helper";
import { QUERY_KEYS } from "#/lib/query-keys";

export function LoginPage() {
  const t = useTranslations();
  const navigate = useNavigate();
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
        await navigate({ to: "/users" });
      } catch {
        setFormError(t("error_network"));
      }
    },
  });

  return (
    <div className="bg-background flex min-h-screen items-center justify-center px-4">
      <Card className="flex w-full max-w-sm flex-col gap-5">
        <div>
          <p className="text-accent text-sm font-medium">{t("admin_title")}</p>
          <h1 className="font-display text-2xl font-semibold">{t("login_title")}</h1>
          <p className="text-foreground-muted mt-1 text-sm">{t("login_hint")}</p>
        </div>
        <form
          noValidate
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            void form.handleSubmit();
          }}
        >
          {formError ? <Alert tone="danger">{formError}</Alert> : null}
          <form.Field name="email">
            {(field) => (
              <FormField id="admin-email" label={t("login_email")}>
                <Input
                  id="admin-email"
                  type="email"
                  autoComplete="email"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
              </FormField>
            )}
          </form.Field>
          <form.Field name="password">
            {(field) => (
              <FormField id="admin-password" label={t("login_password")}>
                <Input
                  id="admin-password"
                  type="password"
                  autoComplete="current-password"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
              </FormField>
            )}
          </form.Field>
          <form.Subscribe selector={(state) => state.isSubmitting}>
            {(isSubmitting) => (
              <Button type="submit" loading={isSubmitting}>
                {t("login_submit")}
              </Button>
            )}
          </form.Subscribe>
        </form>
      </Card>
    </div>
  );
}
