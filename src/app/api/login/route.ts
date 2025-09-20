import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { usersTable } from "@/db/schema";
import { eq, or, and } from "drizzle-orm";
import { getUserWithRolesAndPermissions } from "@/lib/rbac";

//用户登入
export async function POST(request: NextRequest) {
    try {
        const loginData = await request.json();

        //数据校验
        if (!loginData.identifier || !loginData.password) {
            return NextResponse.json(
                { error: "用户名/邮箱和密码都是必填项" },
                { status: 400 }
            );
        }

        //查询用户基本信息
        const users = await db
            .select()
            .from(usersTable)
            .where(
                and(
                    or(
                        eq(usersTable.username, loginData.identifier.trim()),
                        eq(usersTable.email, loginData.identifier.trim())
                    ),
                    eq(usersTable.isActive, true) // 只允许激活的用户登录
                )
            )
            .limit(1);

        //检查用户是否存在且激活
        if (users.length === 0) {
            return NextResponse.json(
                { error: "用户不存在或已被停用" },
                { status: 401 }
            );
        }

        const user = users[0];

        //检查密码
        if (user.password !== loginData.password) {
            return NextResponse.json(
                { error: "密码错误" },
                { status: 401 }
            );
        }

        // 获取用户的角色和权限信息
        const userWithRoles = await getUserWithRolesAndPermissions(user.id);

        if (!userWithRoles) {
            return NextResponse.json(
                { error: "获取用户权限信息失败" },
                { status: 500 }
            );
        }

        // 更新最后登录时间
        await db
            .update(usersTable)
            .set({ lastLoginAt: new Date() })
            .where(eq(usersTable.id, user.id));

        // 登录成功，返回用户信息（不包含密码）
        const { password, ...userWithoutPassword } = user;

        return NextResponse.json(
            {
                message: "登录成功",
                user: {
                    ...userWithoutPassword,
                    roles: userWithRoles.roles,
                    permissions: userWithRoles.permissions
                }
            },
            { status: 200 }
        );

    } catch (error) {
        console.error("登录失败:", error);
        return NextResponse.json(
            { error: "登录失败" },
            { status: 500 }
        );
    }
}