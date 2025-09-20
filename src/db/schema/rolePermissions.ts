import { integer, pgTable, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { rolesTable } from "./roles";
import { permissionsTable } from "./permissions";

export const rolePermissionsTable = pgTable("role_permissions", {
  roleId: integer("role_id").notNull().references(() => rolesTable.id, { onDelete: "cascade" }),

  permissionId: integer("permission_id").notNull().references(() => permissionsTable.id, { onDelete: "cascade" }),

  grantedAt: timestamp("granted_at").defaultNow().notNull(),

  grantedBy: integer("granted_by"), // 谁授予的这个权限

}, (table) => ({
  pk: primaryKey({ columns: [table.roleId, table.permissionId] })
}));