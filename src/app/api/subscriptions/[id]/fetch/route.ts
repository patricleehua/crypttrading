import { NextRequest, NextResponse } from 'next/server';
import { nitterFetcher } from '@/lib/nitter-fetcher';

// POST /api/subscriptions/[id]/fetch - 手动触发订阅抓取
export async function POST(
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

    const body = await request.json().catch(() => ({}));
    const { config } = body;

    // 执行抓取
    const result = await nitterFetcher.fetchSubscription(subscriptionId, config);

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: {
          itemsCount: result.itemsCount,
          newItemsCount: result.newItemsCount,
          message: `Successfully fetched ${result.newItemsCount} new items out of ${result.itemsCount} total items`
        }
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to fetch subscription'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error executing manual fetch:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to execute fetch' },
      { status: 500 }
    );
  }
}