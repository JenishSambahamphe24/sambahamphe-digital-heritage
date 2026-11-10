import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useTranslations } from "use-intl";

import { Button, Card, FormField, Input, ToastHelper } from "@repo/ui";

import { apiClient } from "#/lib/api-client";
import { BRAND_LOGO } from "#/lib/brand";
import { ProblemMessageHelper } from "#/lib/problem-message.helper";
import { QUERY_KEYS } from "#/lib/query-keys";

export function LoginPage() {
  const t = useTranslations();
  const navigate = useNavigate();
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
        await navigate({ to: "/users" });
      } catch {
        ToastHelper.show({ tone: "danger", description: t("error_network") });
      }
    },
  });

  return (
    <div className="bg-background flex min-h-screen items-center justify-center px-4">
      <Card className="flex w-full max-w-sm flex-col gap-5">
        <img
          src={BRAND_LOGO.src}
          width={BRAND_LOGO.width}
          height={BRAND_LOGO.height}
          alt={t("logo_alt")}
          className="h-20 w-auto self-center"
        />
        <div>
          <p className="text-accent text-sm font-medium">{t("admin_title")}</p>
          <h1 className="font-display text-2xl font-semibold">{t("login_title")}</h1>
          <p className="text-foreground-muted mt-1 text-sm">{t("login_hint")}</p>
        </div>
        <form
          noValidate
          className="flex flex-col gap-1"
          onSubmit={(event) => {
            event.preventDefault();
            void form.handleSubmit();
          }}
        >
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
              <Button type="submit" loading={isSubmitting} className="mt-3">
                {t("login_submit")}
              </Button>
            )}
          </form.Subscribe>
        </form>
      </Card>
    </div>
  );
}
