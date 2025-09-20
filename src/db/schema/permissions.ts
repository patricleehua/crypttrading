import { integer, pgTable, timestamp, varchar, text } from "drizzle-orm/pg-core";

export const permissionsTable = pgTable("permissions", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),

  name: varchar({ length: 100 }).notNull().unique(), // 权限名称，如 'dashboard.view', 'trading.execute', 'system.manage'

  displayName: varchar({ length: 255 }).notNull(), // 显示名称，如 '查看仪表盘', '执行交易', '系统管理'

  description: text(), // 权限描述

  module: varchar({ length: 100 }).notNull(), // 所属模块，如 'dashboard', 'trading', 'system'

  createdAt: timestamp("created_at").defaultNow().notNull(),

  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});