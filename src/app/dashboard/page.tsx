'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface DashboardStats {
  overview: {
    totalSubscriptions: number;
    activeSubscriptions: number;
    totalPosts: number;
    recentPosts: number;
    timeRange: string;
  };
  subscriptions: Array<{
    subscription: {
      id: number;
      name: string;
      type: string;
      status: string;
      lastFetchAt?: string;
      totalItems?: number;
      errorCount?: number;
    };
    postsCount: number;
    recentPostsCount: number;
  }>;
  scheduler: {
    isRunning: boolean;
    taskCount: number;
    tasks: Array<{
      id: string;
      subscriptionId: number;
      lastRun?: string;
      nextRun?: string;
    }>;
  };
  dailyStats: Array<{
    date: string;
    count: number;
  }>;
  topAuthors: Array<{
    authorUsername: string;
    authorName?: string;
    count: number;
  }>;
}

export default function DashboardOverview() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/stats?days=7');
      const data = await response.json();

      if (data.success) {
        setStats(data.data);
        setError(null);
      } else {
        setError(data.error || '获取统计数据失败');
      }
    } catch (err) {
      setError('网络错误');
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // 定期刷新统计数据
    const interval = setInterval(fetchStats, 30000); // 30秒
    return () => clearInterval(interval);
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'paused':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">加载仪表板中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          仪表板加载错误: {error}
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-xl font-semibold text-gray-900">RSS采集仪表板</h2>
        <p className="text-sm text-gray-600 mt-1">监控您的RSS订阅和内容采集</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">📡</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-blue-900">总订阅数</p>
              <p className="text-2xl font-bold text-blue-600">{stats.overview.totalSubscriptions}</p>
              <p className="text-xs text-blue-700">{stats.overview.activeSubscriptions} 活跃</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 p-6 rounded-lg border border-green-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">📰</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-green-900">总文章数</p>
              <p className="text-2xl font-bold text-green-600">{stats.overview.totalPosts}</p>
              <p className="text-xs text-green-700">{stats.overview.recentPosts} 在 {stats.overview.timeRange}</p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">⚡</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-yellow-900">调度器</p>
              <p className="text-2xl font-bold text-yellow-600">
                {stats.scheduler.isRunning ? '运行中' : '已停止'}
              </p>
              <p className="text-xs text-yellow-700">{stats.scheduler.taskCount} 活跃任务</p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">📊</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-purple-900">采集速率</p>
              <p className="text-2xl font-bold text-purple-600">
                {stats.dailyStats.length > 0
                  ? Math.round(stats.overview.recentPosts / 7 * 10) / 10
                  : 0}/day
              </p>
              <p className="text-xs text-purple-700">每日平均</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Subscriptions Activity */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">最近订阅活动</h3>
            <Link href="/dashboard/subscriptions" className="text-sm text-blue-600 hover:text-blue-800">
              查看全部
            </Link>
          </div>
          <div className="space-y-3">
            {stats.subscriptions.slice(0, 5).map(({ subscription }) => (
              <div key={subscription.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 ${getStatusColor(subscription.status)} rounded-full`}></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{subscription.name}</p>
                    <p className="text-xs text-gray-500">
                      {subscription.type.replace('_', ' ').toUpperCase()} • {subscription.totalItems || 0} 项目
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">
                    {subscription.lastFetchAt
                      ? new Date(subscription.lastFetchAt).toLocaleDateString('zh-CN')
                      : '从未'
                    }
                  </p>
                  {subscription.errorCount > 0 && (
                    <p className="text-xs text-red-600">{subscription.errorCount} 错误</p>
                  )}
                </div>
              </div>
            ))}
            {stats.subscriptions.length === 0 && (
              <div className="text-center py-4 text-gray-500">
                <p>未找到订阅</p>
                <Link href="/dashboard/subscriptions" className="text-blue-600 hover:text-blue-800">
                  添加您的第一个订阅
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Top Authors */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">热门作者（最近7天）</h3>
            <Link href="/dashboard/content" className="text-sm text-blue-600 hover:text-blue-800">
              查看内容
            </Link>
          </div>
          <div className="space-y-3">
            {stats.topAuthors.slice(0, 5).map((author, index) => (
              <div key={author.authorUsername} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {author.authorName || author.authorUsername}
                    </p>
                    {author.authorName && (
                      <p className="text-xs text-gray-500">@{author.authorUsername}</p>
                    )}
                  </div>
                </div>
                <span className="text-sm font-medium text-blue-600">{author.count} 篇文章</span>
              </div>
            ))}
            {stats.topAuthors.length === 0 && (
              <div className="text-center py-4 text-gray-500">
                暂无作者数据
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Daily Collection Chart */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">每日采集活动</h3>
        <div className="grid grid-cols-7 gap-2 mb-4">
          {stats.dailyStats.map((day, index) => (
            <div key={day.date} className="text-center">
              <div className="text-xs text-gray-500 mb-1">
                {new Date(day.date).toLocaleDateString('zh-CN', { weekday: 'short' })}
              </div>
              <div
                className="bg-blue-100 rounded text-xs py-1 flex items-end justify-center relative"
                style={{
                  height: `${Math.max(20, (day.count / Math.max(...stats.dailyStats.map(d => d.count))) * 60)}px`,
                  backgroundColor: day.count > 0 ? '#3B82F6' : '#E5E7EB'
                }}
              >
                <span className="text-white font-medium">{day.count}</span>
              </div>
            </div>
          ))}
        </div>
        {stats.dailyStats.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            最近7天暂无采集数据
          </div>
        )}
      </div>

      {/* Scheduler Status */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">调度器状态</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 ${stats.scheduler.isRunning ? 'bg-green-500' : 'bg-red-500'} rounded-full`}></div>
            <span className="text-sm text-gray-700">
              调度器: {stats.scheduler.isRunning ? '运行中' : '已停止'}
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-gray-700">
              活跃任务: {stats.scheduler.taskCount}
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            <span className="text-sm text-gray-700">
              下次运行: {stats.scheduler.tasks.length > 0 && stats.scheduler.tasks[0].nextRun
                ? new Date(stats.scheduler.tasks[0].nextRun).toLocaleTimeString('zh-CN')
                : '不适用'
              }
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}