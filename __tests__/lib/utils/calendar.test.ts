/**
 * カレンダーユーティリティ関数のテスト
 */

import { describe, it, expect } from '@jest/globals';
import {
  getMonthDays,
  calculateStreakDays,
  getMoodColor,
} from '@/lib/utils/calendar';
import type { MoodRecord } from '@/lib/types/mood-record';

describe('カレンダーユーティリティ', () => {
  describe('getMonthDays', () => {
    it('2026年1月のカレンダー日数を正しく計算する', () => {
      const days = getMonthDays(2026, 0); // 0 = 1月

      expect(days).toHaveLength(31);
      expect(days[0].date).toBe(1);
      expect(days[0].dayOfWeek).toBe(4); // 2026-01-01は木曜日
      expect(days[30].date).toBe(31);
    });

    it('2026年2月（閏年でない）のカレンダー日数を正しく計算する', () => {
      const days = getMonthDays(2026, 1); // 1 = 2月

      expect(days).toHaveLength(28);
      expect(days[0].date).toBe(1);
      expect(days[27].date).toBe(28);
    });

    it('2024年2月（閏年）のカレンダー日数を正しく計算する', () => {
      const days = getMonthDays(2024, 1); // 1 = 2月

      expect(days).toHaveLength(29);
      expect(days[28].date).toBe(29);
    });

    it('各日に正しい曜日が設定される', () => {
      const days = getMonthDays(2026, 0); // 2026年1月

      // 2026-01-01は木曜日（4）
      expect(days[0].dayOfWeek).toBe(4);
      // 2026-01-02は金曜日（5）
      expect(days[1].dayOfWeek).toBe(5);
      // 2026-01-03は土曜日（6）
      expect(days[2].dayOfWeek).toBe(6);
      // 2026-01-04は日曜日（0）
      expect(days[3].dayOfWeek).toBe(0);
    });

    it('各日にyear, monthが正しく設定される', () => {
      const days = getMonthDays(2026, 5); // 2026年6月

      days.forEach((day) => {
        expect(day.year).toBe(2026);
        expect(day.month).toBe(5);
      });
    });
  });

  describe('calculateStreakDays', () => {
    it('連続記録がない場合、0を返す', () => {
      const records: MoodRecord[] = [];
      const streak = calculateStreakDays(records);

      expect(streak).toBe(0);
    });

    it('1日のみ記録がある場合、1を返す', () => {
      const records: MoodRecord[] = [
        {
          id: 'record-1',
          user_id: 'user-1',
          mood_level: 4,
          reasons: ['study_school'],
          question_id: 'q1',
          answer_option: 'option1',
          memo: null,
          time_of_day: null,
          weather: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      const streak = calculateStreakDays(records);
      expect(streak).toBe(1);
    });

    it('連続した記録の日数を正しく計算する', () => {
      const today = new Date();
      const records: MoodRecord[] = [
        {
          id: 'record-1',
          user_id: 'user-1',
          mood_level: 4,
          reasons: ['study_school'],
          question_id: 'q1',
          answer_option: 'option1',
          memo: null,
          time_of_day: null,
          weather: null,
          created_at: today.toISOString(),
          updated_at: today.toISOString(),
        },
        {
          id: 'record-2',
          user_id: 'user-1',
          mood_level: 3,
          reasons: ['relationships'],
          question_id: 'q2',
          answer_option: 'option2',
          memo: null,
          time_of_day: null,
          weather: null,
          created_at: new Date(
            today.getTime() - 24 * 60 * 60 * 1000
          ).toISOString(),
          updated_at: new Date(
            today.getTime() - 24 * 60 * 60 * 1000
          ).toISOString(),
        },
        {
          id: 'record-3',
          user_id: 'user-1',
          mood_level: 5,
          reasons: ['hobbies'],
          question_id: 'q3',
          answer_option: 'option3',
          memo: null,
          time_of_day: null,
          weather: null,
          created_at: new Date(
            today.getTime() - 2 * 24 * 60 * 60 * 1000
          ).toISOString(),
          updated_at: new Date(
            today.getTime() - 2 * 24 * 60 * 60 * 1000
          ).toISOString(),
        },
      ];

      const streak = calculateStreakDays(records);
      expect(streak).toBe(3);
    });

    it('記録が途切れている場合、最新の連続日数のみを返す', () => {
      const today = new Date();
      const records: MoodRecord[] = [
        {
          id: 'record-1',
          user_id: 'user-1',
          mood_level: 4,
          reasons: ['study_school'],
          question_id: 'q1',
          answer_option: 'option1',
          memo: null,
          time_of_day: null,
          weather: null,
          created_at: today.toISOString(),
          updated_at: today.toISOString(),
        },
        {
          id: 'record-2',
          user_id: 'user-1',
          mood_level: 3,
          reasons: ['relationships'],
          question_id: 'q2',
          answer_option: 'option2',
          memo: null,
          time_of_day: null,
          weather: null,
          created_at: new Date(
            today.getTime() - 24 * 60 * 60 * 1000
          ).toISOString(),
          updated_at: new Date(
            today.getTime() - 24 * 60 * 60 * 1000
          ).toISOString(),
        },
        // 1日スキップ（2日前の記録なし）
        {
          id: 'record-3',
          user_id: 'user-1',
          mood_level: 5,
          reasons: ['hobbies'],
          question_id: 'q3',
          answer_option: 'option3',
          memo: null,
          time_of_day: null,
          weather: null,
          created_at: new Date(
            today.getTime() - 3 * 24 * 60 * 60 * 1000
          ).toISOString(),
          updated_at: new Date(
            today.getTime() - 3 * 24 * 60 * 60 * 1000
          ).toISOString(),
        },
      ];

      const streak = calculateStreakDays(records);
      expect(streak).toBe(2); // 今日と昨日のみ
    });

    it('今日の記録がない場合、0を返す', () => {
      const today = new Date();
      const records: MoodRecord[] = [
        {
          id: 'record-1',
          user_id: 'user-1',
          mood_level: 4,
          reasons: ['study_school'],
          question_id: 'q1',
          answer_option: 'option1',
          memo: null,
          time_of_day: null,
          weather: null,
          created_at: new Date(
            today.getTime() - 24 * 60 * 60 * 1000
          ).toISOString(),
          updated_at: new Date(
            today.getTime() - 24 * 60 * 60 * 1000
          ).toISOString(),
        },
      ];

      const streak = calculateStreakDays(records);
      expect(streak).toBe(0); // 今日の記録がないので連続記録は途切れている
    });
  });

  describe('getMoodColor', () => {
    it('気分レベル5に対して正しい色を返す（色覚異常対応）', () => {
      const color = getMoodColor(5);
      expect(color).toMatch(/^(bg-green-500|#[0-9a-fA-F]{6})$/);
    });

    it('気分レベル4に対して正しい色を返す', () => {
      const color = getMoodColor(4);
      expect(color).toMatch(/^(bg-blue-400|#[0-9a-fA-F]{6})$/);
    });

    it('気分レベル3に対して正しい色を返す', () => {
      const color = getMoodColor(3);
      expect(color).toMatch(/^(bg-yellow-400|#[0-9a-fA-F]{6})$/);
    });

    it('気分レベル2に対して正しい色を返す', () => {
      const color = getMoodColor(2);
      expect(color).toMatch(/^(bg-orange-400|#[0-9a-fA-F]{6})$/);
    });

    it('気分レベル1に対して正しい色を返す', () => {
      const color = getMoodColor(1);
      expect(color).toMatch(/^(bg-red-400|#[0-9a-fA-F]{6})$/);
    });

    it('記録なし（null）の場合、灰色を返す', () => {
      const color = getMoodColor(null);
      expect(color).toMatch(/^(bg-gray-200|#[0-9a-fA-F]{6})$/);
    });
  });
});
