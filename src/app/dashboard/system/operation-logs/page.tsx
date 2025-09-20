'use client';

import { useState } from 'react';

interface OperationLog {
  id: string;
  user: string;
  action: string;
  resource: string;
  details: string;
  timestamp: string;
  status: 'success' | 'failed' | 'warning';
  ip: string;
}

export default function OperationLogs() {
  const [logs] = useState<OperationLog[]>([
    {
      id: '1',
      user: 'admin',
      action: '添加数据源',
      resource: 'Twitter RSS',
      details: '添加了新的Twitter RSS数据源: @crypto_whale',
      timestamp: '2024-09-20 14:30:25',
      status: 'success',
      ip: '192.168.1.100'
    },
    {
      id: '2',
      user: 'trader01',
      action: '执行交易',
      resource: 'BTC/USDT',
      details: '买入 0.5 BTC，价格: $45,000',
      timestamp: '2024-09-20 14:25:18',
      status: 'success',
      ip: '192.168.1.101'
    },
    {
      id: '3',
      user: 'admin',
      action: '修改配置',
      resource: '交易参数',
      details: '调整风险等级为中等',
      timestamp: '2024-09-20 14:20:42',
      status: 'success',
      ip: '192.168.1.100'
    },
    {
      id: '4',
      user: 'trader01',
      action: '连接交易所',
      resource: 'Binance API',
      details: '尝试连接Binance API失败: 无效的API密钥',
      timestamp: '2024-09-20 14:15:33',
      status: 'failed',
      ip: '192.168.1.101'
    },
    {
      id: '5',
      user: 'analyst',
      action: '查看数据',
      resource: '交易记录',
      details: '导出了过去30天的交易记录',
      timestamp: '2024-09-20 14:10:15',
      status: 'success',
      ip: '192.168.1.102'
    },
    {
      id: '6',
      user: 'admin',
      action: '用户管理',
      resource: '用户权限',
      details: '修改了trader01的权限设置',
      timestamp: '2024-09-20 14:05:28',
      status: 'warning',
      ip: '192.168.1.100'
    }
  ]);

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterUser, setFilterUser] = useState<string>('all');

  const filteredLogs = logs.filter(log => {
    if (filterStatus !== 'all' && log.status !== filterStatus) return false;
    if (filterUser !== 'all' && log.user !== filterUser) return false;
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'success': return '成功';
      case 'failed': return '失败';
      case 'warning': return '警告';
      default: return '未知';
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes('添加') || action.includes('创建')) return 'text-green-600';
    if (action.includes('删除') || action.includes('移除')) return 'text-red-600';
    if (action.includes('修改') || action.includes('更新')) return 'text-blue-600';
    if (action.includes('执行') || action.includes('交易')) return 'text-purple-600';
    return 'text-gray-600';
  };

  const uniqueUsers = Array.from(new Set(logs.map(log => log.user)));

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">操作日志</h3>
        <p className="text-sm text-gray-600 mt-1">系统操作记录和审计追踪</p>
      </div>

      <div className="flex flex-wrap gap-4 items-center">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            状态筛选
          </label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">全部状态</option>
            <option value="success">成功</option>
            <option value="failed">失败</option>
            <option value="warning">警告</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            用户筛选
          </label>
          <select
            value={filterUser}
            onChange={(e) => setFilterUser(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">全部用户</option>
            {uniqueUsers.map(user => (
              <option key={user} value={user}>{user}</option>
            ))}
          </select>
        </div>
        <div className="flex-1"></div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          导出日志
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h4 className="text-md font-medium text-gray-900">
            操作记录 ({filteredLogs.length} 条)
          </h4>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  时间
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  用户
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  资源
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  IP地址
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.timestamp}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{log.user}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`text-sm font-medium ${getActionColor(log.action)}`}>
                      {log.action}
                    </div>
                    <div className="text-sm text-gray-500 mt-1 max-w-xs truncate">
                      {log.details}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.resource}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(log.status)}`}>
                      {getStatusText(log.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.ip}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">✓</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-900">成功操作</p>
              <p className="text-2xl font-bold text-green-600">
                {logs.filter(log => log.status === 'success').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">✗</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-900">失败操作</p>
              <p className="text-2xl font-bold text-red-600">
                {logs.filter(log => log.status === 'failed').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">⚠</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-yellow-900">警告操作</p>
              <p className="text-2xl font-bold text-yellow-600">
                {logs.filter(log => log.status === 'warning').length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}