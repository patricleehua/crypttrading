import { NextRequest, NextResponse } from 'next/server';
import { nitterFetcher } from '@/lib/nitter-fetcher';

// POST /api/test-save-rss - 测试RSS解析并保存到数据库
export async function POST(request: NextRequest) {
  try {
    const { url, subscriptionId } = await request.json();

    if (!url || !subscriptionId) {
      return NextResponse.json(
        { success: false, error: 'URL and subscriptionId are required' },
        { status: 400 }
      );
    }

    console.log(`Testing RSS parsing and saving for: ${url}, subscription: ${subscriptionId}`);

    const result = await nitterFetcher.fetchSubscription(subscriptionId);

    console.log(`RSS save result:`, {
      success: result.success,
      itemsCount: result.itemsCount,
      newItemsCount: result.newItemsCount,
      error: result.error
    });

    return NextResponse.json({
      success: result.success,
      itemsCount: result.itemsCount,
      newItemsCount: result.newItemsCount,
      error: result.error
    });

  } catch (error) {
    console.error('Error testing RSS save:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}