/**
 * ステップ2: 理由選択コンポーネント
 *
 * 8つの理由カテゴリーから最大2つまで選択するUI
 * Requirements: 3.2, 3.3, 3.8, 21.1, 21.4
 */

'use client';

import { useMoodRecordStore } from '@/lib/stores/mood-record-store';
import type { ReasonCategory } from '@/lib/types/mood-record';

/**
 * 理由カテゴリーの定義
 */
const REASON_CATEGORIES: Array<{
  id: ReasonCategory;
  label: string;
  emoji: string;
  color: string;
}> = [
  {
    id: 'study_school',
    label: '勉強・学校',
    emoji: '📚',
    color: 'bg-blue-100 hover:bg-blue-200 border-blue-300',
  },
  {
    id: 'relationships',
    label: '人間関係',
    emoji: '👥',
    color: 'bg-purple-100 hover:bg-purple-200 border-purple-300',
  },
  {
    id: 'health',
    label: '体調・健康',
    emoji: '💪',
    color: 'bg-green-100 hover:bg-green-200 border-green-300',
  },
  {
    id: 'hobbies',
    label: '趣味・遊び',
    emoji: '🎮',
    color: 'bg-pink-100 hover:bg-pink-200 border-pink-300',
  },
  {
    id: 'work',
    label: 'バイト・仕事',
    emoji: '💼',
    color: 'bg-orange-100 hover:bg-orange-200 border-orange-300',
  },
  {
    id: 'family',
    label: '家族・家のこと',
    emoji: '🏠',
    color: 'bg-yellow-100 hover:bg-yellow-200 border-yellow-300',
  },
  {
    id: 'sleep',
    label: '睡眠',
    emoji: '😴',
    color: 'bg-indigo-100 hover:bg-indigo-200 border-indigo-300',
  },
  {
    id: 'no_reason',
    label: '特に理由なし',
    emoji: '🤷',
    color: 'bg-gray-100 hover:bg-gray-200 border-gray-300',
  },
];

/**
 * ReasonSelectorStep: 理由選択ステップ
 */
export function ReasonSelectorStep() {
  const { selectedReasons, toggleReason, nextStep } = useMoodRecordStore();

  /**
   * 理由選択ハンドラー
   */
  const handleReasonToggle = (reasonId: ReasonCategory) => {
    toggleReason(reasonId);
  };

  /**
   * 次へボタンハンドラー
   */
  const handleNext = () => {
    nextStep();
  };

  return (
    <main
      className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-screen"
      role="main"
    >
      <div className="w-full max-w-md space-y-6">
        {/* タイトル */}
        <h1 className="text-2xl font-bold text-center text-gray-800 dark:text-gray-100">
          理由は何ですか？
        </h1>

        {/* 選択カウント */}
        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          {selectedReasons.length}/2 選択中
        </p>

        {/* 理由カテゴリー選択ボタン */}
        <div className="grid grid-cols-2 gap-3">
          {REASON_CATEGORIES.map((reason) => {
            const isSelected = selectedReasons.includes(reason.id);

            return (
              <button
                key={reason.id}
                type="button"
                onClick={() => handleReasonToggle(reason.id)}
                aria-label={`理由カテゴリー: ${reason.label}`}
                aria-pressed={isSelected}
                className={`
                  min-h-[60px] px-4 py-3 rounded-lg
                  border-2 transition-all duration-200
                  flex flex-col items-center justify-center gap-1
                  ${reason.color}
                  ${
                    isSelected
                      ? 'ring-4 ring-blue-300 ring-offset-2 scale-105'
                      : ''
                  }
                  focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-offset-2
                `}
              >
                {/* 絵文字 */}
                <span className="text-2xl" aria-hidden="true">
                  {reason.emoji}
                </span>

                {/* ラベル */}
                <span className="text-sm font-medium text-gray-800">
                  {reason.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* 次へボタン */}
        <div className="pt-4">
          <button
            type="button"
            onClick={handleNext}
            disabled={selectedReasons.length === 0}
            aria-label="次へ"
            className={`
              w-full py-4 rounded-lg font-medium text-white
              transition-all duration-200
              ${
                selectedReasons.length > 0
                  ? 'bg-blue-500 hover:bg-blue-600 shadow-md hover:shadow-lg'
                  : 'bg-gray-300 cursor-not-allowed'
              }
              focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-offset-2
            `}
          >
            次へ
          </button>
        </div>

        {/* ステップインジケーター */}
        <div className="flex justify-center space-x-2 pt-4">
          <div
            className="h-2 w-2 rounded-full bg-blue-300"
            aria-label="ステップ1: 気分選択 (完了)"
          />
          <div
            className="h-2 w-2 rounded-full bg-blue-500"
            aria-label="ステップ2: 理由選択 (現在)"
          />
          <div
            className="h-2 w-2 rounded-full bg-gray-300"
            aria-label="ステップ3: 質問回答"
          />
        </div>
      </div>
    </main>
  );
}
