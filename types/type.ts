import type { Database } from "./schema";

export type Habit = Pick<
  Database["public"]["Tables"]["habits"]["Row"],
  "id" | "name" | "icon"
>;
