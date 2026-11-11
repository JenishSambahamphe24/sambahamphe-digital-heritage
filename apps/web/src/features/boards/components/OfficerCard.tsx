import type { TBoardResponse } from "@repo/contracts";

import { useLocale, useTranslations } from "next-intl";

import { IsoDateFormatHelper } from "@repo/dates";

import { I18nTextHelper } from "#/lib/i18n-text.helper";

import { BoardTermHelper } from "../board-term.helper";
import { MemberAvatar } from "./MemberAvatar";

export interface OfficerCardProps {
  member: TBoardResponse["members"][number];
}

export function OfficerCard({ member }: OfficerCardProps) {
  const t = useTranslations();
  const locale = BoardTermHelper.locale(useLocale());
  return (
    <div className="border-border bg-surface flex items-center gap-4 rounded-lg border p-5">
      <MemberAvatar name={member.displayName} size="lg" />
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-accent text-sm font-semibold">
          {I18nTextHelper.pick(member.position.titleI18n, locale)}
        </span>
        <span className="text-lg font-semibold">{member.displayName}</span>
        <span className="text-foreground-muted text-sm">
          {t("board_appointment", {
            type: member.appointmentType,
            date: IsoDateFormatHelper.format(member.startsOn, member.datePrecision, locale),
          })}
        </span>
      </div>
    </div>
  );
}
