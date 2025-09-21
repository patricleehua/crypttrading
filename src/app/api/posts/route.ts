import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { postsTable, subscriptionsTable } from '@/db/schema';
import { eq, and, or, ilike, desc, gte, lte, sql } from 'drizzle-orm';

// GET /api/posts - 获取文章列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');
    const subscriptionId = searchParams.get('subscriptionId');
    const sourceType = searchParams.get('sourceType');
    const contentType = searchParams.get('contentType');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const authorUsername = searchParams.get('authorUsername');
    const hashtag = searchParams.get('hashtag');

    const offset = (page - 1) * limit;

    // 构建查询条件
    const conditions = [];

    // 排除软删除的文章
    conditions.push(eq(postsTable.isDeleted, false));

    if (search) {
      conditions.push(
        or(
          ilike(postsTable.title, `%${search}%`),
          ilike(postsTable.content, `%${search}%`),
          ilike(postsTable.authorName, `%${search}%`),
          ilike(postsTable.authorUsername, `%${search}%`)
        )
      );
    }

    if (subscriptionId) {
      conditions.push(eq(postsTable.subscriptionId, parseInt(subscriptionId)));
    }

    if (sourceType) {
      conditions.push(eq(postsTable.sourceType, sourceType as any));
    }

    if (contentType) {
      conditions.push(eq(postsTable.contentType, contentType as any));
    }

    if (startDate) {
      conditions.push(gte(postsTable.publishedAt, new Date(startDate)));
    }

    if (endDate) {
      conditions.push(lte(postsTable.publishedAt, new Date(endDate)));
    }

    if (authorUsername) {
      conditions.push(ilike(postsTable.authorUsername, `%${authorUsername}%`));
    }

    if (hashtag) {
      conditions.push(
        sql`${postsTable.hashtags}::text ILIKE ${`%${hashtag}%`}`
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // 获取文章列表
    const posts = await db
      .select({
        post: postsTable,
        subscription: {
          id: subscriptionsTable.id,
          name: subscriptionsTable.name,
          type: subscriptionsTable.type
        }
      })
      .from(postsTable)
      .leftJoin(subscriptionsTable, eq(postsTable.subscriptionId, subscriptionsTable.id))
      .where(whereClause)
      .orderBy(desc(postsTable.publishedAt))
      .limit(limit)
      .offset(offset);

    // 获取总数
    const totalCountResult = await db
      .select({ count: sql`count(*)`.as('count') })
      .from(postsTable)
      .where(whereClause);

    const totalCount = Number(totalCountResult[0]?.count || 0);
    const totalPages = Math.ceil(totalCount / limit);

    // 转换数据，解析JSON字段
    const transformedPosts = posts.map(({ post, subscription }) => ({
      post: {
        ...post,
        mediaUrls: post.mediaUrls ? JSON.parse(post.mediaUrls) : [],
        hashtags: post.hashtags ? JSON.parse(post.hashtags) : [],
        mentions: post.mentions ? JSON.parse(post.mentions) : [],
        // 处理authorAvatar字段，支持字符串和数组格式
        authorAvatar: (() => {
          if (!post.authorAvatar) return null;
          try {
            // 如果是JSON字符串，尝试解析
            return JSON.parse(post.authorAvatar);
          } catch {
            // 如果解析失败，返回原始字符串
            return post.authorAvatar;
          }
        })()
      },
      subscription
    }));

    return NextResponse.json({
      success: true,
      data: transformedPosts,
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
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}

// DELETE /api/posts - 批量删除文章
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid or empty IDs array' },
        { status: 400 }
      );
    }

    // 软删除文章
    const result = await db
      .update(postsTable)
      .set({
        isDeleted: true,
        updatedAt: new Date()
      })
      .where(
        and(
          sql`${postsTable.id} = ANY(${ids})`,
          eq(postsTable.isDeleted, false)
        )
      )
      .returning({ id: postsTable.id });

    return NextResponse.json({
      success: true,
      data: {
        deletedCount: result.length,
        deletedIds: result.map(r => r.id)
      }
    });

  } catch (error) {
    console.error('Error deleting posts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete posts' },
      { status: 500 }
    );
  }
}