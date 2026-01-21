/**
 * FilterModal Component
 * ハーバーの時間帯フィルターモーダル
 *
 * 要件:
 * - 時間帯選択肢を表示（朝、昼、夕、夜、すべて表示）
 * - 選択した時間帯を適用
 * - 現在のフィルター状態を視覚的に表示
 */

'use client';

import { useState, useEffect } from 'react';
import type { TimeOfDay } from '@/lib/types/mood-record';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (timeOfDay: TimeOfDay | null) => void;
  currentFilter: TimeOfDay | null;
}

// 時間帯オプション
const TIME_OF_DAY_OPTIONS: Array<{
  label: string;
  value: TimeOfDay | null;
}> = [
  { label: 'すべて表示', value: null },
  { label: '朝', value: 'morning' },
  { label: '昼', value: 'afternoon' },
  { label: '夕', value: 'evening' },
  { label: '夜', value: 'night' },
];

export default function FilterModal({
  isOpen,
  onClose,
  onApply,
  currentFilter,
}: FilterModalProps) {
  const [selectedTimeOfDay, setSelectedTimeOfDay] = useState<TimeOfDay | null>(
    currentFilter
  );

  // currentFilterが変更されたら選択状態を更新
  useEffect(() => {
    setSelectedTimeOfDay(currentFilter);
  }, [currentFilter]);

  if (!isOpen) return null;

  const handleApply = () => {
    onApply(selectedTimeOfDay);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">時間帯でフィルター</h2>
          <button
            aria-label="閉じる"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {/* 時間帯選択肢 */}
        <div className="space-y-2 mb-6">
          {TIME_OF_DAY_OPTIONS.map((option) => {
            const isSelected =
              (option.value === null && selectedTimeOfDay === null) ||
              option.value === selectedTimeOfDay;

            return (
              <button
                key={option.value ?? 'all'}
                onClick={() => setSelectedTimeOfDay(option.value)}
                className={`w-full py-3 px-4 rounded-lg border-2 transition-colors text-left font-medium ${
                  isSelected
                    ? 'bg-blue-100 border-blue-500 text-blue-700'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        {/* アクションボタン */}
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            キャンセル
          </button>
          <button
            onClick={handleApply}
            className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            適用
          </button>
        </div>
      </div>
    </div>
  );
}
