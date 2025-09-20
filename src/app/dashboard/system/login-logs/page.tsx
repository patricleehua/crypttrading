'use client';

import { useState, useEffect } from 'react';

interface LoginLog {
  id: string;
  user: string;
  email: string;
  timestamp: string;
  ip: string;
  userAgent: string;
  location: string;
  status: 'success' | 'failed' | 'blocked';
  reason?: string;
}

export default function LoginLogs() {
  const [logs, setLogs] = useState<LoginLog[]>([]);

  // 从localStorage加载登录日志
  useEffect(() => {
    const savedLogs = localStorage.getItem('loginLogs');
    if (savedLogs) {
      try {
        const parsedLogs = JSON.parse(savedLogs);
        setLogs(parsedLogs);
      } catch (error) {
        console.error('Failed to parse login logs:', error);
        // 如果解析失败，使用默认数据
        setLogs([
          {
            id: '1',
            user: 'admin',
            email: 'admin@trading.com',
            timestamp: '2024-09-20 14:35:22',
            ip: '192.168.1.100',
            userAgent: 'Chrome 118.0.0.0 Windows',
            location: '本地网络',
            status: 'success'
          }
        ]);
      }
    }
  }, []);

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
      case 'blocked': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'success': return '成功';
      case 'failed': return '失败';
      case 'blocked': return '阻止';
      default: return '未知';
    }
  };

  const getRiskLevel = (ip: string, location: string, userAgent: string) => {
    if (ip.startsWith('192.168.') || ip.startsWith('10.')) return 'low';
    if (location.includes('俄罗斯') || location.includes('朝鲜') || userAgent.includes('Python')) return 'high';
    if (!location.includes('中国') && !location.includes('香港')) return 'medium';
    return 'low';
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const uniqueUsers = Array.from(new Set(logs.map(log => log.user)));

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">登录日志</h3>
        <p className="text-sm text-gray-600 mt-1">用户登录记录和安全监控</p>
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
            <option value="blocked">阻止</option>
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
            登录记录 ({filteredLogs.length} 条)
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
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  位置
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  设备信息
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  风险等级
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLogs.map((log) => {
                const riskLevel = getRiskLevel(log.ip, log.location, log.userAgent);
                return (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.timestamp}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{log.user}</div>
                      <div className="text-sm text-gray-500">{log.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(log.status)}`}>
                        {getStatusText(log.status)}
                      </span>
                      {log.reason && (
                        <div className="text-xs text-gray-500 mt-1">{log.reason}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{log.location}</div>
                      <div className="text-sm text-gray-500">{log.ip}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {log.userAgent}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${getRiskColor(riskLevel)}`}>
                        {riskLevel === 'low' && '低风险'}
                        {riskLevel === 'medium' && '中风险'}
                        {riskLevel === 'high' && '高风险'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">✓</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-900">成功登录</p>
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
              <p className="text-sm font-medium text-red-900">失败登录</p>
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
              <p className="text-sm font-medium text-yellow-900">阻止尝试</p>
              <p className="text-2xl font-bold text-yellow-600">
                {logs.filter(log => log.status === 'blocked').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">👥</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-900">活跃用户</p>
              <p className="text-2xl font-bold text-blue-600">
                {new Set(logs.filter(log => log.status === 'success').map(log => log.user)).size}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-red-900 mb-2">🔒 安全提醒</h4>
        <ul className="text-sm text-red-800 space-y-1">
          <li>• 定期检查异常登录记录，特别注意非常用地理位置的登录</li>
          <li>• 对于多次失败的登录尝试，建议临时封禁IP地址</li>
          <li>• 建议启用二次验证（2FA）提高账户安全性</li>
          <li>• 监控使用自动化工具（如Python脚本）的登录尝试</li>
        </ul>
      </div>
    </div>
  );
}