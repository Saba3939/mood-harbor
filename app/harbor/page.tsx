/**
 * Harbor Page
 * ハーバー（タイムライン）ページ
 *
 * 要件:
 * - 3つのタブ（励まし募集、喜びシェア、頑張った報告）を表示
 * - 投稿カードに必要な情報を全て表示
 * - プルダウンで最新投稿読み込み
 * - リアルタイム更新
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { getHarborFeed } from '@/lib/actions/harbor';
import type { ShareType } from '@/lib/types/share';
import type { TimeOfDay } from '@/lib/types/mood-record';
import type { HarborPost } from '@/lib/types/harbor';
import { createClient } from '@/lib/supabase/client';
import { HarborService } from '@/lib/services/harbor';
import { filterValidHarborPosts, isShareExpired } from '@/lib/utils/share-expiry';
import PostCard from './components/PostCard';
import FilterModal from './components/FilterModal';

// タブ定義
const TABS: Array<{ label: string; shareType: ShareType }> = [
  { label: '💙 励まし募集', shareType: 'support_needed' },
  { label: '💛 喜びシェア', shareType: 'joy_share' },
  { label: '💚 頑張った報告', shareType: 'achievement' },
];

export default function HarborPage() {
  const [activeTab, setActiveTab] = useState<ShareType>('support_needed');
  const [posts, setPosts] = useState<HarborPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newPostsCount, setNewPostsCount] = useState(0);
  const [timeOfDayFilter, setTimeOfDayFilter] = useState<TimeOfDay | null>(null);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // 投稿を取得
  const loadPosts = useCallback(async (shareType: ShareType, timeFilter: TimeOfDay | null = null) => {
    setIsLoading(true);
    setError(null);

    const result = await getHarborFeed({
      share_type: shareType,
      time_of_day: timeFilter ?? undefined,
      sort_by: 'newest',
      limit: 20,
      offset: 0,
    });

    if (result.success) {
      // 期限切れの投稿をフィルタリング
      setPosts(filterValidHarborPosts(result.value));
    } else {
      setError('投稿の読み込みに失敗しました');
    }

    setIsLoading(false);
  }, []);

  // 初回読み込み
  useEffect(() => {
    loadPosts(activeTab, timeOfDayFilter);
  }, [activeTab, timeOfDayFilter, loadPosts]);

  // Realtime購読
  useEffect(() => {
    const supabase = createClient();
    const harborService = new HarborService(supabase);

    const unsubscribe = harborService.subscribeToFeed(activeTab, (newPost) => {
      // 期限切れでない場合のみ追加
      if (!isShareExpired(newPost.share.expires_at)) {
        setPosts((prevPosts) => [newPost, ...prevPosts]);
        setNewPostsCount((prev) => prev + 1);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [activeTab]);

  // 定期的に期限切れ投稿を非表示にする（1分ごと）
  useEffect(() => {
    const interval = setInterval(() => {
      setPosts((prevPosts) => filterValidHarborPosts(prevPosts));
    }, 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // プルダウン更新
  const handleRefresh = useCallback(async () => {
    await loadPosts(activeTab, timeOfDayFilter);
    setNewPostsCount(0);
  }, [activeTab, timeOfDayFilter, loadPosts]);

  // タブ切り替え
  const handleTabChange = (shareType: ShareType) => {
    setActiveTab(shareType);
    setNewPostsCount(0);
  };

  // フィルター適用
  const handleFilterApply = (timeOfDay: TimeOfDay | null) => {
    setTimeOfDayFilter(timeOfDay);
    setNewPostsCount(0);
  };

  // 応援ボタンクリック（TODO: 応援機能実装時に実装）
  const handleReactionClick = (shareId: string) => {
    console.log('応援クリック:', shareId);
    // TODO: 応援機能実装
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">ハーバー</h1>
          <button
            onClick={() => setIsFilterModalOpen(true)}
            className="flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            aria-label="フィルター"
          >
            <span className="text-sm font-medium text-gray-700">
              {timeOfDayFilter ? (
                <>
                  {timeOfDayFilter === 'morning' && '朝'}
                  {timeOfDayFilter === 'afternoon' && '昼'}
                  {timeOfDayFilter === 'evening' && '夕'}
                  {timeOfDayFilter === 'night' && '夜'}
                </>
              ) : (
                'フィルター'
              )}
            </span>
            <svg
              className="w-4 h-4 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
          </button>
        </div>
      </header>

      {/* フィルターモーダル */}
      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onApply={handleFilterApply}
        currentFilter={timeOfDayFilter}
      />

      {/* タブ */}
      <div className="bg-white border-b sticky top-[60px] z-10">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex space-x-4" role="tablist">
            {TABS.map((tab) => (
              <button
                key={tab.shareType}
                role="tab"
                aria-selected={activeTab === tab.shareType}
                onClick={() => handleTabChange(tab.shareType)}
                className={`py-3 px-4 font-medium transition-colors ${
                  activeTab === tab.shareType
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 新着通知 */}
      {newPostsCount > 0 && (
        <div className="max-w-2xl mx-auto px-4 py-2">
          <button
            onClick={handleRefresh}
            className="w-full py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
          >
            新着{newPostsCount}件
          </button>
        </div>
      )}

      {/* 投稿リスト */}
      <div
        data-testid="harbor-scroll-container"
        className="max-w-2xl mx-auto px-4 py-4 space-y-4"
      >
        {/* ローディング状態 */}
        {isLoading && posts.length === 0 && (
          <div className="text-center py-8 text-gray-500">読み込み中...</div>
        )}

        {/* エラー状態 */}
        {error && (
          <div className="text-center py-8 text-red-600">{error}</div>
        )}

        {/* 空状態 */}
        {!isLoading && !error && posts.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg mb-2">まだ投稿がありません</p>
            <p className="text-sm">最初の投稿をしてみませんか？</p>
          </div>
        )}

        {/* 投稿カード */}
        {posts.map((post) => (
          <PostCard
            key={post.share.id}
            post={post}
            onReactionClick={handleReactionClick}
          />
        ))}
      </div>
    </div>
  );
}
