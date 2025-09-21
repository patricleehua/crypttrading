import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { subscriptionsTable, subscriptionConfigsTable } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { taskScheduler } from '@/lib/scheduler';

// GET /api/subscriptions/[id] - 获取单个订阅详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const subscriptionId = parseInt(id);

    if (isNaN(subscriptionId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid subscription ID' },
        { status: 400 }
      );
    }

    const result = await db
      .select({
        subscription: subscriptionsTable,
        config: subscriptionConfigsTable
      })
      .from(subscriptionsTable)
      .leftJoin(subscriptionConfigsTable, eq(subscriptionsTable.id, subscriptionConfigsTable.subscriptionId))
      .where(eq(subscriptionsTable.id, subscriptionId))
      .limit(1);

    if (!result.length) {
      return NextResponse.json(
        { success: false, error: 'Subscription not found' },
        { status: 404 }
      );
    }

    // 获取任务状态
    const taskStatus = taskScheduler.getTaskStatus(subscriptionId);

    return NextResponse.json({
      success: true,
      data: {
        ...result[0],
        taskStatus
      }
    });

  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
}

// PUT /api/subscriptions/[id] - 更新订阅
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const subscriptionId = parseInt(id);

    if (isNaN(subscriptionId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid subscription ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { subscription: subscriptionData, config: configData } = body;

    // 检查订阅是否存在
    const existing = await db
      .select()
      .from(subscriptionsTable)
      .where(eq(subscriptionsTable.id, subscriptionId))
      .limit(1);

    if (!existing.length) {
      return NextResponse.json(
        { success: false, error: 'Subscription not found' },
        { status: 404 }
      );
    }

    // 开始事务
    const result = await db.transaction(async (tx) => {
      // 更新订阅
      if (subscriptionData) {
        await tx
          .update(subscriptionsTable)
          .set({
            ...subscriptionData,
            updatedAt: new Date()
          })
          .where(eq(subscriptionsTable.id, subscriptionId));
      }

      // 更新配置
      if (configData) {
        // 检查配置是否存在
        const existingConfig = await tx
          .select()
          .from(subscriptionConfigsTable)
          .where(eq(subscriptionConfigsTable.subscriptionId, subscriptionId))
          .limit(1);

        if (existingConfig.length > 0) {
          // 更新现有配置
          await tx
            .update(subscriptionConfigsTable)
            .set({
              ...configData,
              updatedAt: new Date()
            })
            .where(eq(subscriptionConfigsTable.subscriptionId, subscriptionId));
        } else {
          // 创建新配置
          await tx
            .insert(subscriptionConfigsTable)
            .values({
              subscriptionId,
              ...configData
            });
        }
      }

      return { subscriptionId };
    });

    // 更新调度器中的任务
    if (configData?.cronSchedule !== undefined) {
      if (configData.autoFetch && configData.cronSchedule) {
        await taskScheduler.updateTaskSchedule(subscriptionId, configData.cronSchedule);
      } else {
        await taskScheduler.updateTaskSchedule(subscriptionId, null);
      }
    }

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error updating subscription:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update subscription' },
      { status: 500 }
    );
  }
}

// DELETE /api/subscriptions/[id] - 删除订阅
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const subscriptionId = parseInt(id);

    if (isNaN(subscriptionId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid subscription ID' },
        { status: 400 }
      );
    }

    // 检查订阅是否存在
    const existing = await db
      .select()
      .from(subscriptionsTable)
      .where(eq(subscriptionsTable.id, subscriptionId))
      .limit(1);

    if (!existing.length) {
      return NextResponse.json(
        { success: false, error: 'Subscription not found' },
        { status: 404 }
      );
    }

    // 删除订阅（配置会因为CASCADE自动删除）
    await db
      .delete(subscriptionsTable)
      .where(eq(subscriptionsTable.id, subscriptionId));

    // 从调度器中移除任务
    await taskScheduler.updateTaskSchedule(subscriptionId, null);

    return NextResponse.json({
      success: true,
      message: 'Subscription deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting subscription:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete subscription' },
      { status: 500 }
    );
  }
}