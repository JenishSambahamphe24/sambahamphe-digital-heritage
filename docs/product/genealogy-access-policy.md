# Family Tree Visibility and Access Policy
**Project:** Sambahamphe Utthan Sangh Digital Heritage Platform

> **Status:** Adopted product decision (2026-11-07). This is the organization's policy as supplied; it answers requirements Q-1. How it maps onto the technical design is described in [requirements.md §7](requirements.md#7-decisions-recorded) and [../database/schema-design.md §16](../database/schema-design.md#16-mapping-to-the-genealogy-access-policy).
>
> **Scope decision (Q-2, 2026-11-07):** the genealogy follows the **Sambahamphe male line only** — see ADR-020.

## 1. Core Policy

The family tree will use a hybrid access model:

- Public visitors can explore approved historical family records.
- Registered members can contribute information and request access to their family branches.
- Verified and authorized family members can access permitted information about living relatives.
- Genealogy administrators can manage and approve official family records.

**Default principle:** Historical heritage should be accessible; personal information about living individuals should be protected.

## 2. Access Levels

### Level 1: Public Visitors (No Login Required)

Public visitors can:
- Browse the approved historical family tree.
- View deceased ancestors and their historical family relationships.
- View approved historical biographies.
- Explore family branches and lineage.
- View approved public photographs and historical documents.
- Search public genealogy records.

Public visitors cannot:
- View private information about living people.
- View private family documents.
- View pending genealogy submissions.
- Edit or submit official family-tree changes.

### Level 2: Registered Members

Registered members can:
- Access all public genealogy information.
- Submit new family members.
- Suggest corrections to family relationships.
- Submit historical photographs and documents.
- Request association with an existing family branch.
- Track their own genealogy submissions.
- Request access to restricted family information.

Registration alone does not grant access to private information.

### Level 3: Verified Family Members

Verified family members can:
- Access permitted information about living relatives in authorized family branches.
- View additional family information according to privacy settings.
- Contribute information to authorized branches.
- Report incorrect or outdated family information.

Access must be granted according to verified family association and applicable privacy permissions.

### Level 4: Genealogy Editors

Genealogy editors can:
- Review new-person submissions.
- Review proposed family relationships.
- Verify submitted historical evidence.
- Identify and resolve duplicate records.
- Approve or reject genealogy changes.
- Correct existing records with version history.
- Manage authorized family branches.

### Level 5: Super Administrators

Super administrators can:
- Manage genealogy administrators and editors.
- Configure access permissions.
- Manage global privacy settings.
- Review audit logs.
- Manage genealogy system settings.

Administrative access must also be audited.

## 3. Living-Person Privacy

Living-person records must be private by default.

The platform must support:
- Private profile visibility.
- Restricted photographs and documents.
- Consent-based publication.
- Family-branch access restrictions.
- Individual privacy settings.
- Authorized access revocation.

A member submitting someone's information does not automatically grant permission to publish it.

## 4. Genealogy Contribution Workflow

1. A registered member searches for an existing person.
2. The member selects an existing family member as a relationship reference, or proposes a new branch.
3. The member submits the person's information and proposed relationship.
4. The system checks for potential duplicate records.
5. The submission enters the pending review queue.
6. A genealogy editor reviews the information and supporting evidence.
7. The editor approves, rejects, or requests corrections.
8. Approved records become part of the official family tree.
9. All changes are recorded in the audit history.

No submitted information should silently overwrite an approved historical relationship.

## 5. Recommended Database Support

The database should support:

- `Person`: Individual genealogy records.
- `RelationshipAssertion`: Proposed or verified family relationships.
- `GenealogySubmission`: Member-submitted changes.
- `FamilyBranch`: Family branch organization.
- `BranchMembership`: Association between members and family branches.
- `PrivacySetting`: Visibility and consent settings.
- `AccessGrant`: Explicit access permissions.
- `AuditLog`: History of administrative and genealogy changes.

Relationship records should have a review status, such as:
- Pending
- Under Review
- Approved
- Rejected
- Needs Correction
- Superseded

## 6. Recommended Public Website Experience

The public genealogy explorer should include:

- Interactive family-tree visualization.
- Search by ancestor name.
- Family branch navigation.
- Ancestor biographies.
- Historical photographs and documents.
- Historical lineage information.

Restricted living-person records should not expose private details through search results, APIs, exports, or family-tree visualization.

## 7. Final Product Decision

The platform will adopt:

**Public historical genealogy + registered member contributions + verified family access + administrator-controlled approval.**

This model balances heritage preservation, community participation, data accuracy, and personal privacy.

This policy should guide the frontend, backend APIs, database schema, authorization system, and future mobile application.
