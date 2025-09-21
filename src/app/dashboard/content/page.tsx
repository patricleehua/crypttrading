'use client';

import { useState, useEffect } from 'react';
import NoSSR from '@/components/NoSSR';

interface Post {
  post: {
    id: number;
    title?: string;
    content?: string;
    externalId: string;
    sourceType: string;
    contentType: string;
    authorName?: string;
    authorUsername?: string;
    authorAvatar?: string;
    publishedAt: string;
    createdAt: string;
    linkUrl?: string;
    mediaUrls?: string[];
    hashtags?: string[];
  };
  subscription?: {
    id: number;
    name: string;
    type: string;
  };
}

export default function ContentPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalCount: 0,
    totalPages: 0
  });

  const [search, setSearch] = useState('');
  const [sourceTypeFilter, setSourceTypeFilter] = useState('');

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
        ...(sourceTypeFilter && { sourceType: sourceTypeFilter })
      });

      const response = await fetch(`/api/posts?${params}`);
      const data = await response.json();

      if (data.success) {
        console.log('API返回的数据:', data.data);
        console.log('数据长度:', data.data?.length);
        setPosts(data.data);
        setPagination(data.pagination);
        setError(null);
      } else {
        setError(data.error || '获取文章列表失败');
      }
    } catch (err) {
      setError('网络错误');
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [pagination.page, search, sourceTypeFilter]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateText = (text: string, maxLength: number = 200) => {
    if (!text || text === '…' || text.trim() === '') return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const stripHtml = (html: string) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').trim();
  };

  const safeDisplay = (value: string | null | undefined, fallback: string = '') => {
    if (!value || value === '…' || value.trim() === '') return fallback;
    return value;
  };

  // 头像组件
  const Avatar = ({ post }: { post: any }) => {
    const [imageError, setImageError] = useState(false);

    // 当post.authorAvatar变化时重置错误状态
    useEffect(() => {
      setImageError(false);
    }, [post.authorAvatar]);

    const getInitials = (name: string) => {
      if (!name || name.trim() === '') return 'U';

      // 如果是用户名格式 @username，取第一个字符
      if (name.startsWith('@')) {
        return name.slice(1).charAt(0).toUpperCase();
      }

      // 如果是多个单词，取每个单词的首字母
      const words = name.trim().split(/\s+/);
      if (words.length > 1) {
        return words.slice(0, 2).map(word => word.charAt(0).toUpperCase()).join('');
      }

      // 单个单词取首字母
      return name.charAt(0).toUpperCase();
    };

    // 获取头像URL，处理多种格式
    const getAvatarUrl = (authorAvatar: any): string | null => {
      if (!authorAvatar) return null;

      // 如果是数组类型，取第一个有效URL
      if (Array.isArray(authorAvatar)) {
        for (const item of authorAvatar) {
          if (typeof item === 'string' && item.startsWith('http')) {
            return item;
          }
        }
        return null;
      }

      // 如果是字符串类型
      if (typeof authorAvatar === 'string') {
        // 处理JSON数组字符串格式
        if (authorAvatar.startsWith('[') && authorAvatar.endsWith(']')) {
          try {
            const parsed = JSON.parse(authorAvatar);
            if (Array.isArray(parsed) && parsed.length > 0) {
              const firstUrl = parsed[0];
              if (typeof firstUrl === 'string' && firstUrl.startsWith('http')) {
                return firstUrl;
              }
            }
          } catch (e) {
            // JSON解析失败，继续处理为普通字符串
          }
        }

        // 处理JSON对象字符串格式或特殊的URL包装格式
        if (authorAvatar.startsWith('{') && authorAvatar.endsWith('}')) {
          // 先尝试提取花括号内的URL（处理 {"url"} 这种格式）
          const urlMatch = authorAvatar.match(/\{"([^"]+)"\}/);
          if (urlMatch && urlMatch[1] && urlMatch[1].startsWith('http')) {
            const decodedUrl = decodeURIComponent(urlMatch[1]);
            return decodedUrl;
          }

          try {
            const parsed = JSON.parse(authorAvatar);
            // 尝试从解析的对象中提取URL
            if (typeof parsed === 'string' && parsed.startsWith('http')) {
              return parsed;
            }
            // 如果是对象，尝试常见的字段名
            if (typeof parsed === 'object' && parsed !== null) {
              for (const key of ['url', 'src', 'href', 'avatar', 'image']) {
                if (parsed[key] && typeof parsed[key] === 'string' && parsed[key].startsWith('http')) {
                  return parsed[key];
                }
              }
            }
          } catch (e) {
            // JSON解析失败，尝试正则表达式提取URL
            const httpMatch = authorAvatar.match(/https?:\/\/[^\s"}]+/);
            if (httpMatch && httpMatch[0]) {
              return httpMatch[0];
            }
          }
        }

        // 处理普通URL字符串
        if (authorAvatar.startsWith('http')) {
          return authorAvatar;
        }

        // 处理相对路径或其他格式
        if (authorAvatar.startsWith('/')) {
          // 如果是相对路径，尝试构建完整URL
          return `https:${authorAvatar}`;
        }
      }

      // 如果是对象类型，尝试提取URL
      if (typeof authorAvatar === 'object' && authorAvatar !== null) {
        for (const key of ['url', 'src', 'href', 'avatar', 'image']) {
          if (authorAvatar[key] && typeof authorAvatar[key] === 'string' && authorAvatar[key].startsWith('http')) {
            return authorAvatar[key];
          }
        }
      }

      return null;
    };

    const getBackgroundColor = (name: string) => {
      // 根据名字生成不同的渐变色
      const colors = [
        'from-blue-400 to-blue-600',
        'from-green-400 to-green-600',
        'from-purple-400 to-purple-600',
        'from-pink-400 to-pink-600',
        'from-yellow-400 to-yellow-600',
        'from-red-400 to-red-600',
        'from-indigo-400 to-indigo-600',
        'from-teal-400 to-teal-600'
      ];

      let hash = 0;
      for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
      }

      return colors[Math.abs(hash) % colors.length];
    };

    const authorName = safeDisplay(post.authorName, post.authorUsername || 'Unknown');
    const initials = getInitials(authorName);
    const bgColor = getBackgroundColor(authorName);
    const avatarUrl = getAvatarUrl(post.authorAvatar);


    return (
      <div className={`w-10 h-10 rounded-full flex items-center justify-center overflow-hidden bg-gradient-to-br ${bgColor} flex-shrink-0`}>
        {avatarUrl && !imageError ? (
          <img
            src={avatarUrl}
            alt={`${authorName}的头像`}
            className="w-full h-full object-cover"
            onError={(e) => {
              // 尝试提取原始Twitter URL作为备用
              const twitterUrlMatch = avatarUrl.match(/pbs\.twimg\.com.*\/([^/]+)$/);
              if (twitterUrlMatch && !avatarUrl.includes('https://pbs.twimg.com')) {
                const fallbackUrl = `https://pbs.twimg.com/${avatarUrl.split('pbs.twimg.com')[1]}`;
                (e.target as HTMLImageElement).src = fallbackUrl;
                return;
              }

              setImageError(true);
            }}
            onLoad={() => {
              // 头像加载成功
            }}
          />
        ) : (
          <span className="text-white font-semibold text-sm select-none">
            {initials}
          </span>
        )}
      </div>
    );
  };

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentSlides, setCurrentSlides] = useState<{[key: string]: number}>({});

  // 媒体轮播组件
  const MediaCarousel = ({ mediaUrls, postId }: { mediaUrls: string[], postId: number }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);

    const images = mediaUrls.filter(url => /\.(jpg|jpeg|png|gif|webp)$/i.test(url));
    const videos = mediaUrls.filter(url => /\.(mp4|webm|mov)$/i.test(url));
    const allMedia = [...images, ...videos];

    // 自动播放逻辑
    useEffect(() => {
      if (!isAutoPlaying || allMedia.length <= 1) return;

      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % allMedia.length);
      }, 3000);

      return () => clearInterval(interval);
    }, [isAutoPlaying, allMedia.length]);

    if (allMedia.length === 0) return null;

    const nextSlide = () => {
      setCurrentIndex((prev) => (prev + 1) % allMedia.length);
      setIsAutoPlaying(false);
    };

    const prevSlide = () => {
      setCurrentIndex((prev) => (prev - 1 + allMedia.length) % allMedia.length);
      setIsAutoPlaying(false);
    };

    const goToSlide = (index: number) => {
      setCurrentIndex(index);
      setIsAutoPlaying(false);
    };

    const isVideo = (url: string) => /\.(mp4|webm|mov)$/i.test(url);

    return (
      <div className="relative rounded-2xl overflow-hidden border border-gray-200 bg-black">
        {/* 主要内容区 */}
        <div className="relative w-full h-80 overflow-hidden">
          <div
            className="flex transition-transform duration-500 ease-in-out h-full"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {allMedia.map((url, index) => (
              <div key={index} className="w-full h-full flex-shrink-0 flex items-center justify-center">
                {isVideo(url) ? (
                  <video
                    src={url}
                    className="w-full h-full object-cover"
                    controls
                    preload="metadata"
                    onClick={() => setIsAutoPlaying(false)}
                  />
                ) : (
                  <img
                    src={url}
                    alt={`媒体 ${index + 1}`}
                    className="w-full h-full object-cover cursor-pointer"
                    loading="lazy"
                    onClick={() => setSelectedImage(url)}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 控制按钮 */}
        {allMedia.length > 1 && (
          <>
            {/* 左右切换按钮 */}
            <button
              onClick={prevSlide}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black bg-opacity-50 text-white rounded-full flex items-center justify-center hover:bg-opacity-75 transition-all"
            >
              ‹
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black bg-opacity-50 text-white rounded-full flex items-center justify-center hover:bg-opacity-75 transition-all"
            >
              ›
            </button>

            {/* 指示器 */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex space-x-2">
              {allMedia.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentIndex
                      ? 'bg-white'
                      : 'bg-white bg-opacity-50 hover:bg-opacity-75'
                  }`}
                />
              ))}
            </div>

            {/* 自动播放控制 */}
            <button
              onClick={() => setIsAutoPlaying(!isAutoPlaying)}
              className="absolute top-3 right-3 w-8 h-8 bg-black bg-opacity-50 text-white rounded-full flex items-center justify-center hover:bg-opacity-75 transition-all text-xs"
              title={isAutoPlaying ? '暂停自动播放' : '开始自动播放'}
            >
              {isAutoPlaying ? '⏸' : '▶'}
            </button>

            {/* 媒体类型指示器 */}
            <div className="absolute top-3 left-3 px-2 py-1 bg-black bg-opacity-50 text-white text-xs rounded">
              {currentIndex + 1} / {allMedia.length}
              {isVideo(allMedia[currentIndex]) && ' 🎥'}
            </div>
          </>
        )}
      </div>
    );
  };

  const renderMediaUrls = (mediaUrls: string[], postId: number) => {
    if (!mediaUrls || mediaUrls.length === 0) return null;

    const images = mediaUrls.filter(url => /\.(jpg|jpeg|png|gif|webp)$/i.test(url));
    const videos = mediaUrls.filter(url => /\.(mp4|webm|mov)$/i.test(url));
    const others = mediaUrls.filter(url =>
      !(/\.(jpg|jpeg|png|gif|webp|mp4|webm|mov)$/i.test(url))
    );

    // 如果有图片或视频，使用轮播组件
    const hasMediaContent = images.length > 0 || videos.length > 0;

    return (
      <div className="mb-4 space-y-3">
        {/* 媒体轮播 */}
        {hasMediaContent && (
          <MediaCarousel mediaUrls={[...images, ...videos]} postId={postId} />
        )}

        {/* 其他文件 */}
        {others.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {others.map((url, index) => (
              <a
                key={index}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-2 bg-gray-100 border rounded-lg hover:bg-gray-200 transition-colors text-sm"
              >
                📎 附件 {index + 1}
              </a>
            ))}
          </div>
        )}

        {/* 图片预览模态框 */}
        {selectedImage && (
          <div
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedImage(null)}
          >
            <div className="relative max-w-4xl max-h-full">
              <img
                src={selectedImage}
                alt="预览"
                className="max-w-full max-h-full object-contain rounded-lg"
                onClick={(e) => e.stopPropagation()}
              />
              <button
                className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full w-8 h-8 flex items-center justify-center hover:bg-opacity-75 transition-colors"
                onClick={() => setSelectedImage(null)}
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading && posts.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">加载内容中...</div>
      </div>
    );
  }

  return (
    <NoSSR fallback={
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">加载内容中...</div>
      </div>
    }>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">内容流</h1>
          <p className="text-gray-600">浏览和管理从订阅源采集的内容</p>
        </div>

      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          type="text"
          placeholder="搜索内容..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <select
          value={sourceTypeFilter}
          onChange={(e) => setSourceTypeFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">所有来源</option>
          <option value="twitter">Twitter</option>
          <option value="reddit">Reddit</option>
          <option value="rss">RSS</option>
        </select>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}

      {/* 响应式两列布局 */}
      <div className="columns-1 md:columns-2 xl:columns-2 gap-6 space-y-0">
        {posts.map(({ post, subscription }) => {
          if (!post) return null;
          return (
            <article key={post.id} className="break-inside-avoid mb-6 bg-white rounded-2xl border border-gray-200 hover:shadow-lg transition-all duration-200 overflow-hidden">
              <div className="p-4">
                {/* 头部 - X.com 风格 */}
                <div className="flex items-start space-x-3 mb-3">
                  {/* 头像区域 */}
                  <Avatar post={post} />

                  {/* 作者信息 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          // 生成作者链接
                          let authorUrl = '';
                          if (post.sourceType === 'twitter' && post.authorUsername) {
                            const username = post.authorUsername.replace('@', '');
                            // 优先使用原始链接域名
                            if (post.linkUrl?.includes('dockerproxy.shumei.eu.org')) {
                              authorUrl = `http://dockerproxy.shumei.eu.org/${username}`;
                            } else {
                              authorUrl = `https://x.com/${username}`;
                            }
                          } else if (post.rssSource) {
                            // 从RSS源推断作者页面
                            const baseUrl = post.rssSource.replace(/\/[^\/]*$/, '');
                            authorUrl = baseUrl;
                          }

                          if (authorUrl) {
                            window.open(authorUrl, '_blank', 'noopener,noreferrer');
                          }
                        }}
                        className="font-bold text-gray-900 truncate hover:text-blue-600 transition-colors cursor-pointer"
                      >
                        {safeDisplay(post.authorName, post.authorUsername || '未知作者')}
                      </button>
                      {post.authorUsername && (
                        <span className="text-sm text-gray-500 truncate">
                          @{post.authorUsername.replace('@', '')}
                        </span>
                      )}
                      <span className="text-gray-400">·</span>
                      <span className="text-sm text-gray-500 whitespace-nowrap">
                        {formatDate(post.publishedAt).split(' ')[0]}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 内容区域 */}
                <div className="space-y-3">
                  {/* 文本内容 */}
                  <div className="text-gray-900 leading-relaxed">
                    {/* 标题 */}
                    {safeDisplay(post.title) && post.title !== '…' && (
                      <div className="font-semibold text-lg mb-2">
                        {post.title}
                      </div>
                    )}

                    {/* 正文 */}
                    {safeDisplay(post.content) && post.content !== '…' && (
                      <div
                        className="prose prose-sm max-w-none text-gray-800 [&_a]:text-blue-500 [&_a]:no-underline hover:[&_a]:underline"
                        dangerouslySetInnerHTML={{
                          __html: truncateText(post.content, 280)
                        }}
                      />
                    )}
                  </div>

                  {/* 媒体内容 */}
                  {renderMediaUrls(post.mediaUrls, post.id)}

                  {/* 标签 */}
                  {post.hashtags && post.hashtags.length > 0 && (() => {
                    const validTags = post.hashtags.filter((tag: string) =>
                      tag && tag.trim() !== '' && tag !== 'm' && tag.length > 1
                    );
                    return validTags.length > 0 && (
                      <div className="flex flex-wrap gap-1 text-blue-500">
                        {validTags.slice(0, 6).map((tag: string, index: number) => (
                          <span key={index} className="hover:underline cursor-pointer">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    );
                  })()}
                </div>

                {/* 互动区域 */}
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    {/* 左侧信息 */}
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>{formatDate(post.publishedAt).split(' ')[1]}</span>
                      {subscription && (
                        <span className="flex items-center space-x-1">
                          <span>📡</span>
                          <span>{subscription.name}</span>
                        </span>
                      )}
                    </div>

                    {/* 右侧操作 */}
                    <div className="flex items-center space-x-2">
                      {post.linkUrl && (
                        <a
                          href={post.linkUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-all"
                          title="查看原文"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      )}
                      {post.rssSource && (
                        <a
                          href={post.rssSource}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-full transition-all"
                          title="RSS源"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M3.429 2.571c9.905 0 17.143 7.238 17.143 17.143h-3.428c0-7.619-6.095-13.714-13.715-13.714v-3.429zM3.429 9.143c3.810 0 6.857 3.048 6.857 6.857h-3.429c0-1.905-1.524-3.429-3.428-3.429v-3.428zM6.857 16.571c0 1.905-1.524 3.429-3.428 3.429s-3.429-1.524-3.429-3.429 1.524-3.428 3.429-3.428 3.428 1.523 3.428 3.428z"/>
                          </svg>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {posts.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-500">
          <div className="text-6xl mb-4">📰</div>
          <h3 className="text-lg font-medium mb-2">暂无内容</h3>
          <p>尝试调整筛选条件或添加一些订阅源来查看内容。</p>
          <div className="mt-4 text-sm text-gray-400">
            <p>当前状态: 加载完成，无数据</p>
            <p>搜索条件: {search || '无'}</p>
            <p>来源类型: {sourceTypeFilter || '全部'}</p>
          </div>
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="mt-8 flex justify-between items-center">
          <div className="text-sm text-gray-700">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of{' '}
            {pagination.totalCount} results
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={!pagination.hasPrev}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
            >
              Previous
            </button>
            <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg">
              {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={!pagination.hasNext}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
      </div>
    </NoSSR>
  );
}