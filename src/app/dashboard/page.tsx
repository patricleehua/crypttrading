export default function DashboardOverview() {
  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-xl font-semibold text-gray-900">仪表盘概览</h2>
        <p className="text-sm text-gray-600 mt-1">量化交易系统运行状态监控</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">RSS</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-blue-900">活跃数据源</p>
              <p className="text-2xl font-bold text-blue-600">5</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 p-6 rounded-lg border border-green-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">$</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-green-900">今日交易</p>
              <p className="text-2xl font-bold text-green-600">12</p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">AI</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-yellow-900">AI分析</p>
              <p className="text-2xl font-bold text-yellow-600">运行中</p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">P</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-purple-900">总盈亏</p>
              <p className="text-2xl font-bold text-purple-600">+8.5%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">最近数据采集</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div>
                <p className="text-sm font-medium text-gray-900">@crypto_whale</p>
                <p className="text-xs text-gray-500">2分钟前</p>
              </div>
              <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">已处理</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div>
                <p className="text-sm font-medium text-gray-900">@trading_guru</p>
                <p className="text-xs text-gray-500">5分钟前</p>
              </div>
              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">分析中</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-gray-900">@market_news</p>
                <p className="text-xs text-gray-500">8分钟前</p>
              </div>
              <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">已处理</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">最近交易记录</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div>
                <p className="text-sm font-medium text-gray-900">BTC/USDT 买入</p>
                <p className="text-xs text-gray-500">1小时前</p>
              </div>
              <span className="text-sm font-medium text-green-600">+2.3%</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div>
                <p className="text-sm font-medium text-gray-900">ETH/USDT 卖出</p>
                <p className="text-xs text-gray-500">2小时前</p>
              </div>
              <span className="text-sm font-medium text-red-600">-0.8%</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-gray-900">SOL/USDT 买入</p>
                <p className="text-xs text-gray-500">3小时前</p>
              </div>
              <span className="text-sm font-medium text-green-600">+5.2%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">系统状态</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-700">数据采集服务</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-700">AI分析模型</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-700">交易执行引擎</span>
          </div>
        </div>
      </div>
    </div>
  );
}