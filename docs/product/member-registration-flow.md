# Family Tree Member Registration & Contribution Flow

> **Status:** Adopted product decision (2026-11-07), as supplied by the organization. Companion to [genealogy-access-policy.md](genealogy-access-policy.md). How it maps onto the design, and where it was clarified, is in [requirements.md §7](requirements.md#7-decisions-recorded) and [../database/schema-design.md §16](../database/schema-design.md#16-mapping-to-the-genealogy-access-policy). The genealogy follows the male line only (ADR-020), which limits which relationships can be added (§3).

## 1. Core Concept

Keep **member accounts** separate from **genealogy person records**.

- `User`: Login account used to access the platform.
- `Person`: Individual record in the family tree.
- `UserPersonLink`: Connects a verified user account to an existing person record.

A person may already exist in the historical family tree before creating a platform account. Registration must not create duplicate person records.

## 2. Member Registration & Identity Claim

1. User registers using their name, email/mobile, and password.
2. User verifies their email or mobile number.
3. System asks: "Are you already listed in the family tree?"
4. If yes, user searches for their existing person record.
5. User selects the matching record and submits a claim request.
6. User provides relevant family details or supporting evidence for verification.
7. Genealogy administrator reviews the claim.
8. Once approved, the user's account is linked to the existing `Person` record.
9. User can access their member dashboard and permitted family-tree information.

If no existing record is found, the user can request a new person record through the genealogy contribution workflow.

## 3. Adding a Family Member

After verification, a member can navigate to:

`My Family Tree → Add Family Member`

1. Select relationship: Son, Daughter, Father, Mother, Spouse, Sibling, etc.
2. Enter the person's basic information.
3. System checks for potential duplicate person records.
4. If a matching person exists, propose linking the relationship to that record.
5. Otherwise, submit a new person record proposal.
6. Create a proposed relationship between the existing person and the new/matched person.
7. Submission enters the genealogy review queue.
8. Genealogy editor reviews the details and supporting evidence.
9. Editor can approve, reject, or request corrections.
10. Once approved, the person and relationship become part of the official family tree.

## 4. Administrative Workflow

Back-office genealogy editors should be able to:

- Review member identity claims.
- Verify user-to-person associations.
- Review new-person submissions.
- Review proposed family relationships.
- Detect and resolve duplicate records.
- Approve, reject, or request corrections.
- Correct existing records with version history.
- View complete audit history.

Members must not directly overwrite approved genealogy records.

## 5. Privacy & Permissions

- Public visitors can browse approved historical genealogy records.
- Living-person information is private by default.
- Registered membership does not automatically grant access to all living-person records.
- Verified members can request access to their authorized family branches.
- Members can contribute information only within permitted rules.
- Adding a minor requires appropriate parent/guardian authority and restricted privacy.
- Submission of personal information does not automatically imply consent to public publication.

## 6. Suggested Database Entities

- `users`: Authentication and account information.
- `persons`: Genealogy person records.
- `user_person_links`: Verified association between users and persons.
- `verification_requests`: Identity and family-connection claims.
- `genealogy_submissions`: Proposed genealogy changes.
- `relationship_assertions`: Family relationships with review status.
- `family_branches`: Family branch organization.
- `branch_memberships`: User access to family branches.
- `privacy_settings`: Person-level visibility and consent settings.
- `audit_logs`: History of genealogy and administrative changes.

## 7. Important Architectural Rules

1. Never create a duplicate person record when a matching historical record already exists.
2. Never combine authentication accounts with genealogy person records.
3. Model people and relationships separately.
4. Store relationships as reviewable assertions with statuses such as `PENDING`, `UNDER_REVIEW`, `APPROVED`, `REJECTED`, and `SUPERSEDED`.
5. Preserve historical changes through audit logs and version history.
6. Keep living-person privacy restricted by default.
7. Design the system so future mobile applications use the same backend APIs.

## Expected Result

A community-driven genealogy platform where members can claim their existing family identity, connect their account to historical records, and contribute new generations to the family tree, while genealogy administrators maintain data accuracy, verification, and privacy.
