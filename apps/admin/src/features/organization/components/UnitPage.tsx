import { getRouteApi, Link } from "@tanstack/react-router";
import { useLocale, useTranslations } from "use-intl";

import { Card, Spinner } from "@repo/ui";

import { I18nTextHelper } from "#/lib/i18n-text.helper";

import { QueryError } from "../../layout/components/QueryError";
import { useOrgUnit } from "../hooks/useOrgUnit";
import { BoardSection } from "./BoardSection";
import { TermsSection } from "./TermsSection";
import { UnitForm } from "./UnitForm";

const route = getRouteApi("/_authenticated/organization/$unitId");

export function UnitPage() {
  const t = useTranslations();
  const locale = useLocale();
  const { unitId } = route.useParams();
  const unit = useOrgUnit(unitId);
  if (unit.isPending) {
    return <Spinner />;
  }
  if (unit.isError) {
    return <QueryError error={unit.error} />;
  }
  return (
    <div className="flex flex-col gap-6">
      <Link to="/organization" className="text-primary text-sm hover:underline">
        ← {t("org_back")}
      </Link>
      <div>
        <h1 className="font-display text-2xl font-semibold">
          {I18nTextHelper.pick(unit.data.nameI18n, locale)}
        </h1>
        {unit.data.ancestors.length > 0 ? (
          <p className="text-foreground-muted text-sm">
            {unit.data.ancestors
              .map((ancestor) => I18nTextHelper.pick(ancestor.nameI18n, locale))
              .join(" › ")}
          </p>
        ) : null}
      </div>
      <BoardSection unitId={unitId} />
      <TermsSection unitId={unitId} />
      <Card className="flex flex-col gap-4">
        <h2 className="font-display text-lg font-semibold">{t("org_unit_details")}</h2>
        {/* Keyed by version so the form restarts from the saved data after a save or reload. */}
        <UnitForm key={unit.data.version} unit={unit.data} />
      </Card>
    </div>
  );
}
