import {
  integer,
  pgTable,
  timestamp,
  varchar,
  text,
  boolean,
  bigint
} from "drizzle-orm/pg-core";
import { postsTable } from "./posts";

export const commentsTable = pgTable("comments", {
  // 主键ID
  id: integer().primaryKey().generatedAlwaysAsIdentity(),

  // 外部平台的原始评论ID
  externalId: varchar("external_id", { length: 255 }).notNull(),

  // 关联的帖子ID
  postId: integer("post_id").notNull().references(() => postsTable.id, { onDelete: "cascade" }),

  // 评论内容
  content: text(),

  // 评论作者信息
  authorId: varchar("author_id", { length: 255 }).notNull(), // 外部作者ID
  authorName: varchar("author_name", { length: 255 }), // 作者姓名
  authorUsername: varchar("author_username", { length: 255 }), // 作者用户名
  authorAvatar: varchar("author_avatar", { length: 1000 }), // 作者头像URL
  authorVerified: boolean("author_verified").default(false), // 作者是否认证

  // 媒体文件URLs（评论中的图片/视频等）
  mediaUrls: text("media_urls"), // JSON array of media URLs

  // 提及的用户
  mentions: text(), // JSON array of mentioned users

  // 统计数据
  likeCount: bigint("like_count", { mode: "number" }).default(0),

  // 是否置顶
  isPinned: boolean("is_pinned").default(false),

  // 是否删除（软删除）
  isDeleted: boolean("is_deleted").default(false),

  // 是否被屏蔽/隐藏
  isHidden: boolean("is_hidden").default(false),

  // 语言
  language: varchar({ length: 10 }).default("en"),

  // 发布时间（原始时间）
  publishedAt: timestamp("published_at").notNull(),

  // 创建和更新时间
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),

  // 最后同步时间
  lastSyncAt: timestamp("last_sync_at").defaultNow(),
});