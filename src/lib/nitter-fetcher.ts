import { rssParser, ParsedRSSItem, ParsedRSSFeed } from './rss-parser';
import { db } from '@/db';
import { postsTable, subscriptionsTable } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';

export interface NitterFetchConfig {
  maxItems?: number;
  timeout?: number;
  retryCount?: number;
  userAgent?: string;
  headers?: Record<string, string>;
  deduplication?: {
    enabled: boolean;
    field: 'guid' | 'link' | 'title';
  };
}

export interface FetchResult {
  success: boolean;
  itemsCount: number;
  newItemsCount: number;
  error?: string;
  items?: ParsedRSSItem[];
}

export class NitterFetcher {
  private defaultConfig: Required<NitterFetchConfig> = {
    maxItems: 50,
    timeout: 30000,
    retryCount: 3,
    userAgent: 'Mozilla/5.0 (compatible; RSS-Reader/1.0)',
    headers: {},
    deduplication: {
      enabled: true,
      field: 'guid'
    }
  };

  async fetchSubscription(subscriptionId: number, config?: Partial<NitterFetchConfig>): Promise<FetchResult> {
    try {
      // 获取订阅信息
      const subscription = await db
        .select()
        .from(subscriptionsTable)
        .where(eq(subscriptionsTable.id, subscriptionId))
        .limit(1);

      if (!subscription.length) {
        throw new Error(`Subscription ${subscriptionId} not found`);
      }

      const sub = subscription[0];
      if (!sub.isEnabled || sub.status !== 'active') {
        return {
          success: false,
          itemsCount: 0,
          newItemsCount: 0,
          error: 'Subscription is not active or disabled'
        };
      }

      return await this.fetchRSSFeed(sub.url, subscriptionId, config);
    } catch (error) {
      console.error(`Error fetching subscription ${subscriptionId}:`, error);
      return {
        success: false,
        itemsCount: 0,
        newItemsCount: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async fetchRSSFeed(url: string, subscriptionId?: number, config?: Partial<NitterFetchConfig>): Promise<FetchResult> {
    const mergedConfig = { ...this.defaultConfig, ...config };

    try {
      console.log(`Fetching RSS feed: ${url}`);

      // 使用自定义fetch配置
      const feedData = await this.fetchWithConfig(url, mergedConfig);
      const feed = await rssParser.parseString(feedData);

      if (!feed.items || feed.items.length === 0) {
        return {
          success: true,
          itemsCount: 0,
          newItemsCount: 0,
          items: []
        };
      }

      // 限制条目数量
      const items = feed.items.slice(0, mergedConfig.maxItems);

      let newItemsCount = 0;
      const processedItems: ParsedRSSItem[] = [];

      if (subscriptionId) {
        // 保存到数据库
        for (const item of items) {
          const saved = await this.saveItemToDatabase(item, subscriptionId, mergedConfig);
          if (saved) {
            newItemsCount++;
            processedItems.push(item);
          }
        }

        // 更新订阅状态
        await this.updateSubscriptionStatus(subscriptionId, true, items.length, null);
      } else {
        processedItems.push(...items);
        newItemsCount = items.length;
      }

      return {
        success: true,
        itemsCount: items.length,
        newItemsCount,
        items: processedItems
      };

    } catch (error) {
      console.error(`Error fetching RSS feed ${url}:`, error);

      if (subscriptionId) {
        await this.updateSubscriptionStatus(subscriptionId, false, 0, error instanceof Error ? error.message : 'Unknown error');
      }

      return {
        success: false,
        itemsCount: 0,
        newItemsCount: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async fetchWithConfig(url: string, config: Required<NitterFetchConfig>): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout);

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': config.userAgent,
          ...config.headers
        },
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.text();
      return data;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async saveItemToDatabase(item: ParsedRSSItem, subscriptionId: number, config: Required<NitterFetchConfig>): Promise<boolean> {
    try {
      // 去重检查
      if (config.deduplication.enabled && item[config.deduplication.field]) {
        const existing = await db
          .select()
          .from(postsTable)
          .where(
            and(
              eq(postsTable.subscriptionId, subscriptionId),
              eq(postsTable.externalId, item[config.deduplication.field] || '')
            )
          )
          .limit(1);

        if (existing.length > 0) {
          console.log(`Item already exists: ${item[config.deduplication.field]}`);
          return false;
        }
      }

      // 解析发布时间
      const publishedAt = item.isoDate ? new Date(item.isoDate) :
                         item.pubDate ? new Date(item.pubDate) :
                         new Date();

      // 提取媒体URLs
      const mediaUrls = this.extractMediaUrls(item);

      // 提取作者头像 - 从item中提取
      const authorAvatar = this.extractAuthorAvatar(item);

      // 提取标签和提及
      const { hashtags, mentions } = this.extractHashtagsAndMentions(item.content || item.title || '');

      // 提取更准确的作者信息
      const { authorName, authorUsername, authorId } = this.extractAuthorInfo(item);


      // 保存到数据库
      await db.insert(postsTable).values({
        externalId: item.guid || item.link || `${subscriptionId}-${Date.now()}`,
        title: item.title?.slice(0, 500) || '',
        content: item.content || item.contentSnippet || '',
        type: 'original',
        contentType: mediaUrls.length > 0 ? 'mixed' : 'text',
        sourceType: 'twitter', // Nitter是Twitter的代理
        subscriptionId,
        rssSource: item.link,
        linkUrl: item.link,
        rawData: item,
        authorId,
        authorName,
        authorUsername,
        authorAvatar,
        mediaUrls: mediaUrls.length > 0 ? JSON.stringify(mediaUrls) : null,
        hashtags: hashtags.length > 0 ? JSON.stringify(hashtags) : null,
        mentions: mentions.length > 0 ? JSON.stringify(mentions) : null,
        publishedAt,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      return true;
    } catch (error) {
      console.error('Error saving item to database:', error);
      return false;
    }
  }

  private extractMediaUrls(item: ParsedRSSItem): string[] {
    const urls: string[] = [];

    // 从enclosure提取
    if (item.enclosure?.url) {
      urls.push(item.enclosure.url);
    }

    // 从media:content提取
    if (item.mediaContent) {
      if (Array.isArray(item.mediaContent)) {
        urls.push(...item.mediaContent.map((m: any) => m.url || m.$?.url).filter(Boolean));
      } else if (item.mediaContent.url || item.mediaContent.$?.url) {
        urls.push(item.mediaContent.url || item.mediaContent.$?.url);
      }
    }

    // 从content中提取图片链接
    if (item.content) {
      const imgMatches = item.content.match(/<img[^>]+src="([^"]+)"/g);
      if (imgMatches) {
        imgMatches.forEach(match => {
          const src = match.match(/src="([^"]+)"/)?.[1];
          if (src) urls.push(src);
        });
      }
    }

    return [...new Set(urls)]; // 去重
  }

  private extractHashtagsAndMentions(text: string): { hashtags: string[], mentions: string[] } {
    const hashtags = text.match(/#[\w\u4e00-\u9fff]+/g) || [];
    const mentions = text.match(/@[\w\u4e00-\u9fff]+/g) || [];

    return {
      hashtags: hashtags.map(tag => tag.slice(1)), // 移除#
      mentions: mentions.map(mention => mention.slice(1)) // 移除@
    };
  }

  private extractUsername(creator?: string): string | null {
    if (!creator) return null;

    // 从 "Full Name / @username" 格式中提取用户名
    const match = creator.match(/@(\w+)/);
    return match ? match[1] : creator;
  }

  private extractAuthorAvatar(item: ParsedRSSItem): string | null {
    try {
      const rawData = item.rawData;
      if (!rawData) return null;

      // 1. 检查item级别的image字段（RSShub格式）
      if (rawData.image) {
        // RSShub格式: { url: "...", title: "...", link: "..." }
        if (typeof rawData.image === 'object' && rawData.image.url) {
          return rawData.image.url;
        }
        // 字符串格式
        if (typeof rawData.image === 'string') {
          return rawData.image;
        }
      }

      // 2. 检查各种可能的image字段名
      const imageFields = [
        'feedImage', 'feed:image', 'channel:image',
        'authorImage', 'author:image', 'creatorImage'
      ];

      for (const field of imageFields) {
        const imageData = rawData[field];
        if (imageData) {
          if (typeof imageData === 'string') {
            return imageData;
          }
          if (typeof imageData === 'object' && imageData.url) {
            return imageData.url;
          }
        }
      }

      // 3. 从content中提取头像链接
      if (item.content) {
        // 匹配Twitter/Nitter头像链接
        const patterns = [
          /https?:\/\/[^"'\s]*profile_images[^"'\s]*/g,
          /https?:\/\/[^"'\s]*avatar[^"'\s]*/g,
          /https?:\/\/pbs\.twimg\.com\/profile_images[^"'\s]*/g
        ];

        for (const pattern of patterns) {
          const matches = item.content.match(pattern);
          if (matches && matches.length > 0) {
            return matches[0];
          }
        }
      }

      return null;
    } catch (error) {
      console.error('Error extracting author avatar:', error);
      return null;
    }
  }

  private extractAuthorInfo(item: ParsedRSSItem): { authorName: string | null, authorUsername: string | null, authorId: string | null } {
    try {
      const creator = item.creator || item.author;

      if (!creator) {
        return {
          authorName: null,
          authorUsername: null,
          authorId: null
        };
      }

      // 处理不同的格式
      let authorName = creator;
      let authorUsername = null;
      let authorId = creator;

      // 格式1: "Full Name / @username"
      const slashMatch = creator.match(/^(.+?)\s*\/\s*@(\w+)$/);
      if (slashMatch) {
        authorName = slashMatch[1].trim();
        authorUsername = slashMatch[2];
        authorId = `@${authorUsername}`;
        return { authorName, authorUsername, authorId };
      }

      // 格式2: "Full Name (@username)"
      const parenMatch = creator.match(/^(.+?)\s*\(\s*@(\w+)\s*\)$/);
      if (parenMatch) {
        authorName = parenMatch[1].trim();
        authorUsername = parenMatch[2];
        authorId = `@${authorUsername}`;
        return { authorName, authorUsername, authorId };
      }

      // 格式3: "@username"
      const usernameMatch = creator.match(/^@(\w+)$/);
      if (usernameMatch) {
        authorUsername = usernameMatch[1];
        authorName = authorUsername;
        authorId = creator;
        return { authorName, authorUsername, authorId };
      }

      // 格式4: 纯用户名
      if (creator.match(/^\w+$/)) {
        authorUsername = creator;
        authorName = creator;
        authorId = creator;
        return { authorName, authorUsername, authorId };
      }

      // 默认处理
      return {
        authorName: creator,
        authorUsername: this.extractUsername(creator),
        authorId: creator
      };
    } catch (error) {
      console.error('Error extracting author info:', error);
      return {
        authorName: item.creator || item.author || null,
        authorUsername: null,
        authorId: item.creator || item.author || null
      };
    }
  }

  private async updateSubscriptionStatus(
    subscriptionId: number,
    success: boolean,
    itemsCount: number,
    error: string | null
  ): Promise<void> {
    try {
      const updateData: any = {
        updatedAt: new Date(),
        totalFetches: sql`total_fetches + 1`
      };

      if (success) {
        updateData.lastFetchAt = new Date();
        updateData.lastFetchCount = itemsCount;
        updateData.totalItems = sql`total_items + ${itemsCount}`;
        updateData.status = 'active';
      } else {
        updateData.lastError = error;
        updateData.lastErrorAt = new Date();
        updateData.errorCount = sql`error_count + 1`;
        updateData.status = 'error';
      }

      await db
        .update(subscriptionsTable)
        .set(updateData)
        .where(eq(subscriptionsTable.id, subscriptionId));
    } catch (error) {
      console.error('Error updating subscription status:', error);
    }
  }
}

export const nitterFetcher = new NitterFetcher();