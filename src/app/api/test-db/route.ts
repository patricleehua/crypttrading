import { NextResponse } from "next/server";

import { db } from "@/db";

import { usersTable } from "@/db/schema";

export async function GET() {
  try {
    // 测试数据库连接

    const users = await db.select().from(usersTable).limit(1);

    return NextResponse.json({
      success: true,

      message: "Database connected successfully",

      users: users,
    });
  } catch (error) {
    console.error("Database connection error:", error);

    return NextResponse.json(
      {
        success: false,

        message: "Database connection failed",

        error: error instanceof Error ? error.message : "Unknown error",
      },

      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    // 创建测试用户

    const newUser = await db
      .insert(usersTable)
      .values({
        name: "Test User",

        username: "testuser",

        password: "hashedpassword",

        age: 25,

        email: "test@example.com",
      })
      .returning();

    return NextResponse.json({
      success: true,

      message: "User created successfully",

      user: newUser[0],
    });
  } catch (error) {
    console.error("Database insert error:", error);

    return NextResponse.json(
      {
        success: false,

        message: "Failed to create user",

        error: error instanceof Error ? error.message : "Unknown error",
      },

      { status: 500 }
    );
  }
}
