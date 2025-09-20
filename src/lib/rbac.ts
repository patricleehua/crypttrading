import { db } from '@/db';
import { usersTable, rolesTable, permissionsTable, userRolesTable, rolePermissionsTable } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

// 用户角色和权限类型定义
export interface UserWithRoles {
  id: number;
  name: string;
  username: string;
  email: string;
  isActive: boolean;
  roles: Role[];
  permissions: string[];
}

export interface Role {
  id: number;
  name: string;
  displayName: string;
  description?: string;
}

export interface Permission {
  id: number;
  name: string;
  displayName: string;
  description?: string;
  module: string;
}

/**
 * 获取用户的所有角色和权限
 */
export async function getUserWithRolesAndPermissions(userId: number): Promise<UserWithRoles | null> {
  try {
    // 查询用户基本信息
    const users = await db
      .select({
        id: usersTable.id,
        name: usersTable.name,
        username: usersTable.username,
        email: usersTable.email,
        isActive: usersTable.isActive,
      })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    if (users.length === 0) {
      return null;
    }

    const user = users[0];

    // 查询用户的角色
    const userRoles = await db
      .select({
        id: rolesTable.id,
        name: rolesTable.name,
        displayName: rolesTable.displayName,
        description: rolesTable.description,
      })
      .from(userRolesTable)
      .innerJoin(rolesTable, eq(userRolesTable.roleId, rolesTable.id))
      .where(eq(userRolesTable.userId, userId));

    // 查询用户的权限（通过角色）
    const roleIds = userRoles.map(role => role.id);
    let userPermissions: string[] = [];

    if (roleIds.length > 0) {
      const permissions = await db
        .select({
          name: permissionsTable.name,
        })
        .from(rolePermissionsTable)
        .innerJoin(permissionsTable, eq(rolePermissionsTable.permissionId, permissionsTable.id))
        .where(
          roleIds.length === 1
            ? eq(rolePermissionsTable.roleId, roleIds[0])
            : // 如果有多个角色，使用 IN 查询（这里简化处理）
              eq(rolePermissionsTable.roleId, roleIds[0]) // TODO: 改进为支持多角色查询
        );

      userPermissions = [...new Set(permissions.map(p => p.name))]; // 去重
    }

    return {
      ...user,
      roles: userRoles,
      permissions: userPermissions,
    };

  } catch (error) {
    console.error('获取用户角色权限失败:', error);
    return null;
  }
}

/**
 * 检查权限是否匹配（支持通配符）
 */
export function matchPermission(userPermission: string, requiredPermission: string): boolean {
  // 如果用户有超级权限 *:*
  if (userPermission === '*:*' || userPermission === '*') {
    return true;
  }

  // 精确匹配
  if (userPermission === requiredPermission) {
    return true;
  }

  // 通配符匹配
  if (userPermission.includes('*')) {
    // 将通配符模式转换为正则表达式
    const pattern = userPermission
      .replace(/\./g, '\\.')  // 转义点号
      .replace(/\*/g, '.*');  // 将*替换为.*

    const regex = new RegExp(`^${pattern}$`);
    return regex.test(requiredPermission);
  }

  return false;
}

/**
 * 检查用户是否有指定权限（支持通配符）
 */
export async function hasPermission(userId: number, permissionName: string): Promise<boolean> {
  try {
    // 获取用户所有权限
    const userPermissions = await db
      .select({ name: permissionsTable.name })
      .from(userRolesTable)
      .innerJoin(rolePermissionsTable, eq(userRolesTable.roleId, rolePermissionsTable.roleId))
      .innerJoin(permissionsTable, eq(rolePermissionsTable.permissionId, permissionsTable.id))
      .where(eq(userRolesTable.userId, userId));

    // 检查是否有匹配的权限（包括通配符）
    return userPermissions.some(permission =>
      matchPermission(permission.name, permissionName)
    );

  } catch (error) {
    console.error('检查权限失败:', error);
    return false;
  }
}

/**
 * 检查用户是否有指定角色
 */
export async function hasRole(userId: number, roleName: string): Promise<boolean> {
  try {
    const result = await db
      .select({ count: rolesTable.id })
      .from(userRolesTable)
      .innerJoin(rolesTable, eq(userRolesTable.roleId, rolesTable.id))
      .where(
        and(
          eq(userRolesTable.userId, userId),
          eq(rolesTable.name, roleName)
        )
      )
      .limit(1);

    return result.length > 0;
  } catch (error) {
    console.error('检查角色失败:', error);
    return false;
  }
}

/**
 * 为用户分配角色
 */
export async function assignRoleToUser(userId: number, roleId: number, assignedBy?: number): Promise<boolean> {
  try {
    await db.insert(userRolesTable).values({
      userId,
      roleId,
      assignedBy,
    }).onConflictDoNothing(); // 避免重复分配

    return true;
  } catch (error) {
    console.error('分配角色失败:', error);
    return false;
  }
}

/**
 * 移除用户角色
 */
export async function removeRoleFromUser(userId: number, roleId: number): Promise<boolean> {
  try {
    await db
      .delete(userRolesTable)
      .where(
        and(
          eq(userRolesTable.userId, userId),
          eq(userRolesTable.roleId, roleId)
        )
      );

    return true;
  } catch (error) {
    console.error('移除角色失败:', error);
    return false;
  }
}

/**
 * 权限常量定义
 */
export const PERMISSIONS = {
  // 超级权限
  SUPER_ADMIN: '*:*',        // 超级管理员权限
  ALL: '*',                  // 所有权限

  // 模块级通配符权限
  DASHBOARD_ALL: 'dashboard:*',   // 仪表盘所有权限
  DATASOURCE_ALL: 'datasource:*', // 数据源所有权限
  TRADING_ALL: 'trading:*',       // 交易所有权限
  SYSTEM_ALL: 'system:*',         // 系统管理所有权限

  // 仪表盘权限
  DASHBOARD_VIEW: 'dashboard:view',

  // 数据源权限
  DATASOURCE_VIEW: 'datasource:view',
  DATASOURCE_CREATE: 'datasource:create',
  DATASOURCE_EDIT: 'datasource:edit',
  DATASOURCE_DELETE: 'datasource:delete',

  // 交易权限
  TRADING_VIEW: 'trading:view',
  TRADING_EXECUTE: 'trading:execute',
  TRADING_CONFIG: 'trading:config',

  // 系统管理权限
  SYSTEM_USER_MANAGE: 'system:user:manage',
  SYSTEM_ROLE_MANAGE: 'system:role:manage',
  SYSTEM_PERMISSION_MANAGE: 'system:permission:manage',
  SYSTEM_LOG_VIEW: 'system:log:view',
  SYSTEM_SETTINGS: 'system:settings',

  // 操作级通配符权限示例
  ALL_VIEW: '*:view',        // 所有查看权限
  ALL_MANAGE: '*:manage',    // 所有管理权限
  ALL_CREATE: '*:create',    // 所有创建权限
  ALL_EDIT: '*:edit',        // 所有编辑权限
  ALL_DELETE: '*:delete',    // 所有删除权限
} as const;

/**
 * 角色常量定义
 */
export const ROLES = {
  ADMIN: 'admin',
  TRADER: 'trader',
  VIEWER: 'viewer',
} as const;