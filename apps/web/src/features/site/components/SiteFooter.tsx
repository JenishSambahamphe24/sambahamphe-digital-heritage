import { useTranslations } from "next-intl";

export function SiteFooter() {
  const t = useTranslations();
  return (
    <footer className="border-border mt-16 border-t">
      <p className="text-foreground-muted mx-auto max-w-5xl px-4 py-8 text-sm">
        {t("footer_text")}
      </p>
    </footer>
  );
}
