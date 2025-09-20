import { integer, pgTable, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { rolesTable } from "./roles";

export const userRolesTable = pgTable("user_roles", {
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),

  roleId: integer("role_id").notNull().references(() => rolesTable.id, { onDelete: "cascade" }),

  assignedAt: timestamp("assigned_at").defaultNow().notNull(),

  assignedBy: integer("assigned_by").references(() => usersTable.id), // 谁分配的这个角色

}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.roleId] })
}));