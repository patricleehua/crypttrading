'use client';

import { useState } from 'react';

interface TradingAccount {
  id: string;
  name: string;
  exchange: string;
  status: 'connected' | 'disconnected' | 'error';
  balance: number;
  currency: string;
  lastSync: string;
  riskLevel: 'low' | 'medium' | 'high';
}

export default function TradingAccountConfig() {
  const [accounts, setAccounts] = useState<TradingAccount[]>([
    {
      id: '1',
      name: 'Binance 主账户',
      exchange: 'binance',
      status: 'connected',
      balance: 50000,
      currency: 'USDT',
      lastSync: '2分钟前',
      riskLevel: 'medium'
    },
    {
      id: '2',
      name: 'OKX 套利账户',
      exchange: 'okx',
      status: 'connected',
      balance: 25000,
      currency: 'USDT',
      lastSync: '5分钟前',
      riskLevel: 'low'
    },
    {
      id: '3',
      name: 'Bybit 高风险',
      exchange: 'bybit',
      status: 'error',
      balance: 0,
      currency: 'USDT',
      lastSync: '1小时前',
      riskLevel: 'high'
    }
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newAccount, setNewAccount] = useState({
    name: '',
    exchange: 'binance',
    apiKey: '',
    secretKey: '',
    riskLevel: 'medium' as const
  });

  const handleAddAccount = () => {
    if (newAccount.name && newAccount.apiKey && newAccount.secretKey) {
      const account: TradingAccount = {
        id: Date.now().toString(),
        name: newAccount.name,
        exchange: newAccount.exchange,
        status: 'disconnected',
        balance: 0,
        currency: 'USDT',
        lastSync: '未同步',
        riskLevel: newAccount.riskLevel
      };
      setAccounts([...accounts, account]);
      setNewAccount({ name: '', exchange: 'binance', apiKey: '', secretKey: '', riskLevel: 'medium' });
      setShowAddForm(false);
    }
  };

  const toggleStatus = (id: string) => {
    setAccounts(accounts.map(account =>
      account.id === id
        ? {
            ...account,
            status: account.status === 'connected' ? 'disconnected' : 'connected',
            lastSync: account.status === 'disconnected' ? '刚刚' : account.lastSync
          }
        : account
    ));
  };

  const deleteAccount = (id: string) => {
    setAccounts(accounts.filter(account => account.id !== id));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-100 text-green-800';
      case 'disconnected': return 'bg-gray-100 text-gray-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected': return '已连接';
      case 'disconnected': return '未连接';
      case 'error': return '连接错误';
      default: return '未知';
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-blue-100 text-blue-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskLevelText = (level: string) => {
    switch (level) {
      case 'low': return '低风险';
      case 'medium': return '中风险';
      case 'high': return '高风险';
      default: return '未知';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">交易账号配置</h2>
          <p className="text-sm text-gray-600 mt-1">管理交易所API连接和账户设置</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          添加账号
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">添加交易账号</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                账号名称
              </label>
              <input
                type="text"
                value={newAccount.name}
                onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="输入账号名称"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                交易所
              </label>
              <select
                value={newAccount.exchange}
                onChange={(e) => setNewAccount({ ...newAccount, exchange: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="binance">Binance</option>
                <option value="okx">OKX</option>
                <option value="bybit">Bybit</option>
                <option value="coinbase">Coinbase</option>
                <option value="kraken">Kraken</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Key
              </label>
              <input
                type="text"
                value={newAccount.apiKey}
                onChange={(e) => setNewAccount({ ...newAccount, apiKey: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="输入API Key"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Secret Key
              </label>
              <input
                type="password"
                value={newAccount.secretKey}
                onChange={(e) => setNewAccount({ ...newAccount, secretKey: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="输入Secret Key"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                风险等级
              </label>
              <select
                value={newAccount.riskLevel}
                onChange={(e) => setNewAccount({ ...newAccount, riskLevel: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="low">低风险 - 保守交易策略</option>
                <option value="medium">中风险 - 平衡交易策略</option>
                <option value="high">高风险 - 激进交易策略</option>
              </select>
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
              onClick={handleAddAccount}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              添加
            </button>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">已配置的交易账号</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {accounts.map((account) => (
            <div key={account.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h4 className="text-sm font-medium text-gray-900">{account.name}</h4>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(account.status)}`}>
                      {getStatusText(account.status)}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${getRiskLevelColor(account.riskLevel)}`}>
                      {getRiskLevelText(account.riskLevel)}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                    <span>交易所: {account.exchange.toUpperCase()}</span>
                    <span>余额: {account.balance.toLocaleString()} {account.currency}</span>
                    <span>最后同步: {account.lastSync}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => toggleStatus(account.id)}
                    className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                      account.status === 'connected'
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {account.status === 'connected' ? '断开' : '连接'}
                  </button>
                  <button className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors">
                    测试
                  </button>
                  <button
                    onClick={() => deleteAccount(account.id)}
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-yellow-900 mb-2">⚠️ 安全提醒</h4>
          <ul className="text-sm text-yellow-800 space-y-1">
            <li>• API密钥将加密存储，请妥善保管</li>
            <li>• 建议使用只读或受限权限的API</li>
            <li>• 定期更换API密钥确保安全</li>
            <li>• 不要在公共网络环境下配置</li>
          </ul>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">风险等级说明</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>低风险</strong>: 小额交易，保守策略</li>
            <li>• <strong>中风险</strong>: 适中仓位，平衡策略</li>
            <li>• <strong>高风险</strong>: 大额交易，激进策略</li>
            <li>• 系统会根据风险等级调整交易参数</li>
          </ul>
        </div>
      </div>
    </div>
  );
}