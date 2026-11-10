import { getRouteApi, Link } from "@tanstack/react-router";
import { useLocale, useTranslations } from "use-intl";

import { Spinner } from "@repo/ui";

import { I18nTextHelper } from "#/lib/i18n-text.helper";

import { usePlace } from "../hooks/usePlace";
import { PlaceForm } from "./PlaceForm";

const newRoute = getRouteApi("/_authenticated/places/new");

export function PlaceCreatePage() {
  const t = useTranslations();
  const locale = useLocale();
  const { parentId } = newRoute.useSearch();
  const parent = usePlace(parentId);
  if (parentId && parent.isPending) {
    return <Spinner />;
  }
  return (
    <div className="flex flex-col gap-6">
      <Link to="/places" search={{ parentId }} className="text-primary text-sm hover:underline">
        ← {t("places_back")}
      </Link>
      <h1 className="font-display text-2xl font-semibold">{t("place_new_title")}</h1>
      <PlaceForm
        initialParent={
          parent.data
            ? { id: parent.data.id, label: I18nTextHelper.pick(parent.data.nameI18n, locale) }
            : null
        }
      />
    </div>
  );
}
