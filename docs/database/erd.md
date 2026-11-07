# Entity-Relationship Diagrams

Status: **Draft for review** (Phase 0). Column-level detail and constraints are in [schema-design.md](schema-design.md); these diagrams show entities and cardinality only. Audit columns (`created_at`, `created_by`, …) are omitted. Split by bounded context — `PERSONS`, `PLACES`, `MEDIA_ASSETS` and `USERS` are shared and appear in several diagrams.

## 1. Context map

```mermaid
flowchart TB
  subgraph Access[Identity & Access]
    USERS --- ROLE_ASSIGNMENTS --- ROLES
  end
  subgraph People[People & Genealogy]
    PERSONS --- PARENT_CHILD
    PERSONS --- UNIONS
    PERSONS --- FAMILY_BRANCHES
    CHANGE_REQUESTS
  end
  subgraph Gov[Governance]
    ORG_UNITS --- TERMS --- APPOINTMENTS
  end
  subgraph Pub[Publishing]
    CONTENT_ITEMS
    EVENTS
  end
  subgraph Med[Media]
    MEDIA_ASSETS --- GALLERIES
  end
  PLACES

  USERS -. claims .-> PERSONS
  APPOINTMENTS -->|person| PERSONS
  CONTENT_ITEMS -. subjects .-> PERSONS
  MEDIA_ASSETS -. photo tags .-> PERSONS
  EVENTS -->|organized by| ORG_UNITS
  GALLERIES --> EVENTS
  ROLE_ASSIGNMENTS -. scope .-> ORG_UNITS
  ROLE_ASSIGNMENTS -. scope .-> FAMILY_BRANCHES
  PERSONS --> PLACES
  EVENTS --> PLACES
  ORG_UNITS --> PLACES
```

## 2. People & genealogy

```mermaid
erDiagram
  CLANS ||--o{ PERSONS : "birth clan (attribute only)"
  PERSONS ||--o{ PERSON_NAMES : has
  PERSONS ||--o{ PERSON_TRANSLATIONS : "biography per locale"
  PERSONS ||--o{ PERSON_PLACES : "lived / originated"
  PLACES  ||--o{ PERSON_PLACES : ""
  PERSONS ||--o{ PERSON_MEDIA : ""
  PERSONS ||--o{ PERSON_CONSENTS : ""
  PERSONS ||--o{ PERSON_ACCESS_GRANTS : ""
  PERSONS |o--o{ PERSONS : "merged_into"

  PERSONS ||--o{ PARENT_CHILD : "as parent"
  PERSONS ||--o{ PARENT_CHILD : "as child"
  UNIONS  |o--o{ PARENT_CHILD : "child of union (optional)"
  UNIONS  ||--|{ UNION_PARTNERS : ""
  PERSONS ||--o{ UNION_PARTNERS : "partner in"

  FAMILY_BRANCHES |o--o{ FAMILY_BRANCHES : "sub-branch"
  PERSONS |o--o{ FAMILY_BRANCHES : "founder"
  PERSONS ||--o{ PERSON_BRANCHES : ""
  FAMILY_BRANCHES ||--o{ PERSON_BRANCHES : ""

  SOURCES ||--o{ CITATIONS : ""
  PERSONS |o--o{ CITATIONS : "cites"
  PARENT_CHILD |o--o{ CITATIONS : "cites"
  UNIONS |o--o{ CITATIONS : "cites"

  PERSONS {
    uuid id PK
    enum record_status "active|merged|retracted"
    uuid merged_into_id FK
    enum lineage_role "lineage|spouse"
    bool is_founding_ancestor
    enum gender "required for lineage"
    enum living_status
    jsonb birth_date "fuzzy + sort_from/to"
    jsonb death_date "fuzzy + sort_from/to"
    uuid birth_clan_id FK
    enum visibility
    jsonb field_visibility
    enum verification_status
    int version
  }
  PERSON_NAMES {
    uuid id PK
    uuid person_id FK
    enum name_type
    text full_name
    text script "Deva|Limb|Latn"
    text romanized "search"
    bool is_primary
  }
  PARENT_CHILD {
    uuid id PK
    uuid parent_id FK
    uuid child_id FK
    enum kind "biological|adoptive|step|foster|guardian|unknown"
    uuid union_id FK
    enum status "accepted|disputed|superseded|rejected|retracted"
    enum confidence
    int version
  }
  UNIONS {
    uuid id PK
    enum kind
    jsonb start_date
    jsonb end_date
    enum end_reason
    enum status
    int version
  }
  UNION_PARTNERS {
    uuid union_id PK
    uuid person_id PK
    int sequence_for_person
  }
  FAMILY_BRANCHES {
    uuid id PK
    uuid parent_branch_id FK
    uuid founder_person_id FK
    text slug
  }
```

### 2.1 How a family is represented (male line, ADR-020)

```mermaid
flowchart LR
  F[Father<br/>lineage, male] ---|partner| U1((Union 1<br/>marriage))
  W1[Wife 1<br/>spouse, Nembang clan] ---|partner| U1
  F ---|partner| U2((Union 2<br/>marriage))
  W2[Wife 2<br/>spouse] ---|partner| U2
  F -->|biological, union=U1| S1[Son A<br/>lineage]
  W1 -->|biological, union=U1| S1
  F -->|biological, union=U2| D1[Daughter B<br/>lineage]
  W2 -->|biological, union=U2| D1
  S1 -->|line continues| G[Grandson<br/>lineage]
```

Each parent edge is independent, so a child with an unknown mother simply has one edge. Half-siblings are distinguished by `union_id`. Descent continues only through sons, biological or adopted: Son A can have children recorded. Daughter B's record ends with her; her marriage and children are not recorded. Several founding ancestors head the top-level branches.

## 3. Contributions & revisions

```mermaid
erDiagram
  USERS ||--o{ CHANGE_REQUESTS : submits
  USERS |o--o{ CHANGE_REQUESTS : reviews
  CHANGE_REQUESTS ||--|{ CHANGE_REQUEST_OPERATIONS : contains
  CHANGE_REQUESTS ||--o{ CHANGE_REQUEST_COMMENTS : ""
  CHANGE_REQUEST_OPERATIONS |o--o{ CHANGE_REQUEST_COMMENTS : "inline"
  CHANGE_REQUESTS |o--o{ ENTITY_REVISIONS : produces

  CHANGE_REQUESTS {
    uuid id PK
    enum domain
    enum status "pending|under_review|needs_correction|approved|rejected|withdrawn"
    bool auto_approved
    uuid submitted_by FK
    uuid reviewer_id FK
    text decision_note
  }
  CHANGE_REQUEST_OPERATIONS {
    uuid id PK
    int seq
    text op_type
    jsonb payload
    text temp_ref
    text target_type
    uuid target_id
    int base_version
    enum apply_status
  }
  ENTITY_REVISIONS {
    uuid id PK
    text entity_type
    uuid entity_id
    int version
    jsonb snapshot
  }
```

## 4. Organization & governance

```mermaid
erDiagram
  ORGANIZATIONS ||--o{ ORG_UNIT_TYPES : defines
  ORG_UNIT_TYPES ||--o{ ORG_UNIT_TYPE_PARENTS : "may nest under"
  ORGANIZATIONS ||--o{ ORG_UNITS : has
  ORG_UNIT_TYPES ||--o{ ORG_UNITS : "typed as"
  ORG_UNITS |o--o{ ORG_UNITS : "parent of"
  PLACES |o--o{ ORG_UNITS : "region / gaau"
  ORG_UNITS ||--o{ TERMS : "has tenures"
  EVENTS |o--o{ TERMS : "elected at (general assembly)"
  ORGANIZATIONS ||--o{ POSITION_DEFINITIONS : "one list, same on every board"
  PERSONS ||--o{ APPOINTMENTS : holds
  ORG_UNITS ||--o{ APPOINTMENTS : ""
  POSITION_DEFINITIONS ||--o{ APPOINTMENTS : ""
  TERMS |o--o{ APPOINTMENTS : "within term"

  ORG_UNITS {
    uuid id PK
    uuid type_id FK
    uuid parent_id FK
    text slug
    jsonb name_i18n
    enum status "active|dissolved|merged"
  }
  TERMS {
    uuid id PK
    uuid org_unit_id FK
    int ordinal
    date starts_on
    date ends_on
    daterange period "EXCLUDE overlap per unit"
  }
  POSITION_DEFINITIONS {
    uuid id PK
    text key
    jsonb title_i18n
    int rank
    bool is_office_bearer
    int max_holders
  }
  APPOINTMENTS {
    uuid id PK
    uuid person_id FK
    uuid org_unit_id FK
    uuid position_id FK
    uuid term_id FK
    enum appointment_type
    date starts_on
    date ends_on
    enum end_reason
    bool is_exclusive
    daterange period "EXCLUDE overlap if exclusive"
  }
```

## 5. Access control

```mermaid
erDiagram
  USERS ||--o{ AUTH_SESSIONS : ""
  USERS ||--o{ ONE_TIME_TOKENS : ""
  USERS ||--o{ ROLE_ASSIGNMENTS : ""
  ROLES ||--o{ ROLE_ASSIGNMENTS : ""
  ROLES ||--o{ ROLE_PERMISSIONS : ""
  PERMISSIONS ||--o{ ROLE_PERMISSIONS : ""
  ORG_UNITS |o--o{ ROLE_ASSIGNMENTS : "scope"
  FAMILY_BRANCHES |o--o{ ROLE_ASSIGNMENTS : "scope"
  USERS ||--o{ USER_PERSON_LINKS : "claims"
  PERSONS |o--o{ USER_PERSON_LINKS : "claimed as"
  USERS ||--o{ BRANCH_ACCESS : "requests / holds"
  FAMILY_BRANCHES ||--o{ BRANCH_ACCESS : ""
  PERSONS ||--o{ PERSON_ACCESS_GRANTS : ""
  USERS ||--o{ PERSON_ACCESS_GRANTS : ""

  USER_PERSON_LINKS {
    uuid id PK
    uuid user_id FK
    uuid person_id FK "null if anchored to ancestor"
    uuid anchor_person_id FK
    enum status "requested|approved|rejected|revoked"
    text claim_statement
  }
  BRANCH_ACCESS {
    uuid id PK
    uuid user_id FK
    uuid branch_id FK "covers sub-branches"
    enum status "requested|approved|rejected|revoked"
    text relation_statement
    timestamptz expires_at
  }

  ROLE_ASSIGNMENTS {
    uuid id PK
    uuid user_id FK
    uuid role_id FK
    enum scope_type "global|org_unit|branch"
    uuid org_unit_id FK
    uuid branch_id FK
    timestamptz revoked_at
  }
```

Note: there is deliberately **no** relationship between `APPOINTMENTS`/`POSITION_DEFINITIONS` and `ROLES` (ADR-013). `BRANCH_ACCESS` and `PERSON_ACCESS_GRANTS` control *which genealogy data a user can see* (privacy); roles control *which actions a user can take* (ADR-021).

## 6. Publishing, events, media

```mermaid
erDiagram
  CONTENT_ITEMS ||--|{ CONTENT_TRANSLATIONS : "per locale"
  CONTENT_ITEMS }o--o{ CATEGORIES : "via content_categories"
  CONTENT_ITEMS }o--o{ TAGS : "via content_tags"
  CATEGORIES |o--o{ CATEGORIES : parent
  CONTENT_ITEMS ||--o{ CONTENT_AUTHORS : ""
  CONTENT_ITEMS ||--o{ CONTENT_LINKS : "subjects (person/event/place/unit)"
  CONTENT_ITEMS ||--o{ CONTENT_MEDIA_USAGE : ""
  EVENTS |o--o{ CONTENT_ITEMS : "reports / announcements"

  EVENT_CATEGORIES ||--o{ EVENTS : ""
  EVENTS ||--|{ EVENT_TRANSLATIONS : ""
  EVENTS ||--o{ EVENT_ORGANIZERS : ""
  ORG_UNITS ||--o{ EVENT_ORGANIZERS : ""
  PLACES |o--o{ EVENTS : venue

  MEDIA_ASSETS ||--o{ MEDIA_TRANSLATIONS : ""
  MEDIA_ASSETS ||--o{ MEDIA_VARIANTS : ""
  MEDIA_ASSETS ||--o{ GALLERY_ITEMS : ""
  GALLERIES ||--o{ GALLERY_ITEMS : ""
  EVENTS |o--o{ GALLERIES : ""
  ORG_UNITS |o--o{ GALLERIES : ""
  HISTORICAL_PERIODS |o--o{ GALLERIES : ""
  HISTORICAL_PERIODS |o--o{ MEDIA_ASSETS : ""
  MEDIA_ASSETS ||--o{ MEDIA_PERSON_TAGS : ""
  PERSONS ||--o{ MEDIA_PERSON_TAGS : ""
  MEDIA_ASSETS ||--o{ CONTENT_MEDIA_USAGE : ""

  CONTENT_ITEMS {
    uuid id PK
    enum type
    enum status
    enum visibility
    timestamptz published_at
    bool is_pinned
    timestamptz expires_at
  }
  EVENTS {
    uuid id PK
    timestamptz starts_at
    timestamptz ends_at
    text timezone
    enum status_override "cancelled|postponed"
    enum publication_status
  }
  MEDIA_ASSETS {
    uuid id PK
    enum kind
    enum status
    text storage_key
    text mime_type
    text checksum_sha256
    enum visibility
  }
```
