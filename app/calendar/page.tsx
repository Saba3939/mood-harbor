/**
 * カレンダーページ
 * 月間カレンダービューで気分記録を表示
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  getMonthDays,
  calculateStreakDays,
  getMoodColor,
  getMoodEmoji,
  mergeRecordsToCalendar,
  type CalendarDay,
} from '@/lib/utils/calendar';
import {
  getRecordsByUserAction,
  deleteRecordAction,
  updateRecordAction,
} from '@/lib/actions/mood-record';
import { getQuestionByIdAction } from '@/lib/actions/daily-question';
import type { MoodRecord, UpdateRecordParams } from '@/lib/types/mood-record';
import type { DailyQuestion } from '@/lib/types/daily-question';
import RecordDetailModal from './components/RecordDetailModal';
import RecordEditModal from './components/RecordEditModal';

export default function CalendarPage() {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [records, setRecords] = useState<MoodRecord[]>([]);
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [streakDays, setStreakDays] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // モーダル状態
  const [selectedRecord, setSelectedRecord] = useState<MoodRecord | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<DailyQuestion | null>(
    null
  );
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const weekDays = ['日', '月', '火', '水', '木', '金', '土'];

  // 記録データを取得
  useEffect(() => {
    const fetchRecords = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // 仮のユーザーID（実際は認証から取得）
        const userId = 'current-user-id';

        // 当月の開始日と終了日を計算
        const startDate = new Date(currentYear, currentMonth, 1).toISOString();
        const endDate = new Date(
          currentYear,
          currentMonth + 1,
          0,
          23,
          59,
          59
        ).toISOString();

        const result = await getRecordsByUserAction(userId, {
          start_date: startDate,
          end_date: endDate,
        });

        if (result.success) {
          setRecords(result.value);
        } else {
          setError('データの取得に失敗しました');
        }
      } catch (err) {
        setError('データの取得中にエラーが発生しました');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecords();
  }, [currentYear, currentMonth]);

  // カレンダー日データを生成
  useEffect(() => {
    const days = getMonthDays(currentYear, currentMonth);
    const daysWithRecords = mergeRecordsToCalendar(days, records);
    setCalendarDays(daysWithRecords);

    // 連続記録日数を計算
    const streak = calculateStreakDays(records);
    setStreakDays(streak);
  }, [currentYear, currentMonth, records]);

  // 前月へ移動
  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentYear(currentYear - 1);
      setCurrentMonth(11);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  // 次月へ移動
  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentYear(currentYear + 1);
      setCurrentMonth(0);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // 日付タップ時の処理
  const handleDayClick = async (day: CalendarDay) => {
    if (!day.record) {
      return; // 記録がない日はモーダルを表示しない
    }

    setSelectedRecord(day.record);

    // 質問データを取得
    try {
      const questionResult = await getQuestionByIdAction(day.record.question_id);
      if (questionResult.success && questionResult.value) {
        setSelectedQuestion(questionResult.value);
      } else {
        setSelectedQuestion(null);
      }
    } catch (err) {
      setSelectedQuestion(null);
    }

    setIsDetailModalOpen(true);
  };

  // 詳細モーダルを閉じる
  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedRecord(null);
    setSelectedQuestion(null);
  };

  // 編集モーダルを開く
  const handleOpenEditModal = (record: MoodRecord) => {
    setSelectedRecord(record);
    setIsDetailModalOpen(false);
    setIsEditModalOpen(true);
  };

  // 編集モーダルを閉じる
  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedRecord(null);
  };

  // 記録を更新
  const handleUpdateRecord = async (
    recordId: string,
    updates: UpdateRecordParams
  ) => {
    const result = await updateRecordAction(recordId, updates);

    if (result.success) {
      // 記録リストを更新
      setRecords((prev) =>
        prev.map((r) => (r.id === recordId ? result.value : r))
      );
      setIsEditModalOpen(false);
      setSelectedRecord(null);
    } else {
      throw new Error('記録の更新に失敗しました');
    }
  };

  // 記録を削除
  const handleDeleteRecord = async (recordId: string) => {
    const result = await deleteRecordAction(recordId);

    if (result.success) {
      // 記録リストから削除
      setRecords((prev) => prev.filter((r) => r.id !== recordId));
      setIsDetailModalOpen(false);
      setSelectedRecord(null);
    } else {
      throw new Error('記録の削除に失敗しました');
    }
  };

  // カレンダーグリッドの先頭に空白セルを追加
  const getLeadingEmptyCells = (): React.ReactElement[] => {
    if (calendarDays.length === 0) return [];

    const firstDayOfWeek = calendarDays[0].dayOfWeek;
    const emptyCells: React.ReactElement[] = [];

    for (let i = 0; i < firstDayOfWeek; i++) {
      emptyCells.push(<div key={`empty-${i}`} className="h-16" />);
    }

    return emptyCells;
  };

  if (isLoading) {
    return (
      <main
        className="container mx-auto px-4 py-8 flex items-center justify-center min-h-screen"
        role="main"
      >
        <div className="text-center">
          <div
            className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]"
            role="status"
          >
            <span className="sr-only">読み込み中...</span>
          </div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            カレンダーを読み込んでいます...
          </p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main
        className="container mx-auto px-4 py-8 flex items-center justify-center min-h-screen"
        role="main"
      >
        <div className="text-center">
          <p className="text-red-500 text-lg">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            再読み込み
          </button>
        </div>
      </main>
    );
  }

  return (
    <main
      className="container mx-auto px-4 py-8 max-w-4xl"
      role="main"
    >
      {/* ヘッダー */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-center text-gray-800 dark:text-gray-100">
          カレンダー
        </h1>

        {/* 連続記録日数 */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 text-center"
        >
          <div className="inline-block px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full shadow-lg">
            <p className="text-white text-lg font-semibold">
              🔥 連続記録 {streakDays}日
            </p>
          </div>
        </motion.div>
      </div>

      {/* 月切り替えナビゲーション */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={goToPrevMonth}
          aria-label="前月"
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          ← 前月
        </button>

        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          {currentYear}年{currentMonth + 1}月
        </h2>

        <button
          onClick={goToNextMonth}
          aria-label="次月"
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          次月 →
        </button>
      </div>

      {/* カレンダーグリッド */}
      <div role="grid" className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
        {/* 曜日ヘッダー */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {weekDays.map((day, index) => (
            <div
              key={day}
              className={`text-center font-semibold py-2 ${
                index === 0
                  ? 'text-red-500'
                  : index === 6
                  ? 'text-blue-500'
                  : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* カレンダー日付 */}
        <div className="grid grid-cols-7 gap-2">
          {getLeadingEmptyCells()}
          {calendarDays.map((day) => {
            const hasRecord = !!day.record;
            const moodColor = hasRecord
              ? getMoodColor(day.record!.mood_level)
              : getMoodColor(null);
            const moodEmoji = hasRecord
              ? getMoodEmoji(day.record!.mood_level)
              : null;

            return (
              <motion.button
                key={`${day.year}-${day.month}-${day.date}`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleDayClick(day)}
                disabled={!hasRecord}
                data-has-record={hasRecord}
                className={`
                  h-16 rounded-lg flex flex-col items-center justify-center
                  transition-all duration-200
                  ${moodColor}
                  ${
                    hasRecord
                      ? 'text-white shadow-md hover:shadow-lg cursor-pointer'
                      : 'text-gray-400 dark:text-gray-500 cursor-default'
                  }
                  ${
                    day.dayOfWeek === 0
                      ? 'border-2 border-red-300'
                      : day.dayOfWeek === 6
                      ? 'border-2 border-blue-300'
                      : ''
                  }
                  focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2
                `}
                aria-label={`${day.date}日${
                  hasRecord ? ' 記録あり' : ' 記録なし'
                }`}
              >
                <span className="text-sm font-semibold">{day.date}</span>
                {moodEmoji && (
                  <span className="text-lg" aria-hidden="true">
                    {moodEmoji}
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* 凡例 */}
      <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          気分レベル
        </h3>
        <div className="flex flex-wrap gap-3">
          {[
            { level: 5, label: 'とても良い', emoji: '😊' },
            { level: 4, label: '良い', emoji: '🙂' },
            { level: 3, label: '普通', emoji: '😐' },
            { level: 2, label: '少し疲れた', emoji: '😔' },
            { level: 1, label: 'とても疲れた', emoji: '😢' },
          ].map(({ level, label, emoji }) => (
            <div key={level} className="flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded ${getMoodColor(
                  level as any
                )}`}
              />
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {emoji} {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 記録詳細モーダル */}
      {selectedRecord && (
        <RecordDetailModal
          record={selectedRecord}
          question={selectedQuestion}
          isOpen={isDetailModalOpen}
          onClose={handleCloseDetailModal}
          onEdit={handleOpenEditModal}
          onDelete={handleDeleteRecord}
        />
      )}

      {/* 記録編集モーダル */}
      {selectedRecord && (
        <RecordEditModal
          record={selectedRecord}
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          onSave={handleUpdateRecord}
        />
      )}
    </main>
  );
}
