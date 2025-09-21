import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { postsTable, subscriptionsTable } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

// GET /api/posts/[id] - 获取单个文章详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const postId = parseInt(id);

    if (isNaN(postId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid post ID' },
        { status: 400 }
      );
    }

    const result = await db
      .select({
        post: postsTable,
        subscription: {
          id: subscriptionsTable.id,
          name: subscriptionsTable.name,
          type: subscriptionsTable.type,
          url: subscriptionsTable.url
        }
      })
      .from(postsTable)
      .leftJoin(subscriptionsTable, eq(postsTable.subscriptionId, subscriptionsTable.id))
      .where(
        and(
          eq(postsTable.id, postId),
          eq(postsTable.isDeleted, false)
        )
      )
      .limit(1);

    if (!result.length) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      );
    }

    const { post, subscription } = result[0];

    // 转换数据，解析JSON字段
    const transformedPost = {
      ...post,
      mediaUrls: post.mediaUrls ? JSON.parse(post.mediaUrls) : [],
      hashtags: post.hashtags ? JSON.parse(post.hashtags) : [],
      mentions: post.mentions ? JSON.parse(post.mentions) : [],
      rawData: post.rawData,
      subscription
    };

    return NextResponse.json({
      success: true,
      data: transformedPost
    });

  } catch (error) {
    console.error('Error fetching post:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch post' },
      { status: 500 }
    );
  }
}

// DELETE /api/posts/[id] - 删除单个文章
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const postId = parseInt(id);

    if (isNaN(postId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid post ID' },
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
          eq(postsTable.id, postId),
          eq(postsTable.isDeleted, false)
        )
      )
      .returning({ id: postsTable.id });

    if (!result.length) {
      return NextResponse.json(
        { success: false, error: 'Post not found or already deleted' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Post deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete post' },
      { status: 500 }
    );
  }
}