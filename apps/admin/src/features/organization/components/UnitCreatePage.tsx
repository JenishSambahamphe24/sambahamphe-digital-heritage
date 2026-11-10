import { getRouteApi, Link } from "@tanstack/react-router";
import { useLocale, useTranslations } from "use-intl";

import { Spinner } from "@repo/ui";

import { I18nTextHelper } from "#/lib/i18n-text.helper";

import { useOrgUnit } from "../hooks/useOrgUnit";
import { UnitForm } from "./UnitForm";

const route = getRouteApi("/_authenticated/organization/new");

export function UnitCreatePage() {
  const t = useTranslations();
  const locale = useLocale();
  const { parentId } = route.useSearch();
  const parent = useOrgUnit(parentId);
  if (parentId && parent.isPending) {
    return <Spinner />;
  }
  return (
    <div className="flex flex-col gap-6">
      <Link to="/organization" className="text-primary text-sm hover:underline">
        ← {t("org_back")}
      </Link>
      <div>
        <h1 className="font-display text-2xl font-semibold">{t("org_unit_new_title")}</h1>
        {parent.data ? (
          <p className="text-foreground-muted text-sm">
            {t("org_unit_new_under", { parent: I18nTextHelper.pick(parent.data.nameI18n, locale) })}
          </p>
        ) : null}
      </div>
      <UnitForm parent={parent.data ? { id: parent.data.id, typeId: parent.data.typeId } : null} />
    </div>
  );
}
