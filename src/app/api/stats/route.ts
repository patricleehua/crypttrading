import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { postsTable, subscriptionsTable } from '@/db/schema';
import { eq, and, gte, sql, desc, count } from 'drizzle-orm';
import { taskScheduler } from '@/lib/scheduler';

// GET /api/stats - 获取统计数据
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // 总体统计
    const [totalStats] = await db
      .select({
        totalSubscriptions: sql`count(distinct ${subscriptionsTable.id})`.as('totalSubscriptions'),
        activeSubscriptions: sql`count(distinct case when ${subscriptionsTable.status} = 'active' and ${subscriptionsTable.isEnabled} = true then ${subscriptionsTable.id} end)`.as('activeSubscriptions'),
        totalPosts: sql`count(distinct ${postsTable.id})`.as('totalPosts'),
        recentPosts: sql`count(distinct case when ${postsTable.createdAt} >= ${startDate} then ${postsTable.id} end)`.as('recentPosts')
      })
      .from(subscriptionsTable)
      .leftJoin(postsTable, eq(subscriptionsTable.id, postsTable.subscriptionId));

    // 按订阅源统计
    const subscriptionStats = await db
      .select({
        subscription: {
          id: subscriptionsTable.id,
          name: subscriptionsTable.name,
          type: subscriptionsTable.type,
          status: subscriptionsTable.status,
          lastFetchAt: subscriptionsTable.lastFetchAt,
          totalItems: subscriptionsTable.totalItems,
          errorCount: subscriptionsTable.errorCount
        },
        postsCount: count(postsTable.id).as('postsCount'),
        recentPostsCount: sql`count(case when ${postsTable.createdAt} >= ${startDate} then 1 end)`.as('recentPostsCount')
      })
      .from(subscriptionsTable)
      .leftJoin(postsTable, and(
        eq(subscriptionsTable.id, postsTable.subscriptionId),
        eq(postsTable.isDeleted, false)
      ))
      .groupBy(subscriptionsTable.id)
      .orderBy(desc(sql`count(${postsTable.id})`));

    // 按内容类型统计
    const contentTypeStats = await db
      .select({
        contentType: postsTable.contentType,
        count: count().as('count')
      })
      .from(postsTable)
      .where(
        and(
          eq(postsTable.isDeleted, false),
          gte(postsTable.createdAt, startDate)
        )
      )
      .groupBy(postsTable.contentType);

    // 按来源类型统计
    const sourceTypeStats = await db
      .select({
        sourceType: postsTable.sourceType,
        count: count().as('count')
      })
      .from(postsTable)
      .where(
        and(
          eq(postsTable.isDeleted, false),
          gte(postsTable.createdAt, startDate)
        )
      )
      .groupBy(postsTable.sourceType);

    // 每日发布统计（最近7天）
    const dailyStats = await db
      .select({
        date: sql`DATE(${postsTable.publishedAt})`.as('date'),
        count: count().as('count')
      })
      .from(postsTable)
      .where(
        and(
          eq(postsTable.isDeleted, false),
          gte(postsTable.publishedAt, startDate)
        )
      )
      .groupBy(sql`DATE(${postsTable.publishedAt})`)
      .orderBy(sql`DATE(${postsTable.publishedAt})`);

    // 最活跃的作者
    const topAuthors = await db
      .select({
        authorUsername: postsTable.authorUsername,
        authorName: postsTable.authorName,
        count: count().as('count')
      })
      .from(postsTable)
      .where(
        and(
          eq(postsTable.isDeleted, false),
          gte(postsTable.createdAt, startDate)
        )
      )
      .groupBy(postsTable.authorUsername, postsTable.authorName)
      .orderBy(desc(count()))
      .limit(10);

    // 最热门的标签
    const topHashtags = await db
      .select({
        hashtags: postsTable.hashtags
      })
      .from(postsTable)
      .where(
        and(
          eq(postsTable.isDeleted, false),
          gte(postsTable.createdAt, startDate),
          sql`${postsTable.hashtags} IS NOT NULL`
        )
      );

    // 处理标签统计
    const hashtagCounts: Record<string, number> = {};
    topHashtags.forEach(row => {
      if (row.hashtags) {
        try {
          const tags = JSON.parse(row.hashtags) as string[];
          tags.forEach(tag => {
            hashtagCounts[tag] = (hashtagCounts[tag] || 0) + 1;
          });
        } catch (e) {
          // 忽略JSON解析错误
        }
      }
    });

    const sortedHashtags = Object.entries(hashtagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([hashtag, count]) => ({ hashtag, count }));

    // 调度器状态
    const schedulerStatus = taskScheduler.getStatus();

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalSubscriptions: Number(totalStats.totalSubscriptions),
          activeSubscriptions: Number(totalStats.activeSubscriptions),
          totalPosts: Number(totalStats.totalPosts),
          recentPosts: Number(totalStats.recentPosts),
          timeRange: `${days} days`
        },
        subscriptions: subscriptionStats,
        contentTypes: contentTypeStats,
        sourceTypes: sourceTypeStats,
        dailyStats,
        topAuthors,
        topHashtags: sortedHashtags,
        scheduler: schedulerStatus
      }
    });

  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}