/**
 * 記録詳細モーダルのテスト
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import RecordDetailModal from '@/app/calendar/components/RecordDetailModal';
import type { MoodRecord } from '@/lib/types/mood-record';
import type { DailyQuestion } from '@/lib/types/daily-question';

// モックデータ
const mockRecord: MoodRecord = {
  id: 'test-record-id',
  user_id: 'test-user-id',
  mood_level: 4,
  reasons: ['study_school', 'hobbies'],
  question_id: 'test-question-id',
  answer_option: '楽しかった',
  memo: 'テストメモ',
  time_of_day: 'evening',
  weather: 'sunny',
  created_at: '2026-01-15T10:00:00Z',
  updated_at: '2026-01-15T10:00:00Z',
};

const mockQuestion: DailyQuestion = {
  id: 'test-question-id',
  category: 'feeling',
  question_text: '今日の気持ちは?',
  options: ['楽しかった', '普通だった', '疲れた'],
  created_at: '2026-01-01T00:00:00Z',
};

describe('RecordDetailModal', () => {
  const mockOnClose = jest.fn();
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('表示内容', () => {
    it('モーダルが正しく表示される', () => {
      render(
        <RecordDetailModal
          record={mockRecord}
          question={mockQuestion}
          isOpen={true}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      // 気分アイコンと気分レベルが表示される
      expect(screen.getByText('🙂')).toBeInTheDocument();
      expect(screen.getByText('良い')).toBeInTheDocument();

      // 理由カテゴリーが表示される
      expect(screen.getByText('勉強・学校')).toBeInTheDocument();
      expect(screen.getByText('趣味・遊び')).toBeInTheDocument();

      // 質問と回答が表示される
      expect(screen.getByText('今日の気持ちは?')).toBeInTheDocument();
      expect(screen.getByText('楽しかった')).toBeInTheDocument();

      // メモが表示される
      expect(screen.getByText('テストメモ')).toBeInTheDocument();

      // 時間帯が表示される
      expect(screen.getByText('夕方')).toBeInTheDocument();

      // 天気が表示される
      expect(screen.getByText('☀️ 晴れ')).toBeInTheDocument();
    });

    it('オプション項目がない場合でも正しく表示される', () => {
      const recordWithoutOptionals: MoodRecord = {
        ...mockRecord,
        memo: null,
        time_of_day: null,
        weather: null,
      };

      render(
        <RecordDetailModal
          record={recordWithoutOptionals}
          question={mockQuestion}
          isOpen={true}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      // メモセクションが表示されない
      expect(screen.queryByText('メモ')).not.toBeInTheDocument();

      // 時間帯と天気セクションが表示されない
      expect(screen.queryByText('時間帯')).not.toBeInTheDocument();
      expect(screen.queryByText('天気')).not.toBeInTheDocument();
    });

    it('isOpen=falseの時は何も表示されない', () => {
      const { container } = render(
        <RecordDetailModal
          record={mockRecord}
          question={mockQuestion}
          isOpen={false}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe('アクション', () => {
    it('閉じるボタンをクリックするとonCloseが呼ばれる', () => {
      render(
        <RecordDetailModal
          record={mockRecord}
          question={mockQuestion}
          isOpen={true}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const closeButton = screen.getByRole('button', { name: /閉じる/i });
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('編集ボタンをクリックするとonEditが呼ばれる', () => {
      render(
        <RecordDetailModal
          record={mockRecord}
          question={mockQuestion}
          isOpen={true}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const editButton = screen.getByRole('button', { name: /編集/i });
      fireEvent.click(editButton);

      expect(mockOnEdit).toHaveBeenCalledTimes(1);
      expect(mockOnEdit).toHaveBeenCalledWith(mockRecord);
    });

    it('削除ボタンをクリックすると確認ダイアログが表示される', () => {
      render(
        <RecordDetailModal
          record={mockRecord}
          question={mockQuestion}
          isOpen={true}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const deleteButton = screen.getByRole('button', { name: /削除/i });
      fireEvent.click(deleteButton);

      // 確認ダイアログが表示される
      expect(
        screen.getByText(/この記録を削除しますか/)
      ).toBeInTheDocument();
    });

    it('削除確認ダイアログでキャンセルを選ぶとダイアログが閉じる', () => {
      render(
        <RecordDetailModal
          record={mockRecord}
          question={mockQuestion}
          isOpen={true}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      // 削除ボタンをクリック
      const deleteButton = screen.getByRole('button', { name: /削除/i });
      fireEvent.click(deleteButton);

      // キャンセルボタンをクリック
      const cancelButton = screen.getByRole('button', { name: /キャンセル/i });
      fireEvent.click(cancelButton);

      // 確認ダイアログが閉じる
      expect(
        screen.queryByText(/この記録を削除しますか/)
      ).not.toBeInTheDocument();

      // onDeleteは呼ばれない
      expect(mockOnDelete).not.toHaveBeenCalled();
    });

    it('削除確認ダイアログで削除を選ぶとonDeleteが呼ばれる', async () => {
      render(
        <RecordDetailModal
          record={mockRecord}
          question={mockQuestion}
          isOpen={true}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      // 削除ボタンをクリック
      const deleteButton = screen.getByRole('button', { name: /削除/i });
      fireEvent.click(deleteButton);

      // 削除実行ボタンをクリック
      const confirmButton = screen.getByRole('button', {
        name: /削除する/i,
      });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockOnDelete).toHaveBeenCalledTimes(1);
        expect(mockOnDelete).toHaveBeenCalledWith(mockRecord.id);
      });
    });

    it('背景をクリックするとonCloseが呼ばれる', () => {
      render(
        <RecordDetailModal
          record={mockRecord}
          question={mockQuestion}
          isOpen={true}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const backdrop = screen.getByTestId('modal-backdrop');
      fireEvent.click(backdrop);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('アクセシビリティ', () => {
    it('適切なARIA属性が設定されている', () => {
      render(
        <RecordDetailModal
          record={mockRecord}
          question={mockQuestion}
          isOpen={true}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      // dialogロールが存在する
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();

      // aria-labelが設定されている
      expect(dialog).toHaveAttribute('aria-label', '記録の詳細');
    });

    it('キーボード操作でモーダルを閉じられる', () => {
      render(
        <RecordDetailModal
          record={mockRecord}
          question={mockQuestion}
          isOpen={true}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const dialog = screen.getByRole('dialog');
      fireEvent.keyDown(dialog, { key: 'Escape', code: 'Escape' });

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });
});
