'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
  requiredRole?: string;
  requiredAnyRole?: string[];
}

export default function ProtectedRoute({ children, requiredPermission, requiredRole, requiredAnyRole }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading, hasPermission, hasRole, hasAnyRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only redirect after hydration to prevent SSR/client mismatch
    if (typeof window !== 'undefined') {
      if (!isLoading && !isAuthenticated) {
        router.push('/login');
        return;
      }

      if (user && !checkAccess()) {
        router.push('/dashboard'); // 重定向到仪表盘
        return;
      }
    }
  }, [isAuthenticated, isLoading, user, requiredPermission, requiredRole, requiredAnyRole, router]);

  // 权限检查函数
  const checkAccess = (): boolean => {
    if (!user) return false;

    // 检查特定权限
    if (requiredPermission && !hasPermission(requiredPermission)) {
      return false;
    }

    // 检查特定角色
    if (requiredRole && !hasRole(requiredRole)) {
      return false;
    }

    // 检查是否拥有任一角色
    if (requiredAnyRole && !hasAnyRole(requiredAnyRole)) {
      return false;
    }

    return true;
  };

  // 显示加载状态
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  // 如果未认证，显示空内容（将被重定向）
  if (!isAuthenticated) {
    return null;
  }

  // 如果权限不足，显示权限提示
  if (user && !checkAccess()) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">权限不足</h2>
          <p className="text-gray-600 mb-4">您没有访问此页面的权限</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            返回仪表盘
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}