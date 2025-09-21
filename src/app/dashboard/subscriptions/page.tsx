'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface Subscription {
  subscription: {
    id: number;
    name: string;
    description?: string;
    type: string;
    url: string;
    status: string;
    isEnabled: boolean;
    lastFetchAt?: string;
    lastFetchCount?: number;
    totalItems?: number;
    errorCount?: number;
    createdAt: string;
  };
  config?: {
    autoFetch: boolean;
    cronSchedule?: string;
    maxItems?: number;
    fetchInterval?: number;
  };
}

interface DataSource {
  id: number;
  name: string;
  type: 'nitter_rss' | 'twitter_rss' | 'generic_rss' | 'telegram' | 'discord';
  url: string;
  status: 'active' | 'paused' | 'error';
  lastUpdate: string;
  totalItems?: number;
  errorCount?: number;
  isEnabled: boolean;
}

export default function SubscriptionsPage() {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 0
  });

  const [search, setSearch] = useState('');
  const [newSource, setNewSource] = useState({
    name: '',
    type: 'nitter_rss' as const,
    url: '',
    description: '',
    autoFetch: true,
    cronSchedule: '0 */30 * * * *', // 每30分钟
    maxItems: 50
  });

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search })
      });

      const response = await fetch(`/api/subscriptions?${params}`);
      const data = await response.json();

      if (data.success) {
        setSubscriptions(data.data);
        setPagination(data.pagination);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch subscriptions');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Error fetching subscriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, [pagination.page, search]);

  // 添加新数据源
  const handleAddSource = async () => {
    if (!newSource.name || !newSource.url || !user) {
      alert('请填写所有必填字段');
      return;
    }

    try {
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newSource.name,
          description: newSource.description,
          type: newSource.type,
          url: newSource.url,
          createdBy: user.id,
          subscriptionConfig: {
            autoFetch: newSource.autoFetch,
            cronSchedule: newSource.cronSchedule,
            maxItems: newSource.maxItems
          }
        })
      });

      const data = await response.json();

      if (data.success) {
        setNewSource({
          name: '',
          type: 'nitter_rss',
          url: '',
          description: '',
          autoFetch: true,
          cronSchedule: '0 */30 * * * *',
          maxItems: 50
        });
        setShowAddForm(false);

        // 立即刷新列表
        await fetchSubscriptions();

        // 更好的成功提示
        setTimeout(() => {
          alert('✅ 数据源添加成功！\n🔄 系统将自动开始抓取内容。');
        }, 100);
      } else {
        alert('❌ ' + (data.error || '添加数据源失败'));
      }
    } catch (error) {
      console.error('Error adding data source:', error);
      alert('网络错误，请重试');
    }
  };

  // 切换状态
  const toggleStatus = async (id: number, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'paused' : 'active';
      const response = await fetch(`/api/subscriptions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subscription: { status: newStatus }
        })
      });

      const data = await response.json();
      if (data.success) {
        fetchSubscriptions(); // 刷新列表
      } else {
        alert(data.error || '操作失败');
      }
    } catch (error) {
      console.error('Error toggling status:', error);
      alert('网络错误，请重试');
    }
  };

  // 删除数据源
  const deleteSource = async (id: number) => {
    if (!confirm('确定要删除这个数据源吗？')) {
      return;
    }

    try {
      const response = await fetch(`/api/subscriptions/${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      if (data.success) {
        fetchSubscriptions(); // 刷新列表
        alert('删除成功');
      } else {
        alert(data.error || '删除失败');
      }
    } catch (error) {
      console.error('Error deleting source:', error);
      alert('网络错误，请重试');
    }
  };

  const handleManualFetch = async (id: number) => {
    try {
      const response = await fetch(`/api/subscriptions/${id}/fetch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        alert(`Successfully fetched ${data.data.newItemsCount} new items`);
        fetchSubscriptions();
      } else {
        alert(data.error || 'Failed to fetch subscription');
      }
    } catch (err) {
      alert('Network error occurred');
      console.error('Error fetching subscription:', err);
    }
  };


  if (loading && subscriptions.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading subscriptions...</div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return '活跃';
      case 'paused': return '暂停';
      case 'error': return '错误';
      default: return '未知';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">数据源配置</h2>
          <p className="text-sm text-gray-600 mt-1">管理RSS订阅和其他数据源</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          添加数据源
        </button>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="搜索订阅..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {showAddForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-lg">
          <h3 className="text-xl font-medium text-gray-900 mb-6">添加新数据源</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                数据源名称
              </label>
              <input
                type="text"
                value={newSource.name}
                onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="请输入数据源名称"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                数据源类型
              </label>
              <select
                value={newSource.type}
                onChange={(e) => setNewSource({ ...newSource, type: e.target.value as any })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="nitter_rss">Nitter RSS</option>
                <option value="twitter_rss">Twitter RSS</option>
                <option value="generic_rss">通用 RSS</option>
                <option value="telegram">Telegram</option>
                <option value="discord">Discord</option>
              </select>
            </div>
            <div className="md:col-span-2 space-y-1">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                RSS URL 或数据源地址
              </label>
              <input
                type="url"
                value={newSource.url}
                onChange={(e) => setNewSource({ ...newSource, url: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="https://dockerproxy.shumei.eu.org/elonmusk/rss"
              />
            </div>
            <div className="md:col-span-2 space-y-1">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                描述 (可选)
              </label>
              <textarea
                value={newSource.description}
                onChange={(e) => setNewSource({ ...newSource, description: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                rows={3}
                placeholder="简要描述这个数据源"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                抓取频率设置
              </label>
              <select
                value={newSource.cronSchedule}
                onChange={(e) => setNewSource({ ...newSource, cronSchedule: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="0 */15 * * * *">每15分钟</option>
                <option value="0 */30 * * * *">每30分钟</option>
                <option value="0 0 * * * *">每小时</option>
                <option value="0 0 */6 * * *">每6小时</option>
                <option value="0 0 0 * * *">每天</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                单次抓取最大条目数
              </label>
              <input
                type="number"
                value={newSource.maxItems}
                onChange={(e) => setNewSource({ ...newSource, maxItems: parseInt(e.target.value) })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                min="1"
                max="200"
              />
            </div>
          </div>
          <div className="flex items-center space-x-3 mt-6 p-4 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              id="autoFetch"
              checked={newSource.autoFetch}
              onChange={(e) => setNewSource({ ...newSource, autoFetch: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="autoFetch" className="text-sm font-medium text-gray-700">
              启用自动抓取（根据设定的频率自动获取新内容）
            </label>
          </div>
          <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={() => setShowAddForm(false)}
              className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              取消
            </button>
            <button
              onClick={handleAddSource}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
            >
              添加数据源
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">已配置的数据源</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {subscriptions.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              <div className="text-4xl mb-2">📡</div>
              <p>尚未配置任何数据源</p>
              <p className="text-sm">添加您的第一个RSS订阅来开始使用</p>
            </div>
          ) : (
            subscriptions.map(({ subscription, config }) => (
              <div key={subscription.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h4 className="text-sm font-medium text-gray-900">{subscription.name}</h4>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(subscription.status)}`}>
                        {getStatusText(subscription.status)}
                      </span>
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                        {subscription.type.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{subscription.url}</p>
                    {subscription.description && (
                      <p className="text-xs text-gray-400 mt-1">{subscription.description}</p>
                    )}
                    <div className="flex items-center space-x-4 text-xs text-gray-400 mt-1">
                      <span>最后更新: {subscription.lastFetchAt
                        ? new Date(subscription.lastFetchAt).toLocaleString('zh-CN')
                        : '从未'}</span>
                      <span>条目数: {subscription.totalItems || 0}</span>
                      {(subscription.errorCount || 0) > 0 && (
                        <span className="text-red-600">错误数: {subscription.errorCount || 0}</span>
                      )}
                      {config?.autoFetch && (
                        <span className="text-green-600">自动抓取已启用</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleManualFetch(subscription.id)}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                    >
                      立即抓取
                    </button>
                    <button
                      onClick={() => toggleStatus(subscription.id, subscription.status)}
                      className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                        subscription.status === 'active'
                          ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {subscription.status === 'active' ? '暂停' : '激活'}
                    </button>
                    <button
                      onClick={() => deleteSource(subscription.id)}
                      className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {pagination.totalPages > 1 && (
        <div className="mt-6 flex justify-between items-center">
          <div className="text-sm text-gray-700">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of{' '}
            {pagination.totalCount} results
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={!pagination.hasPrev}
              className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded">
              {pagination.page}
            </span>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={!pagination.hasNext}
              className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">配置指南</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>Nitter RSS:</strong> 使用格式如 https://dockerproxy.shumei.eu.org/username/rss 的URL</li>
          <li>• <strong>自动抓取:</strong> 系统会自动监控并收集新内容</li>
          <li>• <strong>手动抓取:</strong> 点击&ldquo;立即抓取&rdquo;按钮立即收集最新内容</li>
          <li>• <strong>定时设置:</strong> 配置检查新内容的频率</li>
          <li>• 定期监控状态以确保正常运行</li>
        </ul>
      </div>
    </div>
  );
}