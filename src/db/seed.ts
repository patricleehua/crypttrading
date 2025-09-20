import { db } from '@/db';
import { usersTable, rolesTable, permissionsTable, userRolesTable, rolePermissionsTable } from '@/db/schema';
import { PERMISSIONS, ROLES } from '@/lib/rbac';

async function seed() {
  console.log('🌱 开始种子数据...');

  try {
    // 1. 创建角色
    console.log('📝 创建角色...');
    const roles = await db.insert(rolesTable).values([
      {
        name: ROLES.ADMIN,
        displayName: '管理员',
        description: '系统管理员，拥有所有权限'
      },
      {
        name: ROLES.TRADER,
        displayName: '交易员',
        description: '可以执行交易操作的用户'
      },
      {
        name: ROLES.VIEWER,
        displayName: '查看者',
        description: '只能查看数据的用户'
      }
    ]).returning();

    // 2. 创建权限
    console.log('🔑 创建权限...');
    const permissions = await db.insert(permissionsTable).values([
      // 超级权限
      {
        name: PERMISSIONS.SUPER_ADMIN,
        displayName: '超级管理员',
        description: '拥有系统所有权限',
        module: 'global'
      },

      // 模块级通配符权限
      {
        name: PERMISSIONS.DASHBOARD_ALL,
        displayName: '仪表盘所有权限',
        description: '仪表盘模块的所有操作权限',
        module: 'dashboard'
      },
      {
        name: PERMISSIONS.DATASOURCE_ALL,
        displayName: '数据源所有权限',
        description: '数据源模块的所有操作权限',
        module: 'datasource'
      },
      {
        name: PERMISSIONS.TRADING_ALL,
        displayName: '交易所有权限',
        description: '交易模块的所有操作权限',
        module: 'trading'
      },
      {
        name: PERMISSIONS.SYSTEM_ALL,
        displayName: '系统管理所有权限',
        description: '系统管理模块的所有操作权限',
        module: 'system'
      },

      // 仪表盘权限
      {
        name: PERMISSIONS.DASHBOARD_VIEW,
        displayName: '查看仪表盘',
        description: '查看系统仪表盘和概览信息',
        module: 'dashboard'
      },

      // 数据源权限
      {
        name: PERMISSIONS.DATASOURCE_VIEW,
        displayName: '查看数据源',
        description: '查看数据采集源配置',
        module: 'datasource'
      },
      {
        name: PERMISSIONS.DATASOURCE_CREATE,
        displayName: '创建数据源',
        description: '创建新的数据采集源',
        module: 'datasource'
      },
      {
        name: PERMISSIONS.DATASOURCE_EDIT,
        displayName: '编辑数据源',
        description: '编辑数据采集源配置',
        module: 'datasource'
      },
      {
        name: PERMISSIONS.DATASOURCE_DELETE,
        displayName: '删除数据源',
        description: '删除数据采集源',
        module: 'datasource'
      },

      // 交易权限
      {
        name: PERMISSIONS.TRADING_VIEW,
        displayName: '查看交易',
        description: '查看交易账号和交易记录',
        module: 'trading'
      },
      {
        name: PERMISSIONS.TRADING_EXECUTE,
        displayName: '执行交易',
        description: '执行买卖交易操作',
        module: 'trading'
      },
      {
        name: PERMISSIONS.TRADING_CONFIG,
        displayName: '配置交易',
        description: '配置交易账号和交易参数',
        module: 'trading'
      },

      // 系统管理权限
      {
        name: PERMISSIONS.SYSTEM_USER_MANAGE,
        displayName: '用户管理',
        description: '管理系统用户',
        module: 'system'
      },
      {
        name: PERMISSIONS.SYSTEM_ROLE_MANAGE,
        displayName: '角色管理',
        description: '管理系统角色',
        module: 'system'
      },
      {
        name: PERMISSIONS.SYSTEM_PERMISSION_MANAGE,
        displayName: '权限管理',
        description: '管理系统权限',
        module: 'system'
      },
      {
        name: PERMISSIONS.SYSTEM_LOG_VIEW,
        displayName: '查看日志',
        description: '查看系统日志',
        module: 'system'
      },
      {
        name: PERMISSIONS.SYSTEM_SETTINGS,
        displayName: '系统设置',
        description: '修改系统设置',
        module: 'system'
      },

      // 操作级通配符权限
      {
        name: PERMISSIONS.ALL_VIEW,
        displayName: '所有查看权限',
        description: '查看所有模块的权限',
        module: 'global'
      }
    ]).returning();

    // 3. 角色权限分配
    console.log('🔗 分配角色权限...');

    // 管理员拥有超级权限
    const adminRole = roles.find(r => r.name === ROLES.ADMIN);
    const superAdminPermission = permissions.find(p => p.name === PERMISSIONS.SUPER_ADMIN);
    if (adminRole && superAdminPermission) {
      await db.insert(rolePermissionsTable).values({
        roleId: adminRole.id,
        permissionId: superAdminPermission.id
      });
    }

    // 交易员权限 - 使用模块级通配符权限
    const traderRole = roles.find(r => r.name === ROLES.TRADER);
    const traderPermissionNames = [
      PERMISSIONS.DASHBOARD_ALL,
      PERMISSIONS.DATASOURCE_ALL,
      PERMISSIONS.TRADING_ALL
    ];
    const traderPermissions = permissions.filter(p =>
      traderPermissionNames.includes(p.name as any)
    );
    if (traderRole) {
      await db.insert(rolePermissionsTable).values(
        traderPermissions.map(permission => ({
          roleId: traderRole.id,
          permissionId: permission.id
        }))
      );
    }

    // 查看者权限 - 使用查看权限通配符
    const viewerRole = roles.find(r => r.name === ROLES.VIEWER);
    const allViewPermission = permissions.find(p => p.name === PERMISSIONS.ALL_VIEW);
    if (viewerRole && allViewPermission) {
      await db.insert(rolePermissionsTable).values({
        roleId: viewerRole.id,
        permissionId: allViewPermission.id
      });
    }

    // 4. 创建测试用户
    console.log('👤 创建测试用户...');
    const users = await db.insert(usersTable).values([
      {
        name: '系统管理员',
        username: 'admin',
        email: 'admin@trading.com',
        password: 'admin123', // 在生产环境中应该使用哈希密码
        age: 30,
        isActive: true
      },
      {
        name: '交易员01',
        username: 'trader01',
        email: 'trader01@trading.com',
        password: 'trader123',
        age: 28,
        isActive: true
      },
      {
        name: '数据分析师',
        username: 'analyst',
        email: 'analyst@trading.com',
        password: 'analyst123',
        age: 26,
        isActive: true
      }
    ]).returning();

    // 5. 分配用户角色
    console.log('👥 分配用户角色...');

    // 分配管理员角色
    const adminUser = users.find(u => u.username === 'admin');
    if (adminUser && adminRole) {
      await db.insert(userRolesTable).values({
        userId: adminUser.id,
        roleId: adminRole.id
      });
    }

    // 分配交易员角色
    const traderUser = users.find(u => u.username === 'trader01');
    if (traderUser && traderRole) {
      await db.insert(userRolesTable).values({
        userId: traderUser.id,
        roleId: traderRole.id
      });
    }

    // 分配查看者角色
    const analystUser = users.find(u => u.username === 'analyst');
    if (analystUser && viewerRole) {
      await db.insert(userRolesTable).values({
        userId: analystUser.id,
        roleId: viewerRole.id
      });
    }

    console.log('✅ 种子数据创建完成！');
    console.log('');
    console.log('🔑 测试账户：');
    console.log('管理员: admin / admin123');
    console.log('交易员: trader01 / trader123');
    console.log('查看者: analyst / analyst123');

  } catch (error) {
    console.error('❌ 种子数据创建失败:', error);
    throw error;
  }
}

// 如果直接运行此文件
if (require.main === module) {
  seed()
    .then(() => {
      console.log('🎉 种子数据完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 种子数据失败:', error);
      process.exit(1);
    });
}

export { seed };