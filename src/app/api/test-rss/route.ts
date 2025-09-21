import { NextRequest, NextResponse } from 'next/server';
import { nitterFetcher } from '@/lib/nitter-fetcher';

// GET /api/test-rss - 测试RSS解析
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json(
      { success: false, error: 'URL parameter is required' },
      { status: 400 }
    );
  }

  try {
    console.log(`Testing RSS parsing for: ${url}`);

    const result = await nitterFetcher.fetchRSSFeed(url);

    console.log(`RSS parsing result:`, {
      success: result.success,
      itemsCount: result.itemsCount,
      newItemsCount: result.newItemsCount,
      error: result.error
    });

    const result2 = await nitterFetcher.fetchRSSFeed(url);

    // 为了调试，返回前3个项目的详细信息
    const detailedItems = result2.items?.slice(0, 3).map(item => ({
      guid: item.guid,
      title: item.title,
      creator: item.creator,
      author: item.author,
      link: item.link,
      image: item.rawData?.image,
      feedImage: item.rawData?.['feed:image'],
      authorImage: item.rawData?.['author:image'],
      rawDataKeys: item.rawData ? Object.keys(item.rawData) : []
    }));

    return NextResponse.json({
      success: result2.success,
      itemsCount: result2.itemsCount,
      newItemsCount: result2.newItemsCount,
      error: result2.error,
      detailedItems,
      sampleItem: result2.items?.[0] || null,
      feedInfo: {
        title: result2.items?.[0]?.rawData?.feedTitle,
        image: result2.items?.[0]?.rawData?.feedImage,
        description: result2.items?.[0]?.rawData?.feedDescription
      }
    });

  } catch (error) {
    console.error('Error testing RSS:', error);
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