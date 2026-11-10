import type { TOrgUnitNodeResponse } from "@repo/contracts";

export interface IOrgTreeNode extends TOrgUnitNodeResponse {
  children: IOrgTreeNode[];
}

export class OrgTreeHelper {
  static build(nodes: readonly TOrgUnitNodeResponse[]): IOrgTreeNode[] {
    const byId = new Map<string, IOrgTreeNode>(
      nodes.map((node) => [node.id, { ...node, children: [] }]),
    );
    const roots: IOrgTreeNode[] = [];
    for (const node of byId.values()) {
      const parent = node.parentId ? byId.get(node.parentId) : undefined;
      (parent ? parent.children : roots).push(node);
    }
    return roots;
  }
}
