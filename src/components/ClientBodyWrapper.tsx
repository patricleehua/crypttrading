'use client';

import { useEffect } from 'react';

export default function ClientBodyWrapper({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // 清理可能由浏览器扩展添加的属性
    const body = document.body;
    if (body.hasAttribute('inmaintabuse')) {
      body.removeAttribute('inmaintabuse');
    }

    // 清理其他可能的扩展属性
    const extensionAttributes = ['inmaintabuse', 'tabindex', 'role'];
    extensionAttributes.forEach(attr => {
      if (body.hasAttribute(attr) && !body.getAttribute(attr)?.startsWith('geist')) {
        // 只移除非预期的属性
        if (attr === 'inmaintabuse') {
          body.removeAttribute(attr);
        }
      }
    });
  }, []);

  return <>{children}</>;
}