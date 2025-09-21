'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';

const tabs = [
  { id: 'overview', name: '仪表板', href: '/dashboard' },
  { id: 'subscriptions', name: 'RSS订阅', href: '/dashboard/subscriptions' },
  { id: 'content', name: '内容推送', href: '/dashboard/content' },
  { id: 'system', name: '系统管理', href: '/dashboard/system' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const getUserRoleText = () => {
    if (!user?.roles || user.roles.length === 0) return '用户';

    // 显示主要角色或所有角色
    if (user.roles.length === 1) {
      return user.roles[0].displayName;
    } else {
      return user.roles.map(role => role.displayName).join(', ');
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <h1 className="text-2xl font-bold text-gray-900">RSS采集系统</h1>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-500">
                  <span className="font-medium">{user?.username}</span>
                  <span className="ml-2 px-2 py-1 bg-gray-100 rounded-full text-xs">
                    {getUserRoleText()}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-sm text-red-600 hover:text-red-800 transition-colors"
                >
                  退出登录
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8 px-6">
                {tabs.map((tab) => {
                  const isActive = pathname === tab.href ||
                    (tab.href !== '/dashboard' && pathname.startsWith(tab.href));

                  return (
                    <Link
                      key={tab.id}
                      href={tab.href}
                      className={`${
                        isActive
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                    >
                      {tab.name}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="p-6">
              {children}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}