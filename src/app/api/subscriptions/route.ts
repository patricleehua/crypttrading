import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { subscriptionsTable, subscriptionConfigsTable, usersTable } from '@/db/schema';
import { eq, and, or, ilike, desc, count } from 'drizzle-orm';
import { taskScheduler } from '@/lib/scheduler';

// GET /api/subscriptions - 获取订阅列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');
    const type = searchParams.get('type');
    const status = searchParams.get('status');

    const offset = (page - 1) * limit;

    // 构建查询条件
    const conditions = [];

    if (search) {
      conditions.push(
        or(
          ilike(subscriptionsTable.name, `%${search}%`),
          ilike(subscriptionsTable.description, `%${search}%`),
          ilike(subscriptionsTable.url, `%${search}%`)
        )
      );
    }

    if (type) {
      conditions.push(eq(subscriptionsTable.type, type as any));
    }

    if (status) {
      conditions.push(eq(subscriptionsTable.status, status as any));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // 获取订阅列表
    const subscriptions = await db
      .select({
        subscription: subscriptionsTable,
        config: subscriptionConfigsTable,
        creator: {
          id: usersTable.id,
          username: usersTable.username,
          email: usersTable.email
        }
      })
      .from(subscriptionsTable)
      .leftJoin(subscriptionConfigsTable, eq(subscriptionsTable.id, subscriptionConfigsTable.subscriptionId))
      .leftJoin(usersTable, eq(subscriptionsTable.createdBy, usersTable.id))
      .where(whereClause)
      .orderBy(desc(subscriptionsTable.createdAt))
      .limit(limit)
      .offset(offset);

    // 获取总数
    const totalCountResult = await db
    .select({ count: count() })
      .from(subscriptionsTable)
      .where(whereClause);

    const totalCount = Number(totalCountResult[0]?.count || 0);
    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      data: subscriptions,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch subscriptions' },
      { status: 500 }
    );
  }
}

// POST /api/subscriptions - 创建新订阅
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      type,
      url,
      config,
      createdBy,
      subscriptionConfig
    } = body;

    // 验证必需字段
    if (!name || !type || !url || !createdBy) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: name, type, url, createdBy' },
        { status: 400 }
      );
    }

    // 检查URL是否已存在
    const existingSubscription = await db
      .select()
      .from(subscriptionsTable)
      .where(eq(subscriptionsTable.url, url))
      .limit(1);

    if (existingSubscription.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Subscription with this URL already exists' },
        { status: 409 }
      );
    }

    // 开始事务
    const result = await db.transaction(async (tx) => {
      // 创建订阅
      const [subscription] = await tx
        .insert(subscriptionsTable)
        .values({
          name,
          description,
          type,
          url,
          config,
          createdBy,
          status: 'active',
          isEnabled: true
        })
        .returning();

      // 创建订阅配置
      if (subscriptionConfig) {
        await tx
          .insert(subscriptionConfigsTable)
          .values({
            subscriptionId: subscription.id,
            ...subscriptionConfig
          });
      }

      return subscription;
    });

    // 如果配置了定时任务，添加到调度器
    if (subscriptionConfig?.autoFetch && subscriptionConfig?.cronSchedule) {
      await taskScheduler.scheduleSubscriptionTask(result.id, subscriptionConfig.cronSchedule);
    }

    return NextResponse.json({
      success: true,
      data: result
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create subscription' },
      { status: 500 }
    );
  }
}