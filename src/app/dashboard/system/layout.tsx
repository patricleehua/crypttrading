'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';

const systemTabs = [
  { id: 'users', name: '用户管理', href: '/dashboard/system/users' },
  { id: 'operation-logs', name: '操作日志', href: '/dashboard/system/operation-logs' },
  { id: 'login-logs', name: '登录日志', href: '/dashboard/system/login-logs' },
];

export default function SystemLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="space-y-6">
        <div className="border-b border-gray-200 pb-4">
          <h2 className="text-xl font-semibold text-gray-900">系统管理</h2>
          <p className="text-sm text-gray-600 mt-1">用户权限、日志管理和系统监控（仅管理员可访问）</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {systemTabs.map((tab) => {
                const isActive = pathname === tab.href;

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
    </ProtectedRoute>
  );
}