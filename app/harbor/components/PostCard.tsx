/**
 * PostCard Component
 * ハーバーの投稿カードコンポーネント
 */

'use client';

import type { HarborPost } from '@/lib/types/harbor';

interface PostCardProps {
  post: HarborPost;
  onReactionClick?: (shareId: string) => void;
}

// 投稿時刻の相対表示
function getRelativeTime(createdAt: string): string {
  const now = new Date();
  const created = new Date(createdAt);
  const diffInMinutes = Math.floor((now.getTime() - created.getTime()) / (1000 * 60));

  if (diffInMinutes < 1) return 'たった今';
  if (diffInMinutes < 60) return `${diffInMinutes}分前`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}時間前`;

  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}日前`;
}

export default function PostCard({ post, onReactionClick }: PostCardProps) {
  return (
    <article
      role="article"
      className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
    >
      {/* ユーザー情報 */}
      <div className="flex items-center mb-3">
        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-2xl mr-3">
          {/* TODO: アバター画像に置き換え */}
          🐱
        </div>
        <div className="flex-1">
          <p className="font-medium text-gray-900">{post.user.nickname}</p>
          <p className="text-sm text-gray-500">
            {getRelativeTime(post.share.created_at)}
          </p>
        </div>
      </div>

      {/* 気持ち */}
      <div className="mb-2">
        <span className="inline-block bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
          {post.share.feeling}
        </span>
      </div>

      {/* 一言メッセージ */}
      {post.share.message && (
        <p className="text-gray-800 mb-3">{post.share.message}</p>
      )}

      {/* 応援ボタン */}
      <div className="flex items-center justify-between pt-3 border-t">
        <div className="flex items-center text-gray-600">
          <span className="mr-1">💙</span>
          <span className="text-sm">{post.reactions.count}</span>
        </div>
        <button
          aria-label="応援する"
          onClick={() => onReactionClick?.(post.share.id)}
          className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={post.reactions.user_reacted}
        >
          {post.reactions.user_reacted ? '応援済み' : '応援する'}
        </button>
      </div>
    </article>
  );
}
