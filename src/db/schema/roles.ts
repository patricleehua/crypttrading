import { integer, pgTable, timestamp, varchar, text } from "drizzle-orm/pg-core";

export const rolesTable = pgTable("roles", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),

  name: varchar({ length: 100 }).notNull().unique(), // 角色名称，如 'admin', 'trader', 'viewer'

  displayName: varchar({ length: 255 }).notNull(), // 显示名称，如 '管理员', '交易员', '查看者'

  description: text(), // 角色描述

  createdAt: timestamp("created_at").defaultNow().notNull(),

  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});