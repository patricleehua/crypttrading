import { NextResponse,NextRequest } from "next/server";
import { db } from "@/db";
import { usersTable } from "@/db/schema";
import {eq} from "drizzle-orm";

// 获取所有用户
export async function GET(request: NextRequest) {
  try {
      // 从URL中获取id参数
      const url = new URL(request.url);
      const id = url.searchParams.get('id');
      
      // 如果提供了id，则获取单个用户
      if (id) {
          const user = await db.select().from(usersTable).where(eq(usersTable.id, parseInt(id))).limit(1);
          
          if (user.length === 0) {
              return NextResponse.json({ error: "用户不存在" }, { status: 404 });
          }
          
          return NextResponse.json(user[0]);
      }
      
      // 否则获取所有用户
      const result = await db.select().from(usersTable);
      return NextResponse.json(result);
  } catch (error) {
      console.error("获取用户失败:", error);
      return NextResponse.json({ error: "获取用户失败" }, { status: 500 });
  }
}
