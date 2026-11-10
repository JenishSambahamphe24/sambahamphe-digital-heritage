import type { IOrgTreeNode } from "../org-tree.helper";

import { Link } from "@tanstack/react-router";
import { useLocale, useTranslations } from "use-intl";

import { I18nTextHelper } from "#/lib/i18n-text.helper";

export interface OrgTreeItemProps {
  node: IOrgTreeNode;
}

export function OrgTreeItem({ node }: OrgTreeItemProps) {
  const t = useTranslations();
  const locale = useLocale();
  return (
    <li className="flex flex-col gap-1">
      <div className="hover:bg-surface-muted flex items-center justify-between gap-3 rounded-md px-3 py-2">
        <Link to="/organization/$unitId" params={{ unitId: node.id }} className="flex flex-col">
          <span className="text-primary font-medium hover:underline">
            {I18nTextHelper.pick(node.nameI18n, locale)}
          </span>
          <span className="text-foreground-muted text-xs">
            {t("org_unit_type", { type: node.typeKey })}
            {node.status !== "active" ? ` · ${t("org_unit_status", { status: node.status })}` : ""}
          </span>
        </Link>
        <Link
          to="/organization/new"
          search={{ parentId: node.id }}
          className="text-primary shrink-0 text-sm hover:underline"
        >
          {t("org_add_under")}
        </Link>
      </div>
      {node.children.length > 0 ? (
        <ul className="border-border ml-4 flex flex-col gap-1 border-l pl-2">
          {node.children.map((child) => (
            <OrgTreeItem key={child.id} node={child} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}
