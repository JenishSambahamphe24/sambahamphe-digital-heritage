import { customType, timestamp, uuid } from "drizzle-orm/pg-core";
import { v7 as uuidv7 } from "uuid";

const citextType = customType<{ data: string }>({
  dataType() {
    return "citext";
  },
});

export class ColumnHelper {
  static citext(name: string) {
    return citextType(name);
  }

  static primaryId() {
    return uuid("id")
      .primaryKey()
      .$defaultFn(() => uuidv7());
  }

  static createdAt() {
    return timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
  }

  static updatedAt() {
    return timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date());
  }
}
