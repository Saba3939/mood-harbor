/**
 * 記録詳細モーダル
 * 日付タップ時に記録の詳細を表示するモーダル
 */

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { MoodRecord } from '@/lib/types/mood-record';
import type { DailyQuestion } from '@/lib/types/daily-question';
import { getMoodEmoji, getMoodLabel } from '@/lib/utils/calendar';

type RecordDetailModalProps = {
  record: MoodRecord;
  question: DailyQuestion | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (record: MoodRecord) => void;
  onDelete: (recordId: string) => void;
};

export default function RecordDetailModal({
  record,
  question,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}: RecordDetailModalProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
  const getReasonLabel = (reason: string): string => {
    const labels: Record<string, string> = {
      study_school: '勉強・学校',
      relationships: '人間関係',
      health: '体調・健康',
      hobbies: '趣味・遊び',
      work: 'バイト・仕事',
      family: '家族・家のこと',
      sleep: '睡眠',
      no_reason: '特に理由なし',
    };
    return labels[reason] || reason;
  };

  // 時間帯の日本語ラベル
  const getTimeOfDayLabel = (timeOfDay: string): string => {
    const labels: Record<string, string> = {
      morning: '朝',
      afternoon: '昼',
      evening: '夕方',
      night: '夜',
    };
    return labels[timeOfDay] || timeOfDay;
  };

  // 天気の日本語ラベルと絵文字
  const getWeatherLabel = (weather: string): string => {
    const labels: Record<string, string> = {
      sunny: '☀️ 晴れ',
      cloudy: '☁️ 曇り',
      rainy: '🌧️ 雨',
      other: '🌈 その他',
    };
    return labels[weather] || weather;
  };

  // 削除確認ダイアログ
  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = () => {
    onDelete(record.id);
    setShowDeleteConfirm(false);
    onClose();
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
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
            aria-label="記録の詳細"
          >
            {/* ヘッダー */}
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                  記録の詳細
                </h2>
                <button
                  onClick={onClose}
                  aria-label="閉じる"
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* コンテンツ */}
            <div className="px-6 py-4 space-y-6">
              {/* 気分 */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">
                  気分
                </h3>
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{getMoodEmoji(record.mood_level)}</span>
                  <span className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                    {getMoodLabel(record.mood_level)}
                  </span>
                </div>
              </div>

              {/* 理由 */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">
                  理由
                </h3>
                <div className="flex flex-wrap gap-2">
                  {record.reasons.map((reason) => (
                    <span
                      key={reason}
                      className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 rounded-full text-sm"
                    >
                      {getReasonLabel(reason)}
                    </span>
                  ))}
                </div>
              </div>

              {/* 質問と回答 */}
              {question && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">
                    今日の質問
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 mb-2">
                    {question.question_text}
                  </p>
                  <div className="px-4 py-2 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 rounded-lg">
                    {record.answer_option}
                  </div>
                </div>
              )}

              {/* メモ */}
              {record.memo && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">
                    メモ
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    {record.memo}
                  </p>
                </div>
              )}

              {/* 時間帯と天気 */}
              {(record.time_of_day || record.weather) && (
                <div className="flex gap-4">
                  {record.time_of_day && (
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">
                        時間帯
                      </h3>
                      <p className="text-gray-700 dark:text-gray-300">
                        {getTimeOfDayLabel(record.time_of_day)}
                      </p>
                    </div>
                  )}
                  {record.weather && (
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">
                        天気
                      </h3>
                      <p className="text-gray-700 dark:text-gray-300">
                        {getWeatherLabel(record.weather)}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* 記録日時 */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">
                  記録日時
                </h3>
                <p className="text-gray-700 dark:text-gray-300">
                  {new Date(record.created_at).toLocaleString('ja-JP', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>

            {/* フッター（アクションボタン） */}
            <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => onEdit(record)}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  編集
                </button>
                <button
                  onClick={handleDeleteClick}
                  className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
                >
                  削除
                </button>
              </div>
            </div>

            {/* 削除確認ダイアログ */}
            {showDeleteConfirm && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-sm mx-4">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">
                    記録の削除
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    この記録を削除しますか?
                    <br />
                    この操作は取り消せません。
                  </p>
                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={handleDeleteCancel}
                      className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                      キャンセル
                    </button>
                    <button
                      onClick={handleDeleteConfirm}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      削除する
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
