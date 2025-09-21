import {
  integer,
  pgTable,
  timestamp,
  varchar,
  text,
  boolean,
  jsonb
} from "drizzle-orm/pg-core";
import { subscriptionsTable } from "./subscriptions";

export const subscriptionConfigsTable = pgTable("subscription_configs", {
  // 主键ID
  id: integer().primaryKey().generatedAlwaysAsIdentity(),

  // 订阅源ID
  subscriptionId: integer("subscription_id").references(() => subscriptionsTable.id, { onDelete: "cascade" }).notNull(),

  // Cron表达式（定时抓取）
  cronSchedule: varchar("cron_schedule", { length: 100 }),

  // 是否启用自动抓取
  autoFetch: boolean("auto_fetch").default(true),

  // 单次抓取最大条目数
  maxItems: integer("max_items").default(50),

  // 抓取间隔（分钟）
  fetchInterval: integer("fetch_interval").default(60),

  // 重试次数
  retryCount: integer("retry_count").default(3),

  // 超时时间（秒）
  timeout: integer("timeout").default(30),

  // 用户代理
  userAgent: varchar("user_agent", { length: 500 }),

  // 请求头（JSON格式）
  headers: jsonb(),

  // 代理配置（JSON格式）
  proxy: jsonb(),

  // 过滤规则（JSON格式）
  filters: jsonb(),

  // 去重配置
  deduplication: jsonb(),

  // 是否保留原始数据
  keepRawData: boolean("keep_raw_data").default(true),

  // 是否启用通知
  enableNotifications: boolean("enable_notifications").default(false),

  // 通知配置（JSON格式）
  notificationConfig: jsonb("notification_config"),

  // 创建和更新时间
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});