import { useTranslations } from "next-intl";
import Image from "next/image";

import { Card } from "@repo/ui";

import { Link } from "#/i18n/navigation";
import { HERITAGE_IMAGES } from "#/lib/brand";
import { ROUTES } from "#/lib/routes";

// Design: docs/design/canvas/CheckEmail.dc.html.
export function CheckEmailNotice() {
  const t = useTranslations();
  return (
    <Card className="flex flex-col items-center gap-5 text-center">
      <Image
        src={HERITAGE_IMAGES.illustration.src}
        width={HERITAGE_IMAGES.illustration.width}
        height={HERITAGE_IMAGES.illustration.height}
        alt={t("auth_illustration_alt")}
        sizes="180px"
        className="size-45 object-contain"
      />
      <h1 className="font-display text-foreground text-2xl font-semibold">
        {t("auth_check_email_title")}
      </h1>
      <p className="text-foreground-muted max-w-90 text-sm">{t("auth_check_email_body")}</p>
      <Link
        href={ROUTES.login}
        className="border-border-strong bg-surface text-foreground hover:bg-surface-muted inline-flex h-10 w-full items-center justify-center rounded-md border px-4 text-sm font-medium"
      >
        {t("auth_go_login")}
      </Link>
    </Card>
  );
}
