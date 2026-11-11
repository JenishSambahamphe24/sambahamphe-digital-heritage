import { getLocale, getTranslations } from "next-intl/server";

import { Alert } from "@repo/ui";

import { I18nTextHelper } from "#/lib/i18n-text.helper";

import { BoardsDataHelper } from "../boards-data.helper";
import { OrgTreeHelper } from "../org-tree.helper";
import { BoardHighlight } from "./BoardHighlight";
import { UnitCard } from "./UnitCard";

export async function BoardsPage() {
  const t = await getTranslations();
  const locale = await getLocale();
  const [units, types] = await Promise.all([
    BoardsDataHelper.units(),
    BoardsDataHelper.unitTypes(),
  ]);
  const typeName = (key: string) => {
    const type = types?.find((candidate) => candidate.key === key);
    return type ? I18nTextHelper.pick(type.nameI18n, locale) : "";
  };
  const roots = units ? OrgTreeHelper.build(units.filter((unit) => unit.status === "active")) : [];
  // One request per card, in parallel: a few dozen boards at most.
  const boards = new Map(
    await Promise.all(
      roots
        .flatMap((root) => [root, ...root.children])
        .map(async (unit) => [unit.id, await BoardsDataHelper.board(unit.id)] as const),
    ),
  );

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 pt-14 pb-22 md:px-12">
      <header className="flex flex-col gap-4">
        <h1 className="font-display text-4xl font-semibold">{t("boards_title")}</h1>
        <p className="text-foreground-muted max-w-2xl text-lg">{t("boards_intro")}</p>
      </header>

      {!units ? <Alert tone="danger">{t("boards_load_failed")}</Alert> : null}
      {units && roots.length === 0 ? (
        <p className="text-foreground-muted">{t("boards_empty")}</p>
      ) : null}

      {roots.map((root) => (
        <section key={root.id} className="flex flex-col gap-8">
          <BoardHighlight
            unit={root}
            typeName={typeName(root.typeKey)}
            board={boards.get(root.id) ?? null}
          />
          {root.children.length > 0 ? (
            <div className="flex flex-col gap-4">
              <h2 className="font-display text-2xl font-semibold">
                {t("boards_under", { name: I18nTextHelper.pick(root.nameI18n, locale) })}
              </h2>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                {root.children.map((child) => (
                  <UnitCard
                    key={child.id}
                    unit={child}
                    typeName={typeName(child.typeKey)}
                    board={boards.get(child.id) ?? null}
                    childTypeName={typeName}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </section>
      ))}
    </div>
  );
}
