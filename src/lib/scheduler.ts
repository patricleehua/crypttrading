import * as cron from 'node-cron';
import { db } from '@/db';
import { subscriptionsTable, subscriptionConfigsTable } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { nitterFetcher } from './nitter-fetcher';

export interface ScheduledTask {
  id: string;
  subscriptionId: number;
  cronExpression: string;
  task: cron.ScheduledTask;
  lastRun?: Date;
  nextRun?: Date;
}

export class TaskScheduler {
  private tasks: Map<string, ScheduledTask> = new Map();
  private isRunning = false;

  async initialize(): Promise<void> {
    console.log('Initializing task scheduler...');

    try {
      // 获取所有启用的订阅及其配置
      const subscriptionsWithConfigs = await db
        .select({
          subscription: subscriptionsTable,
          config: subscriptionConfigsTable
        })
        .from(subscriptionsTable)
        .leftJoin(
          subscriptionConfigsTable,
          eq(subscriptionsTable.id, subscriptionConfigsTable.subscriptionId)
        )
        .where(
          and(
            eq(subscriptionsTable.isEnabled, true),
            eq(subscriptionsTable.status, 'active')
          )
        );

      // 为每个订阅创建定时任务
      for (const { subscription, config } of subscriptionsWithConfigs) {
        if (config?.autoFetch && config?.cronSchedule) {
          await this.scheduleSubscriptionTask(subscription.id, config.cronSchedule);
        }
      }

      this.isRunning = true;
      console.log(`Task scheduler initialized with ${this.tasks.size} tasks`);
    } catch (error) {
      console.error('Error initializing task scheduler:', error);
    }
  }

  async scheduleSubscriptionTask(subscriptionId: number, cronExpression: string): Promise<void> {
    try {
      const taskId = `subscription-${subscriptionId}`;

      // 如果任务已存在，先停止它
      if (this.tasks.has(taskId)) {
        await this.unscheduleTask(taskId);
      }

      // 验证cron表达式
      if (!cron.validate(cronExpression)) {
        console.error(`Invalid cron expression for subscription ${subscriptionId}: ${cronExpression}`);
        return;
      }

      // 创建任务
      const task = cron.schedule(cronExpression, async () => {
        await this.executeSubscriptionFetch(subscriptionId);
      }, {
        scheduled: false // 稍后手动启动
      });

      const scheduledTask: ScheduledTask = {
        id: taskId,
        subscriptionId,
        cronExpression,
        task,
        nextRun: this.getNextRunTime(cronExpression)
      };

      this.tasks.set(taskId, scheduledTask);
      task.start();

      console.log(`Scheduled task for subscription ${subscriptionId} with cron: ${cronExpression}`);
    } catch (error) {
      console.error(`Error scheduling task for subscription ${subscriptionId}:`, error);
    }
  }

  async unscheduleTask(taskId: string): Promise<void> {
    const scheduledTask = this.tasks.get(taskId);
    if (scheduledTask) {
      scheduledTask.task.destroy();
      this.tasks.delete(taskId);
      console.log(`Unscheduled task: ${taskId}`);
    }
  }

  async executeSubscriptionFetch(subscriptionId: number): Promise<void> {
    try {
      console.log(`Executing scheduled fetch for subscription ${subscriptionId}`);

      const taskId = `subscription-${subscriptionId}`;
      const scheduledTask = this.tasks.get(taskId);

      if (scheduledTask) {
        scheduledTask.lastRun = new Date();
        scheduledTask.nextRun = this.getNextRunTime(scheduledTask.cronExpression);
      }

      // 获取订阅配置
      const config = await db
        .select()
        .from(subscriptionConfigsTable)
        .where(eq(subscriptionConfigsTable.subscriptionId, subscriptionId))
        .limit(1);

      const fetchConfig = config.length > 0 ? {
        maxItems: config[0].maxItems || 50,
        timeout: (config[0].timeout || 30) * 1000,
        retryCount: config[0].retryCount || 3,
        userAgent: config[0].userAgent || undefined,
        headers: config[0].headers as Record<string, string> || {},
        deduplication: config[0].deduplication as { enabled: boolean; field: 'guid' | 'link' | 'title' } || {
          enabled: true,
          field: 'guid'
        }
      } : {};

      // 执行抓取
      const result = await nitterFetcher.fetchSubscription(subscriptionId, fetchConfig);

      if (result.success) {
        console.log(`Successfully fetched ${result.newItemsCount} new items for subscription ${subscriptionId}`);
      } else {
        console.error(`Failed to fetch subscription ${subscriptionId}: ${result.error}`);
      }
    } catch (error) {
      console.error(`Error executing scheduled fetch for subscription ${subscriptionId}:`, error);
    }
  }

  async updateTaskSchedule(subscriptionId: number, cronExpression?: string | null): Promise<void> {
    const taskId = `subscription-${subscriptionId}`;

    // 先取消现有任务
    await this.unscheduleTask(taskId);

    // 如果提供了新的cron表达式，创建新任务
    if (cronExpression) {
      await this.scheduleSubscriptionTask(subscriptionId, cronExpression);
    }
  }

  getTasks(): ScheduledTask[] {
    return Array.from(this.tasks.values());
  }

  getTaskStatus(subscriptionId: number): ScheduledTask | null {
    const taskId = `subscription-${subscriptionId}`;
    return this.tasks.get(taskId) || null;
  }

  private getNextRunTime(cronExpression: string): Date | undefined {
    try {
      const task = cron.schedule(cronExpression, () => {}, { scheduled: false });
      const nextRun = task.nextDate();
      task.destroy();
      return nextRun ? nextRun.toJSDate() : undefined;
    } catch (error) {
      console.error('Error calculating next run time:', error);
      return undefined;
    }
  }

  async shutdown(): Promise<void> {
    console.log('Shutting down task scheduler...');

    for (const [taskId, scheduledTask] of this.tasks) {
      scheduledTask.task.destroy();
    }

    this.tasks.clear();
    this.isRunning = false;
    console.log('Task scheduler shutdown complete');
  }

  getStatus(): { isRunning: boolean; taskCount: number; tasks: ScheduledTask[] } {
    return {
      isRunning: this.isRunning,
      taskCount: this.tasks.size,
      tasks: this.getTasks()
    };
  }
}

// 全局调度器实例
export const taskScheduler = new TaskScheduler();

// 优雅关闭处理
if (typeof process !== 'undefined') {
  process.on('SIGINT', async () => {
    console.log('Received SIGINT, shutting down gracefully...');
    await taskScheduler.shutdown();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('Received SIGTERM, shutting down gracefully...');
    await taskScheduler.shutdown();
    process.exit(0);
  });
}