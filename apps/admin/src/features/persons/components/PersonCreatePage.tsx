import { Link } from "@tanstack/react-router";
import { useTranslations } from "use-intl";

import { PersonForm } from "./PersonForm";

export function PersonCreatePage() {
  const t = useTranslations();
  return (
    <div className="flex flex-col gap-6">
      <Link to="/persons" className="text-primary text-sm hover:underline">
        ← {t("persons_back")}
      </Link>
      <h1 className="font-display text-2xl font-semibold">{t("person_new_title")}</h1>
      <PersonForm />
    </div>
  );
}
