/**
 * カレンダー表示ユーティリティ関数
 */

import type { MoodRecord, MoodLevel } from '@/lib/types/mood-record';

/**
 * カレンダーの日データ型
 */
export type CalendarDay = {
  date: number; // 日（1-31）
  dayOfWeek: number; // 曜日（0=日曜, 6=土曜）
  year: number;
  month: number; // 0-11
  record?: MoodRecord; // その日の記録（あれば）
};

/**
 * 指定月のカレンダー日数を計算
 * @param year 年
 * @param month 月（0-11）
 * @returns カレンダー日の配列
 */
export function getMonthDays(year: number, month: number): CalendarDay[] {
  const days: CalendarDay[] = [];
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let date = 1; date <= daysInMonth; date++) {
    const dateObj = new Date(year, month, date);
    days.push({
      date,
      dayOfWeek: dateObj.getDay(),
      year,
      month,
    });
  }

  return days;
}

/**
 * 連続記録日数を計算
 * @param records 記録の配列（降順ソート済みを推奨）
 * @returns 連続記録日数
 */
export function calculateStreakDays(records: MoodRecord[]): number {
  if (records.length === 0) {
    return 0;
  }

  // 日付のみで比較するため、時刻を0時に正規化
  const normalizeDate = (dateStr: string): Date => {
    const date = new Date(dateStr);
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  };

  // 記録を日付でソート（降順: 最新が先頭）
  const sortedRecords = [...records].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  // 重複日付を除去（1日に複数記録がある場合は最新のみ）
  const uniqueRecords = sortedRecords.filter(
    (record, index, arr) =>
      index === 0 ||
      normalizeDate(record.created_at).getTime() !==
        normalizeDate(arr[index - 1].created_at).getTime()
  );

  const today = normalizeDate(new Date().toISOString());
  const latestRecordDate = normalizeDate(uniqueRecords[0].created_at);

  // 最新の記録が今日でない場合、連続記録は途切れている
  if (latestRecordDate.getTime() !== today.getTime()) {
    return 0;
  }

  let streak = 1;
  let currentDate = new Date(latestRecordDate);

  for (let i = 1; i < uniqueRecords.length; i++) {
    // 前日の日付を計算
    currentDate.setDate(currentDate.getDate() - 1);

    const recordDate = normalizeDate(uniqueRecords[i].created_at);

    // 前日の記録が存在するか確認
    if (recordDate.getTime() === currentDate.getTime()) {
      streak++;
    } else {
      // 連続が途切れた
      break;
    }
  }

  return streak;
}

/**
 * 気分レベルに対応する色を取得（色覚異常対応）
 * @param moodLevel 気分レベル（1-5）またはnull
 * @returns TailwindCSSクラス名
 */
export function getMoodColor(moodLevel: MoodLevel | null): string {
  if (moodLevel === null) {
    return 'bg-gray-200'; // 記録なし
  }

  // 色覚異常対応: 明度と彩度で区別
  const colorMap: Record<MoodLevel, string> = {
    5: 'bg-green-500', // とても良い: 緑
    4: 'bg-blue-400', // 良い: 青
    3: 'bg-yellow-400', // 普通: 黄色
    2: 'bg-orange-400', // 少し疲れた: オレンジ
    1: 'bg-red-400', // とても疲れた: 赤
  };

  return colorMap[moodLevel] || 'bg-gray-200';
}

/**
 * 気分レベルに対応する絵文字を取得
 * @param moodLevel 気分レベル（1-5）
 * @returns 絵文字
 */
export function getMoodEmoji(moodLevel: MoodLevel): string {
  const emojiMap: Record<MoodLevel, string> = {
    5: '😊', // とても良い
    4: '🙂', // 良い
    3: '😐', // 普通
    2: '😔', // 少し疲れた
    1: '😢', // とても疲れた
  };

  return emojiMap[moodLevel] || '😐';
}

/**
 * 気分レベルに対応するラベルを取得
 * @param moodLevel 気分レベル（1-5）
 * @returns ラベル
 */
export function getMoodLabel(moodLevel: MoodLevel): string {
  const labelMap: Record<MoodLevel, string> = {
    5: 'とても良い',
    4: '良い',
    3: '普通',
    2: '少し疲れた',
    1: 'とても疲れた',
  };

  return labelMap[moodLevel] || '普通';
}

/**
 * 記録データをカレンダー日に統合
 * @param days カレンダー日の配列
 * @param records 記録の配列
 * @returns 記録が統合されたカレンダー日の配列
 */
export function mergeRecordsToCalendar(
  days: CalendarDay[],
  records: MoodRecord[]
): CalendarDay[] {
  return days.map((day) => {
    // その日の記録を検索
    const record = records.find((r) => {
      const recordDate = new Date(r.created_at);
      return (
        recordDate.getFullYear() === day.year &&
        recordDate.getMonth() === day.month &&
        recordDate.getDate() === day.date
      );
    });

    return {
      ...day,
      record,
    };
  });
}
