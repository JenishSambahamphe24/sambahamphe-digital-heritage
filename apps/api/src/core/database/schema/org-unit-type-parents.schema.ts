import { pgTable, primaryKey, uuid } from "drizzle-orm/pg-core";

import { orgUnitTypes } from "./org-unit-types.schema.js";

// Which unit types may sit inside which (e.g. a gaau committee inside a regional board).
export const orgUnitTypeParents = pgTable(
  "org_unit_type_parents",
  {
    typeId: uuid("type_id")
      .notNull()
      .references(() => orgUnitTypes.id),
    parentTypeId: uuid("parent_type_id")
      .notNull()
      .references(() => orgUnitTypes.id),
  },
  (table) => [primaryKey({ columns: [table.typeId, table.parentTypeId] })],
);
