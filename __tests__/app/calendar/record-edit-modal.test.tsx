/**
 * 記録編集モーダルのテスト
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import RecordEditModal from '@/app/calendar/components/RecordEditModal';
import type { MoodRecord } from '@/lib/types/mood-record';

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

describe('RecordEditModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSave = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('表示内容', () => {
    it('モーダルが正しく表示される', () => {
      render(
        <RecordEditModal
          record={mockRecord}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      // タイトルが表示される
      expect(screen.getByText('記録の編集')).toBeInTheDocument();

      // 気分レベルが選択されている
      const moodLevelButtons = screen.getAllByRole('button', { name: /😊|🙂|😐|😔|😢/ });
      expect(moodLevelButtons).toHaveLength(5);

      // 理由カテゴリーが選択されている
      expect(screen.getByText('勉強・学校')).toBeInTheDocument();
      expect(screen.getByText('趣味・遊び')).toBeInTheDocument();

      // メモが表示される
      const memoInput = screen.getByDisplayValue('テストメモ');
      expect(memoInput).toBeInTheDocument();
    });

    it('isOpen=falseの時は何も表示されない', () => {
      const { container } = render(
        <RecordEditModal
          record={mockRecord}
          isOpen={false}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe('編集操作', () => {
    it('気分レベルを変更できる', async () => {
      render(
        <RecordEditModal
          record={mockRecord}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      // 「とても良い」を選択
      const veryGoodButton = screen.getByRole('button', { name: /😊/ });
      fireEvent.click(veryGoodButton);

      // 保存ボタンをクリック
      const saveButton = screen.getByRole('button', { name: /保存/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          mockRecord.id,
          expect.objectContaining({
            mood_level: 5,
          })
        );
      });
    });

    it('理由カテゴリーを変更できる', async () => {
      render(
        <RecordEditModal
          record={mockRecord}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      // 既存の理由を1つ解除（「勉強・学校」）
      const studyButton = screen.getByText('勉強・学校');
      fireEvent.click(studyButton);

      // 「人間関係」を選択
      const relationshipsButton = screen.getByText('人間関係');
      fireEvent.click(relationshipsButton);

      // 保存ボタンをクリック
      const saveButton = screen.getByRole('button', { name: /保存/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          mockRecord.id,
          expect.objectContaining({
            reasons: expect.arrayContaining(['relationships', 'hobbies']),
          })
        );
      });
    });

    it('メモを変更できる', async () => {
      render(
        <RecordEditModal
          record={mockRecord}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const memoInput = screen.getByDisplayValue('テストメモ');
      fireEvent.change(memoInput, { target: { value: '新しいメモ' } });

      // 保存ボタンをクリック
      const saveButton = screen.getByRole('button', { name: /保存/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          mockRecord.id,
          expect.objectContaining({
            memo: '新しいメモ',
          })
        );
      });
    });

    it('メモが10文字を超えるとエラーが表示される', () => {
      render(
        <RecordEditModal
          record={mockRecord}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const memoInput = screen.getByDisplayValue('テストメモ');
      fireEvent.change(memoInput, {
        target: { value: '12345678901' },
      });

      expect(
        screen.getByText('メモは10文字以内で入力してください')
      ).toBeInTheDocument();
    });

    it('理由カテゴリーを3つ以上選択しようとするとエラーが表示される', () => {
      render(
        <RecordEditModal
          record={mockRecord}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      // 3つ目の理由を選択しようとする
      const healthButton = screen.getByText('体調・健康');
      fireEvent.click(healthButton);

      expect(
        screen.getByText('理由は最大2つまで選択できます')
      ).toBeInTheDocument();
    });
  });

  describe('アクション', () => {
    it('キャンセルボタンをクリックするとonCloseが呼ばれる', () => {
      render(
        <RecordEditModal
          record={mockRecord}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /キャンセル/i });
      fireEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('保存ボタンをクリックするとonSaveが呼ばれる', async () => {
      render(
        <RecordEditModal
          record={mockRecord}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const saveButton = screen.getByRole('button', { name: /保存/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('アクセシビリティ', () => {
    it('適切なARIA属性が設定されている', () => {
      render(
        <RecordEditModal
          record={mockRecord}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute('aria-label', '記録の編集');
    });

    it('ESCキーでモーダルを閉じられる', () => {
      render(
        <RecordEditModal
          record={mockRecord}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const dialog = screen.getByRole('dialog');
      fireEvent.keyDown(dialog, { key: 'Escape', code: 'Escape' });

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });
});
