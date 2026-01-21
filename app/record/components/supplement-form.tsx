/**
 * 補足入力フォームコンポーネント
 *
 * 記録完了後にオプションで追加情報を入力できます:
 * - メモ (10文字以内)
 * - 時間帯 (朝、昼、夕方、夜)
 * - 天気 (晴れ、曇り、雨、その他)
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
 */

'use client';

import { useMoodRecordStore } from '@/lib/stores/mood-record-store';
import type { TimeOfDay, Weather } from '@/lib/types/mood-record';

const TIME_OF_DAY_OPTIONS: { label: string; value: TimeOfDay }[] = [
  { label: '朝', value: 'morning' },
  { label: '昼', value: 'afternoon' },
  { label: '夕方', value: 'evening' },
  { label: '夜', value: 'night' },
];

const WEATHER_OPTIONS: { label: string; value: Weather }[] = [
  { label: '晴れ', value: 'sunny' },
  { label: '曇り', value: 'cloudy' },
  { label: '雨', value: 'rainy' },
  { label: 'その他', value: 'other' },
];

const MAX_MEMO_LENGTH = 10;

type SupplementFormProps = {
  onSubmit: () => void;
  onSkip: () => void;
  onShare?: () => void; // シェアボタンのハンドラー (オプション)
};

/**
 * SupplementForm: 補足入力フォーム
 */
export function SupplementForm({
  onSubmit,
  onSkip,
  onShare,
}: SupplementFormProps) {
  const { memo, timeOfDay, weather, setMemo, setTimeOfDay, setWeather } =
    useMoodRecordStore();

  const handleMemoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length <= MAX_MEMO_LENGTH) {
      setMemo(value);
    }
  };

  const handleTimeOfDayClick = (time: TimeOfDay) => {
    setTimeOfDay(time);
  };

  const handleWeatherClick = (weatherValue: Weather) => {
    setWeather(weatherValue);
  };

  return (
    <div className="w-full max-w-md space-y-6">
      {/* タイトル */}
      <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-gray-100">
        もう少し詳しく
      </h2>

      {/* メモ入力 */}
      <div className="space-y-2">
        <label
          htmlFor="memo-input"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          メモ
        </label>
        <div className="relative">
          <input
            id="memo-input"
            type="text"
            value={memo}
            onChange={handleMemoChange}
            maxLength={MAX_MEMO_LENGTH}
            placeholder="今日の一言（任意）"
            aria-label="メモ入力（10文字以内）"
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
          />
          <span className="absolute right-3 top-3 text-sm text-gray-500 dark:text-gray-400">
            {memo.length}/{MAX_MEMO_LENGTH}
          </span>
        </div>
      </div>

      {/* 時間帯選択 */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          時間帯
        </label>
        <div className="grid grid-cols-4 gap-2">
          {TIME_OF_DAY_OPTIONS.map(({ label, value }) => (
            <button
              key={value}
              type="button"
              onClick={() => handleTimeOfDayClick(value)}
              aria-pressed={timeOfDay === value}
              aria-label={`時間帯: ${label}`}
              className={`
                px-4 py-3 rounded-lg font-medium transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                ${
                  timeOfDay === value
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600'
                }
              `}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 天気選択 */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          天気
        </label>
        <div className="grid grid-cols-4 gap-2">
          {WEATHER_OPTIONS.map(({ label, value }) => (
            <button
              key={value}
              type="button"
              onClick={() => handleWeatherClick(value)}
              aria-pressed={weather === value}
              aria-label={`天気: ${label}`}
              className={`
                px-4 py-3 rounded-lg font-medium transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                ${
                  weather === value
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600'
                }
              `}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ボタン */}
      <div className="space-y-3">
        {onShare && (
          <button
            type="button"
            onClick={onShare}
            className="w-full px-6 py-3 rounded-lg font-medium text-white
                     bg-blue-500 hover:bg-blue-600
                     transition-all duration-200
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            シェアする
          </button>
        )}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onSkip}
            className="flex-1 px-6 py-3 rounded-lg font-medium text-gray-700 dark:text-gray-300
                     bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600
                     transition-all duration-200
                     focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            スキップ
          </button>
          <button
            type="button"
            onClick={onSubmit}
            className="flex-1 px-6 py-3 rounded-lg font-medium text-white
                     bg-green-500 hover:bg-green-600
                     transition-all duration-200
                     focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
