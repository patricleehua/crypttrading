'use client';

import { createContext, useContext, useEffect, useState } from 'react';

interface Role {
  id: number;
  name: string;
  displayName: string;
  description?: string;
}

interface User {
  id: string;
  username: string;
  email: string;
  roles: Role[]; // RBAC角色数组
  permissions: string[]; // 用户权限数组
  loginTime: string;
  isActive?: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasPermission: (permission: string) => boolean;
  hasRole: (roleName: string) => boolean;
  hasAnyRole: (roleNames: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Mark as hydrated to prevent SSR/client mismatch
    setIsHydrated(true);

    // 检查本地存储的用户信息
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('currentUser');
      if (savedUser) {
        try {
          const userData = JSON.parse(savedUser);
          setUser(userData);
        } catch (error) {
          console.error('Failed to parse user data:', error);
          localStorage.removeItem('currentUser');
        }
      }
    }
    setIsLoading(false);
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    if (typeof window !== 'undefined') {
      localStorage.setItem('currentUser', JSON.stringify(userData));
    }
  };

  const logout = () => {
    setUser(null);

    if (typeof window !== 'undefined') {
      localStorage.removeItem('currentUser');

      // 记录登出日志
      const logoutLog = {
        id: Date.now().toString(),
        user: user?.username || 'unknown',
        email: user?.email || '',
        timestamp: new Date().toLocaleString('zh-CN'),
        ip: '192.168.1.100',
        userAgent: navigator.userAgent,
        location: '本地网络',
        status: 'success' as const,
        action: '用户登出'
      };

      const existingLogs = JSON.parse(localStorage.getItem('loginLogs') || '[]');
      localStorage.setItem('loginLogs', JSON.stringify([logoutLog, ...existingLogs]));
    }
  };

  // RBAC权限检查函数（支持通配符）
  const hasPermission = (permission: string): boolean => {
    if (!user?.permissions) return false;

    return user.permissions.some(userPermission =>
      matchPermission(userPermission, permission)
    );
  };

  // 权限匹配函数（支持通配符）
  const matchPermission = (userPermission: string, requiredPermission: string): boolean => {
    // 如果用户有超级权限 *:* 或 *
    if (userPermission === '*:*' || userPermission === '*') {
      return true;
    }

    // 精确匹配
    if (userPermission === requiredPermission) {
      return true;
    }

    // 通配符匹配
    if (userPermission.includes('*')) {
      // 将通配符模式转换为正则表达式
      const pattern = userPermission
        .replace(/\./g, '\\.')  // 转义点号
        .replace(/\*/g, '.*');  // 将*替换为.*

      const regex = new RegExp(`^${pattern}$`);
      return regex.test(requiredPermission);
    }

    return false;
  };

  const hasRole = (roleName: string): boolean => {
    return user?.roles?.some(role => role.name === roleName) ?? false;
  };

  const hasAnyRole = (roleNames: string[]): boolean => {
    return user?.roles?.some(role => roleNames.includes(role.name)) ?? false;
  };

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    isLoading,
    hasPermission,
    hasRole,
    hasAnyRole
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}