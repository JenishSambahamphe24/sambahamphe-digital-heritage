import { Link } from "@tanstack/react-router";
import { useTranslations } from "use-intl";

import { Card, Spinner } from "@repo/ui";

import { QueryError } from "../../layout/components/QueryError";
import { useOrgTree } from "../hooks/useOrgTree";
import { OrgTreeHelper } from "../org-tree.helper";
import { OrgTreeItem } from "./OrgTreeItem";

export function OrganizationPage() {
  const t = useTranslations();
  const tree = useOrgTree();
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold">{t("org_title")}</h1>
        <Link
          to="/organization/positions"
          className="border-border-strong bg-surface hover:bg-surface-muted inline-flex h-10 items-center rounded-md border px-4 text-sm font-medium"
        >
          {t("org_positions")}
        </Link>
      </div>
      <p className="text-foreground-muted text-sm">{t("org_hint")}</p>
      {tree.isPending ? (
        <Spinner />
      ) : tree.isError ? (
        <QueryError error={tree.error} />
      ) : (
        <Card>
          <ul className="flex flex-col gap-1">
            {OrgTreeHelper.build(tree.data).map((node) => (
              <OrgTreeItem key={node.id} node={node} />
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
