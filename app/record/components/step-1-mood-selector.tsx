/**
 * ステップ1: 気分選択コンポーネント
 *
 * 5段階の気分レベルを選択するUI
 * Requirements: 3.1, 3.2, 3.7, 21.1, 21.2, 21.4, 21.5
 */

'use client';

import { useMoodRecordStore } from '@/lib/stores/mood-record-store';
import type { MoodLevel } from '@/lib/types/mood-record';

/**
 * 気分レベルの定義
 */
const MOOD_LEVELS: Array<{
  level: MoodLevel;
  label: string;
  emoji: string;
  color: string;
}> = [
  {
    level: 5,
    label: 'とても良い',
    emoji: '😊',
    color: 'bg-green-500 hover:bg-green-600 text-white',
  },
  {
    level: 4,
    label: '良い',
    emoji: '🙂',
    color: 'bg-blue-400 hover:bg-blue-500 text-white',
  },
  {
    level: 3,
    label: '普通',
    emoji: '😐',
    color: 'bg-gray-400 hover:bg-gray-500 text-white',
  },
  {
    level: 2,
    label: '少し疲れた',
    emoji: '😔',
    color: 'bg-orange-400 hover:bg-orange-500 text-white',
  },
  {
    level: 1,
    label: 'とても疲れた',
    emoji: '😢',
    color: 'bg-red-500 hover:bg-red-600 text-white',
  },
];

/**
 * MoodSelectorStep: 気分選択ステップ
 */
export function MoodSelectorStep() {
  const { moodLevel, error, setMoodLevel, nextStep } = useMoodRecordStore();

  /**
   * 気分選択時のハンドラー
   * 選択後、自動的に次のステップへ遷移
   */
  const handleMoodSelect = (level: MoodLevel) => {
    setMoodLevel(level);

    // アニメーション後に次のステップへ遷移
    setTimeout(() => {
      nextStep();
    }, 300);
  };

  return (
    <main
      className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-screen"
      role="main"
    >
      {/* ステップ1: 気分選択 */}
      <div className="w-full max-w-md space-y-6">
        {/* タイトル */}
        <h1 className="text-2xl font-bold text-center text-gray-800 dark:text-gray-100">
          今日の気分は？
        </h1>

        {/* エラーメッセージ */}
        {error && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded"
            role="alert"
          >
            {error.type === 'INVALID_MOOD_LEVEL' && (
              <p>気分を選択してください</p>
            )}
          </div>
        )}

        {/* 気分選択ボタン */}
        <div className="space-y-3">
          {MOOD_LEVELS.map((mood) => (
            <button
              key={mood.level}
              type="button"
              onClick={() => handleMoodSelect(mood.level)}
              aria-label={`気分レベル ${mood.level}: ${mood.label}`}
              aria-pressed={moodLevel === mood.level}
              className={`
                w-full min-h-[60px] px-6 py-4 rounded-lg
                flex items-center justify-between
                transition-all duration-200 transform
                ${mood.color}
                ${
                  moodLevel === mood.level
                    ? 'scale-105 ring-4 ring-offset-2 ring-blue-300 animate-pulse'
                    : 'hover:scale-102'
                }
                shadow-md hover:shadow-lg
                focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-offset-2
              `}
            >
              {/* 絵文字アイコン */}
              <span className="text-3xl" aria-hidden="true">
                {mood.emoji}
              </span>

              {/* ラベル */}
              <span className="text-lg font-medium">{mood.label}</span>

              {/* レベル表示 */}
              <span className="text-sm opacity-75" aria-hidden="true">
                Lv.{mood.level}
              </span>
            </button>
          ))}
        </div>

        {/* ステップインジケーター */}
        <div className="flex justify-center space-x-2 pt-4">
          <div
            className="h-2 w-2 rounded-full bg-blue-500"
            aria-label="ステップ1: 気分選択 (現在)"
          />
          <div
            className="h-2 w-2 rounded-full bg-gray-300"
            aria-label="ステップ2: 理由選択"
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
