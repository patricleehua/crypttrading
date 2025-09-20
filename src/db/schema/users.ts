import { integer, pgTable, timestamp, varchar, boolean } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),

  name: varchar({ length: 255 }).notNull(),

  username: varchar({ length: 255 }).notNull().unique(),

  password: varchar({ length: 255 }).notNull(),

  age: integer(),

  email: varchar({ length: 255 }).notNull().unique(),

  isActive: boolean("is_active").default(true).notNull(), // 用户是否激活

  lastLoginAt: timestamp("last_login_at"), // 最后登录时间

  createdAt: timestamp("created_at").defaultNow().notNull(),

  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
