import type { TBoardResponse } from "@repo/contracts";

import { useLocale, useTranslations } from "next-intl";

import { IsoDateFormatHelper } from "@repo/dates";

import { I18nTextHelper } from "#/lib/i18n-text.helper";

import { BoardTermHelper } from "../board-term.helper";

export interface MembersTableProps {
  members: TBoardResponse["members"];
}

export function MembersTable({ members }: MembersTableProps) {
  const t = useTranslations();
  const locale = BoardTermHelper.locale(useLocale());
  return (
    <div className="border-border bg-surface overflow-x-auto rounded-lg border">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="text-foreground-muted">
          <tr>
            <th scope="col" className="border-border border-b px-5 py-3 font-semibold">
              {t("board_col_name")}
            </th>
            <th scope="col" className="border-border border-b px-5 py-3 font-semibold">
              {t("board_col_position")}
            </th>
            <th scope="col" className="border-border border-b px-5 py-3 font-semibold">
              {t("board_col_how")}
            </th>
            <th scope="col" className="border-border border-b px-5 py-3 font-semibold">
              {t("board_col_since")}
            </th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <tr key={`${member.position.id}-${member.personId}`}>
              <td className="border-border border-b px-5 py-3 font-medium">{member.displayName}</td>
              <td className="border-border border-b px-5 py-3">
                {I18nTextHelper.pick(member.position.titleI18n, locale)}
              </td>
              <td className="border-border border-b px-5 py-3">
                <span className="bg-surface-muted text-foreground-muted rounded-full px-2.5 py-0.5 text-xs font-semibold">
                  {t("board_appointment_type", { type: member.appointmentType })}
                </span>
              </td>
              <td className="border-border text-foreground-muted border-b px-5 py-3 whitespace-nowrap">
                {IsoDateFormatHelper.format(member.startsOn, member.datePrecision, locale)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
