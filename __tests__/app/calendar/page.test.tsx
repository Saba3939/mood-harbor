/**
 * カレンダーページのテスト
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CalendarPage from '@/app/calendar/page';
import * as moodRecordActions from '@/lib/actions/mood-record';

// Server Actionsのモック
jest.mock('@/lib/actions/mood-record');

// Framer Motionのモック
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => (
      <button {...props}>{children}</button>
    ),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('CalendarPage', () => {
  const today = new Date();
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000);

  const mockRecords = [
    {
      id: 'record-1',
      user_id: 'user-123',
      mood_level: 5,
      reasons: ['hobbies'],
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
      user_id: 'user-123',
      mood_level: 4,
      reasons: ['study_school'],
      question_id: 'q2',
      answer_option: 'option2',
      memo: null,
      time_of_day: null,
      weather: null,
      created_at: yesterday.toISOString(),
      updated_at: yesterday.toISOString(),
    },
    {
      id: 'record-3',
      user_id: 'user-123',
      mood_level: 3,
      reasons: ['relationships'],
      question_id: 'q3',
      answer_option: 'option3',
      memo: null,
      time_of_day: null,
      weather: null,
      created_at: twoDaysAgo.toISOString(),
      updated_at: twoDaysAgo.toISOString(),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // 記録データ取得のモック
    jest
      .spyOn(moodRecordActions, 'getRecordsByUserAction')
      .mockResolvedValue({
        success: true,
        value: mockRecords,
      });
  });

  it('カレンダーが正しく表示される', async () => {
    render(<CalendarPage />);

    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    await waitFor(() => {
      expect(
        screen.getByText(new RegExp(`${currentYear}年${currentMonth}月`))
      ).toBeInTheDocument();
    });

    // カレンダーグリッドが表示されることを確認
    expect(screen.getByRole('grid')).toBeInTheDocument();
  });

  it('記録済みの日が色付きで表示される', async () => {
    render(<CalendarPage />);

    await waitFor(() => {
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });

    // 記録のある日付のボタンが存在することを確認
    await waitFor(() => {
      const recordedButtons = screen
        .getAllByRole('button')
        .filter((btn) => btn.getAttribute('data-has-record') === 'true');
      expect(recordedButtons.length).toBeGreaterThan(0);
    });
  });

  it('記録していない日が灰色で表示される', async () => {
    render(<CalendarPage />);

    await waitFor(() => {
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });

    // 記録のない日付（明日など）を確認
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 3);
    const tomorrowDate = tomorrow.getDate();

    const dayElement = screen.getByText(tomorrowDate.toString());
    const dayButton = dayElement.closest('button');
    expect(dayButton).toHaveAttribute('data-has-record', 'false');
  });

  it('連続記録日数が表示される', async () => {
    render(<CalendarPage />);

    await waitFor(() => {
      expect(screen.getByText(/連続記録/)).toBeInTheDocument();
    });

    // 連続記録日数が表示されることを確認（今日、昨日、一昨日の3日間）
    await waitFor(() => {
      const streakElement = screen.getByText(/連続記録/);
      expect(streakElement.textContent).toMatch(/連続記録\s*3日/);
    });
  });

  it('前月ボタンをクリックすると前月のカレンダーが表示される', async () => {
    const user = userEvent.setup();

    render(<CalendarPage />);

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    await waitFor(() => {
      expect(
        screen.getByText(new RegExp(`${currentYear}年${currentMonth}月`))
      ).toBeInTheDocument();
    });

    // 前月ボタンをクリック
    const prevButton = screen.getByRole('button', { name: /前月/ });
    await user.click(prevButton);

    // 前月が表示されることを確認
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    await waitFor(() => {
      expect(
        screen.getByText(new RegExp(`${prevYear}年${prevMonth}月`))
      ).toBeInTheDocument();
    });
  });

  it('次月ボタンをクリックすると次月のカレンダーが表示される', async () => {
    const user = userEvent.setup();

    render(<CalendarPage />);

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    await waitFor(() => {
      expect(
        screen.getByText(new RegExp(`${currentYear}年${currentMonth}月`))
      ).toBeInTheDocument();
    });

    // 次月ボタンをクリック
    const nextButton = screen.getByRole('button', { name: /次月/ });
    await user.click(nextButton);

    // 次月が表示されることを確認
    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
    const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;

    await waitFor(() => {
      expect(
        screen.getByText(new RegExp(`${nextYear}年${nextMonth}月`))
      ).toBeInTheDocument();
    });
  });

  it('曜日ヘッダーが正しく表示される', async () => {
    render(<CalendarPage />);

    await waitFor(() => {
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });

    // 曜日ヘッダーの確認
    expect(screen.getByText('日')).toBeInTheDocument();
    expect(screen.getByText('月')).toBeInTheDocument();
    expect(screen.getByText('火')).toBeInTheDocument();
    expect(screen.getByText('水')).toBeInTheDocument();
    expect(screen.getByText('木')).toBeInTheDocument();
    expect(screen.getByText('金')).toBeInTheDocument();
    expect(screen.getByText('土')).toBeInTheDocument();
  });

  it('月切り替え時に記録データが再取得される', async () => {
    const user = userEvent.setup();

    render(<CalendarPage />);

    await waitFor(() => {
      expect(screen.getByText(/2026年1月/)).toBeInTheDocument();
    });

    // 初回の取得確認
    expect(moodRecordActions.getRecordsByUserAction).toHaveBeenCalledTimes(1);

    // 次月ボタンをクリック
    const nextButton = screen.getByRole('button', { name: /次月/ });
    await user.click(nextButton);

    // 記録データが再取得されることを確認
    await waitFor(() => {
      expect(moodRecordActions.getRecordsByUserAction).toHaveBeenCalledTimes(
        2
      );
    });
  });

  it('データ取得エラー時にエラーメッセージが表示される', async () => {
    // エラーをモック
    jest
      .spyOn(moodRecordActions, 'getRecordsByUserAction')
      .mockResolvedValue({
        success: false,
        error: {
          type: 'RECORD_NOT_FOUND',
          record_id: 'test',
        },
      });

    render(<CalendarPage />);

    await waitFor(() => {
      expect(
        screen.getByText(/データの取得に失敗しました/)
      ).toBeInTheDocument();
    });
  });

  it('ローディング中はスピナーが表示される', () => {
    // 遅延するモック
    jest
      .spyOn(moodRecordActions, 'getRecordsByUserAction')
      .mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(
              () =>
                resolve({
                  success: true,
                  value: mockRecords,
                }),
              1000
            );
          })
      );

    render(<CalendarPage />);

    // ローディングインジケーターが表示されることを確認
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
