import { getLocale, getTranslations } from "next-intl/server";

import { Link } from "#/i18n/navigation";
import { I18nTextHelper } from "#/lib/i18n-text.helper";
import { ROUTES } from "#/lib/routes";

import { BoardTermHelper } from "../../boards/board-term.helper";
import { BoardsDataHelper } from "../../boards/boards-data.helper";
import { MemberAvatar } from "../../boards/components/MemberAvatar";

const TEASER_OFFICERS = 4;

// The top board's office-bearers. Hidden when the API is down or there is no
// board yet, so the home page never shows an error for an extra.
export async function HomeBoardTeaser() {
  const units = await BoardsDataHelper.units();
  const root = units
    ?.filter((unit) => unit.parentId === null && unit.status === "active")
    .sort((a, b) => a.sortOrder - b.sortOrder)[0];
  const board = root ? await BoardsDataHelper.board(root.id) : null;
  const officers = (board?.members ?? [])
    .filter((member) => member.position.isOfficeBearer)
    .slice(0, TEASER_OFFICERS);
  if (!root || !board?.term || officers.length === 0) {
    return null;
  }
  const t = await getTranslations();
  const locale = BoardTermHelper.locale(await getLocale());

  return (
    <section aria-labelledby="home-board" className="mx-auto max-w-7xl px-4 py-20 md:px-12">
      <Link
        href={`${ROUTES.boards}/${root.slug}`}
        className="border-border bg-surface hover:bg-surface-muted flex flex-wrap items-center gap-x-12 gap-y-6 rounded-xl border p-7 transition-colors"
      >
        <span className="flex min-w-0 flex-1 basis-72 flex-col gap-1.5">
          <span className="text-accent text-xs font-semibold tracking-wider uppercase">
            {t("home_board_eyebrow", {
              name: I18nTextHelper.pick(root.nameI18n, locale),
              term: BoardTermHelper.label(board.term, locale),
            })}
          </span>
          <span id="home-board" className="font-display text-2xl font-semibold">
            {t("home_board_title")}
          </span>
          <span className="text-primary mt-2 text-sm font-semibold">{t("home_board_link")}</span>
        </span>
        <span className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {officers.map((member) => (
            <span
              key={`${member.position.id}-${member.personId}`}
              className="flex items-center gap-2.5"
            >
              <MemberAvatar name={member.displayName} />
              <span className="flex flex-col">
                <span className="text-sm font-semibold">{member.displayName}</span>
                <span className="text-foreground-muted text-xs">
                  {I18nTextHelper.pick(member.position.titleI18n, locale)}
                </span>
              </span>
            </span>
          ))}
        </span>
      </Link>
    </section>
  );
}
