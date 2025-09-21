import {
  integer,
  pgTable,
  timestamp,
  varchar,
  text,
  boolean,
  pgEnum,
  jsonb
} from "drizzle-orm/pg-core";
import { usersTable } from "./users";

// 定义订阅源类型枚举
export const subscriptionTypeEnum = pgEnum("subscription_type", [
  "nitter_rss",    // Nitter RSS订阅
  "twitter_rss",   // 直接Twitter RSS
  "youtube_rss",   // YouTube RSS
  "reddit_rss",    // Reddit RSS
  "generic_rss",   // 通用RSS
  "webhook",       // Webhook订阅
  "api"           // API轮询
]);

// 定义订阅状态枚举
export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",       // 活跃
  "paused",       // 暂停
  "error",        // 错误
  "disabled"      // 禁用
]);

export const subscriptionsTable = pgTable("subscriptions", {
  // 主键ID
  id: integer().primaryKey().generatedAlwaysAsIdentity(),

  // 订阅名称
  name: varchar({ length: 255 }).notNull(),

  // 订阅描述
  description: text(),

  // 订阅类型
  type: subscriptionTypeEnum().notNull(),

  // 订阅源URL
  url: varchar({ length: 1000 }).notNull(),

  // 配置信息（JSON格式）
  config: jsonb(),

  // 订阅状态
  status: subscriptionStatusEnum().notNull().default("active"),

  // 创建者ID
  createdBy: integer("created_by").references(() => usersTable.id).notNull(),

  // 最后成功抓取时间
  lastFetchAt: timestamp("last_fetch_at"),

  // 最后成功抓取的条目数
  lastFetchCount: integer("last_fetch_count").default(0),

  // 最后错误信息
  lastError: text("last_error"),

  // 最后错误时间
  lastErrorAt: timestamp("last_error_at"),

  // 总抓取次数
  totalFetches: integer("total_fetches").default(0),

  // 总抓取条目数
  totalItems: integer("total_items").default(0),

  // 总错误次数
  errorCount: integer("error_count").default(0),

  // 是否启用
  isEnabled: boolean("is_enabled").default(true),

  // 创建和更新时间
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});