/**
 * 記録編集モーダル
 * 記録内容を編集するモーダル
 */

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type {
  MoodRecord,
  MoodLevel,
  ReasonCategory,
  TimeOfDay,
  Weather,
  UpdateRecordParams,
} from '@/lib/types/mood-record';
import { getMoodEmoji } from '@/lib/utils/calendar';

type RecordEditModalProps = {
  record: MoodRecord;
  isOpen: boolean;
  onClose: () => void;
  onSave: (recordId: string, updates: UpdateRecordParams) => Promise<void>;
};

export default function RecordEditModal({
  record,
  isOpen,
  onClose,
  onSave,
}: RecordEditModalProps) {
  const [moodLevel, setMoodLevel] = useState<MoodLevel>(record.mood_level);
  const [selectedReasons, setSelectedReasons] = useState<ReasonCategory[]>(
    record.reasons
  );
  const [memo, setMemo] = useState<string>(record.memo || '');
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay | null>(
    record.time_of_day
  );
  const [weather, setWeather] = useState<Weather | null>(record.weather);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // モーダルが開かれたときに初期値をリセット
  useEffect(() => {
    if (isOpen) {
      setMoodLevel(record.mood_level);
      setSelectedReasons(record.reasons);
      setMemo(record.memo || '');
      setTimeOfDay(record.time_of_day);
      setWeather(record.weather);
      setError(null);
    }
  }, [isOpen, record]);

  // ESCキーでモーダルを閉じる
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  // 理由カテゴリーの日本語ラベル
  const reasonCategories: { value: ReasonCategory; label: string }[] = [
    { value: 'study_school', label: '勉強・学校' },
    { value: 'relationships', label: '人間関係' },
    { value: 'health', label: '体調・健康' },
    { value: 'hobbies', label: '趣味・遊び' },
    { value: 'work', label: 'バイト・仕事' },
    { value: 'family', label: '家族・家のこと' },
    { value: 'sleep', label: '睡眠' },
    { value: 'no_reason', label: '特に理由なし' },
  ];

  // 時間帯の選択肢
  const timeOfDayOptions: { value: TimeOfDay; label: string }[] = [
    { value: 'morning', label: '朝' },
    { value: 'afternoon', label: '昼' },
    { value: 'evening', label: '夕方' },
    { value: 'night', label: '夜' },
  ];

  // 天気の選択肢
  const weatherOptions: { value: Weather; label: string }[] = [
    { value: 'sunny', label: '☀️ 晴れ' },
    { value: 'cloudy', label: '☁️ 曇り' },
    { value: 'rainy', label: '🌧️ 雨' },
    { value: 'other', label: '🌈 その他' },
  ];

  // 理由カテゴリーの選択切り替え
  const toggleReason = (reason: ReasonCategory) => {
    setError(null);

    if (selectedReasons.includes(reason)) {
      setSelectedReasons(selectedReasons.filter((r) => r !== reason));
    } else {
      if (selectedReasons.length >= 2) {
        setError('理由は最大2つまで選択できます');
        return;
      }
      setSelectedReasons([...selectedReasons, reason]);
    }
  };

  // メモの変更
  const handleMemoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length > 10) {
      setError('メモは10文字以内で入力してください');
    } else {
      setError(null);
    }
    setMemo(value);
  };

  // 保存処理
  const handleSave = async () => {
    // バリデーション
    if (memo.length > 10) {
      setError('メモは10文字以内で入力してください');
      return;
    }

    if (selectedReasons.length > 2) {
      setError('理由は最大2つまで選択できます');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const updates: UpdateRecordParams = {
        mood_level: moodLevel,
        reasons: selectedReasons,
        memo: memo || undefined,
        time_of_day: timeOfDay,
        weather: weather,
      };

      await onSave(record.id, updates);
      onClose();
    } catch (err) {
      setError('保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          data-testid="modal-backdrop"
          onClick={handleBackdropClick}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            role="dialog"
            aria-label="記録の編集"
          >
            {/* ヘッダー */}
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                記録の編集
              </h2>
            </div>

            {/* コンテンツ */}
            <div className="px-6 py-4 space-y-6">
              {/* エラーメッセージ */}
              {error && (
                <div className="px-4 py-3 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100 rounded-lg">
                  {error}
                </div>
              )}

              {/* 気分レベル */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  気分
                </h3>
                <div className="grid grid-cols-5 gap-2">
                  {([5, 4, 3, 2, 1] as MoodLevel[]).map((level) => (
                    <button
                      key={level}
                      onClick={() => setMoodLevel(level)}
                      aria-label={getMoodEmoji(level)}
                      className={`
                        p-4 rounded-lg text-3xl transition-all
                        ${
                          moodLevel === level
                            ? 'bg-blue-500 scale-110 shadow-lg'
                            : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }
                      `}
                    >
                      {getMoodEmoji(level)}
                    </button>
                  ))}
                </div>
              </div>

              {/* 理由カテゴリー */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  理由（最大2つ）
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {reasonCategories.map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => toggleReason(value)}
                      className={`
                        px-4 py-2 rounded-lg text-sm transition-all
                        ${
                          selectedReasons.includes(value)
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

              {/* メモ */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  メモ（10文字以内）
                </h3>
                <input
                  type="text"
                  value={memo}
                  onChange={handleMemoChange}
                  maxLength={10}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="メモを入力（任意）"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {memo.length}/10文字
                </p>
              </div>

              {/* 時間帯 */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  時間帯（任意）
                </h3>
                <div className="grid grid-cols-4 gap-2">
                  {timeOfDayOptions.map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() =>
                        setTimeOfDay(timeOfDay === value ? null : value)
                      }
                      className={`
                        px-4 py-2 rounded-lg text-sm transition-all
                        ${
                          timeOfDay === value
                            ? 'bg-purple-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }
                      `}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 天気 */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  天気（任意）
                </h3>
                <div className="grid grid-cols-4 gap-2">
                  {weatherOptions.map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => setWeather(weather === value ? null : value)}
                      className={`
                        px-4 py-2 rounded-lg text-sm transition-all
                        ${
                          weather === value
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }
                      `}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* フッター */}
            <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
              <div className="flex gap-3 justify-end">
                <button
                  onClick={onClose}
                  disabled={isSaving}
                  className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  {isSaving ? '保存中...' : '保存'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
