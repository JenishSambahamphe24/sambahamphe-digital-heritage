import { customType } from "drizzle-orm/pg-core";

// Postgres daterange, used for generated `period` columns that exclusion
// constraints compare; the app reads starts_on / ends_on instead.
export const daterange = customType<{ data: string }>({
  dataType() {
    return "daterange";
  },
});
