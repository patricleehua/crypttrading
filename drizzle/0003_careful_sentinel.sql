CREATE TYPE "public"."subscription_status" AS ENUM('active', 'paused', 'error', 'disabled');--> statement-breakpoint
CREATE TYPE "public"."subscription_type" AS ENUM('nitter_rss', 'twitter_rss', 'youtube_rss', 'reddit_rss', 'generic_rss', 'webhook', 'api');--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "subscriptions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(255) NOT NULL,
	"description" text,
	"type" "subscription_type" NOT NULL,
	"url" varchar(1000) NOT NULL,
	"config" jsonb,
	"status" "subscription_status" DEFAULT 'active' NOT NULL,
	"created_by" integer NOT NULL,
	"last_fetch_at" timestamp,
	"last_fetch_count" integer DEFAULT 0,
	"last_error" text,
	"last_error_at" timestamp,
	"total_fetches" integer DEFAULT 0,
	"total_items" integer DEFAULT 0,
	"error_count" integer DEFAULT 0,
	"is_enabled" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscription_configs" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "subscription_configs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"subscription_id" integer NOT NULL,
	"cron_schedule" varchar(100),
	"auto_fetch" boolean DEFAULT true,
	"max_items" integer DEFAULT 50,
	"fetch_interval" integer DEFAULT 60,
	"retry_count" integer DEFAULT 3,
	"timeout" integer DEFAULT 30,
	"user_agent" varchar(500),
	"headers" jsonb,
	"proxy" jsonb,
	"filters" jsonb,
	"deduplication" jsonb,
	"keep_raw_data" boolean DEFAULT true,
	"enable_notifications" boolean DEFAULT false,
	"notification_config" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "subscription_id" integer;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "raw_data" jsonb;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_configs" ADD CONSTRAINT "subscription_configs_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE cascade ON UPDATE no action;