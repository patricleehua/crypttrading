import { integer, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),

  name: varchar({ length: 255 }).notNull(),

  username: varchar({ length: 255 }).notNull(),

  password: varchar({ length: 255 }).notNull(),

  age: integer().notNull(),

  email: varchar({ length: 255 }).notNull().unique(),

  role: integer().default(1).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),

  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
