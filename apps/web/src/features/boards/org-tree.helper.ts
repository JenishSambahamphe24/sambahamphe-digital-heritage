import type { TOrgUnitNodeResponse } from "@repo/contracts";

export interface IOrgTreeNode extends TOrgUnitNodeResponse {
  children: IOrgTreeNode[];
}

export class OrgTreeHelper {
  // The API sends the tree flat; nest by parentId, keeping each level's sortOrder.
  static build(nodes: readonly TOrgUnitNodeResponse[]): IOrgTreeNode[] {
    const byId = new Map<string, IOrgTreeNode>(
      [...nodes]
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((node) => [node.id, { ...node, children: [] }]),
    );
    const roots: IOrgTreeNode[] = [];
    for (const node of byId.values()) {
      const parent = node.parentId ? byId.get(node.parentId) : undefined;
      (parent ? parent.children : roots).push(node);
    }
    return roots;
  }
}
