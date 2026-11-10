import type { TPlaceSummaryResponse } from "@repo/contracts";

import { useLocale } from "use-intl";

import { I18nTextHelper } from "#/lib/i18n-text.helper";

export interface PlacePathProps {
  ancestors: TPlaceSummaryResponse[];
}

export function PlacePath({ ancestors }: PlacePathProps) {
  const locale = useLocale();
  if (ancestors.length === 0) {
    return null;
  }
  return (
    <span className="text-foreground-muted text-xs">
      {ancestors.map((ancestor) => I18nTextHelper.pick(ancestor.nameI18n, locale)).join(" › ")}
    </span>
  );
}
