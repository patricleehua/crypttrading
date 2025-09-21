import {
  integer,
  pgTable,
  timestamp,
  varchar,
  text,
  boolean,
  bigint,
  pgEnum,
  jsonb
} from "drizzle-orm/pg-core";
import { usersTable } from "./users";

// 定义帖子类型枚举
export const postTypeEnum = pgEnum("post_type", ["original", "repost", "quote"]);

// 定义内容类型枚举
export const contentTypeEnum = pgEnum("content_type", ["text", "image", "video", "link", "mixed"]);

// 定义媒体来源枚举
export const sourceTypeEnum = pgEnum("source_type", ["twitter", "weibo", "reddit", "instagram", "facebook", "tiktok", "youtube", "rss", "other"]);

export const postsTable = pgTable("posts", {
  // 主键ID
  id: integer().primaryKey().generatedAlwaysAsIdentity(),

  // 外部平台的原始ID（用于去重和同步）
  externalId: varchar("external_id", { length: 255 }).notNull(),

  // 帖子标题
  title: varchar({ length: 500 }),

  // 帖子内容
  content: text(),

  // 帖子类型：原创/转发/引用
  type: postTypeEnum().notNull().default("original"),

  // 内容类型：文本/图片/视频/链接/混合
  contentType: contentTypeEnum().notNull().default("text"),

  // 媒体来源平台
  sourceType: sourceTypeEnum().notNull(),

  // 订阅源ID (关联subscriptions表)
  subscriptionId: integer("subscription_id"),

  // RSS源URL
  rssSource: varchar("rss_source", { length: 1000 }),

  // 原始数据（RSS item的完整数据）
  rawData: jsonb("raw_data"),

  // 作者信息
  authorId: varchar("author_id", { length: 255 }).notNull(), // 外部作者ID
  authorName: varchar("author_name", { length: 255 }), // 作者真实姓名
  authorUsername: varchar("author_username", { length: 255 }), // 作者用户名/昵称
  authorAvatar: varchar("author_avatar", { length: 1000 }), // 作者头像URL
  authorVerified: boolean("author_verified").default(false), // 作者是否认证

  // 原始帖子信息（用于转发/引用）
  originalPostId: varchar("original_post_id", { length: 255 }),
  originalAuthorId: varchar("original_author_id", { length: 255 }),
  originalAuthorName: varchar("original_author_name", { length: 255 }),

  // 媒体文件URLs（JSON格式存储多个媒体文件）
  mediaUrls: text("media_urls"), // JSON array of media URLs

  // 链接信息
  linkUrl: varchar("link_url", { length: 1000 }),
  linkTitle: varchar("link_title", { length: 500 }),
  linkDescription: text("link_description"),
  linkImage: varchar("link_image", { length: 1000 }),

  // 标签和话题
  hashtags: text(), // JSON array of hashtags
  mentions: text(), // JSON array of mentioned users

  // 统计数据
  viewCount: bigint("view_count", { mode: "number" }).default(0),
  likeCount: bigint("like_count", { mode: "number" }).default(0),
  commentCount: bigint("comment_count", { mode: "number" }).default(0),
  shareCount: bigint("share_count", { mode: "number" }).default(0),
  repostCount: bigint("repost_count", { mode: "number" }).default(0),

  // 位置信息
  location: varchar({ length: 255 }),
  latitude: varchar({ length: 50 }),
  longitude: varchar({ length: 50 }),

  // 语言
  language: varchar({ length: 10 }).default("en"),

  // 是否置顶
  isPinned: boolean("is_pinned").default(false),

  // 是否删除（软删除）
  isDeleted: boolean("is_deleted").default(false),

  // 是否私有
  isPrivate: boolean("is_private").default(false),

  // 发布时间（原始时间）
  publishedAt: timestamp("published_at").notNull(),

  // 创建和更新时间
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),

  // 最后同步时间
  lastSyncAt: timestamp("last_sync_at").defaultNow(),
});