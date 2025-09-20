'use client';

import { useState } from 'react';

interface DataSource {
  id: string;
  name: string;
  type: 'twitter_rss' | 'telegram' | 'discord';
  url: string;
  status: 'active' | 'inactive' | 'error';
  lastUpdate: string;
}

export default function DataSourceConfig() {
  const [dataSources, setDataSources] = useState<DataSource[]>([
    {
      id: '1',
      name: 'Crypto Whale Alerts',
      type: 'twitter_rss',
      url: 'https://twitter.com/whale_alert/rss',
      status: 'active',
      lastUpdate: '2分钟前'
    },
    {
      id: '2',
      name: 'Trading Guru RSS',
      type: 'twitter_rss',
      url: 'https://twitter.com/trading_guru/rss',
      status: 'active',
      lastUpdate: '5分钟前'
    },
    {
      id: '3',
      name: 'Market News Feed',
      type: 'twitter_rss',
      url: 'https://twitter.com/market_news/rss',
      status: 'error',
      lastUpdate: '1小时前'
    }
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newSource, setNewSource] = useState({
    name: '',
    type: 'twitter_rss' as const,
    url: ''
  });

  const handleAddSource = () => {
    if (newSource.name && newSource.url) {
      const source: DataSource = {
        id: Date.now().toString(),
        name: newSource.name,
        type: newSource.type,
        url: newSource.url,
        status: 'inactive',
        lastUpdate: '刚刚'
      };
      setDataSources([...dataSources, source]);
      setNewSource({ name: '', type: 'twitter_rss', url: '' });
      setShowAddForm(false);
    }
  };

  const toggleStatus = (id: string) => {
    setDataSources(dataSources.map(source =>
      source.id === id
        ? { ...source, status: source.status === 'active' ? 'inactive' : 'active' }
        : source
    ));
  };

  const deleteSource = (id: string) => {
    setDataSources(dataSources.filter(source => source.id !== id));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return '运行中';
      case 'inactive': return '已停止';
      case 'error': return '错误';
      default: return '未知';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">数据采集源配置</h2>
          <p className="text-sm text-gray-600 mt-1">管理Twitter RSS和其他数据源</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          添加数据源
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">添加新数据源</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                数据源名称
              </label>
              <input
                type="text"
                value={newSource.name}
                onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="输入数据源名称"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                数据源类型
              </label>
              <select
                value={newSource.type}
                onChange={(e) => setNewSource({ ...newSource, type: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="twitter_rss">Twitter RSS</option>
                <option value="telegram">Telegram</option>
                <option value="discord">Discord</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                RSS URL或数据源地址
              </label>
              <input
                type="url"
                value={newSource.url}
                onChange={(e) => setNewSource({ ...newSource, url: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://example.com/rss"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-3 mt-4">
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleAddSource}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              添加
            </button>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">已配置的数据源</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {dataSources.map((source) => (
            <div key={source.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h4 className="text-sm font-medium text-gray-900">{source.name}</h4>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(source.status)}`}>
                      {getStatusText(source.status)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{source.url}</p>
                  <p className="text-xs text-gray-400 mt-1">最后更新: {source.lastUpdate}</p>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => toggleStatus(source.id)}
                    className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                      source.status === 'active'
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {source.status === 'active' ? '停止' : '启动'}
                  </button>
                  <button
                    onClick={() => deleteSource(source.id)}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">配置说明</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Twitter RSS: 输入Twitter用户的RSS订阅地址</li>
          <li>• 系统会自动监控数据源，实时采集新内容</li>
          <li>• 采集到的数据会自动送入AI模型进行分析</li>
          <li>• 建议定期检查数据源状态，确保正常运行</li>
        </ul>
      </div>
    </div>
  );
}