export const PERMISSION = {
  userRead: "user:read",
  roleRead: "role:read",
  roleAssign: "role:assign",
  auditRead: "audit:read",
  placeManage: "place:manage",
  genealogyEdit: "genealogy:edit",
  orgManage: "org:manage",
} as const;

export type TPermission = (typeof PERMISSION)[keyof typeof PERMISSION];

export const PERMISSION_DESCRIPTIONS: Record<TPermission, string> = {
  [PERMISSION.userRead]: "View user accounts",
  [PERMISSION.roleRead]: "View roles and role assignments",
  [PERMISSION.roleAssign]: "Assign and revoke roles",
  [PERMISSION.auditRead]: "Read the audit log",
  [PERMISSION.placeManage]: "Create and edit places",
  [PERMISSION.genealogyEdit]: "Create and edit people directly (auto-approved change requests)",
  [PERMISSION.orgManage]:
    "Manage boards, terms, positions and appointments (can be limited to one board and those under it)",
};

export const SUPER_ADMIN_ROLE = "super_admin";

export interface ISystemRole {
  key: string;
  name: string;
  description: string;
  permissions: TPermission[];
}

// Roles without permissions yet get them as their modules are built; they can
// already be assigned, and any role lets its holder sign in to the admin CMS.
export const SYSTEM_ROLES: ISystemRole[] = [
  {
    key: SUPER_ADMIN_ROLE,
    name: "Super administrator",
    description: "Technical owner. Implicitly holds every permission.",
    permissions: [],
  },
  {
    key: "admin",
    name: "Administrator",
    description: "Runs the platform: users, roles, audit log.",
    permissions: [
      PERMISSION.userRead,
      PERMISSION.roleRead,
      PERMISSION.roleAssign,
      PERMISSION.auditRead,
    ],
  },
  {
    key: "content_editor",
    name: "Content editor",
    description: "Manages articles, heritage pages, announcements, events and galleries.",
    permissions: [],
  },
  {
    key: "contributor",
    name: "Contributor",
    description: "Drafts articles and stories for review.",
    permissions: [],
  },
  {
    key: "genealogy_editor",
    name: "Genealogy editor",
    description: "Reviews and approves genealogy submissions; manages branches.",
    permissions: [PERMISSION.genealogyEdit, PERMISSION.placeManage],
  },
  {
    key: "org_manager",
    name: "Organization manager",
    description: "Manages boards, committees, terms and appointments.",
    permissions: [PERMISSION.orgManage],
  },
  {
    key: "media_manager",
    name: "Media manager",
    description: "Manages the media library and galleries.",
    permissions: [],
  },
];
