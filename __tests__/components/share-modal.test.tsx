/**
 * ShareModalコンポーネントのテスト
 *
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.9
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ShareModal } from '@/app/record/components/share-modal';
import { createShareAction } from '@/lib/actions/share';

// Server Actionsのモック
jest.mock('@/lib/actions/share');

const mockCreateShareAction = createShareAction as jest.MockedFunction<
  typeof createShareAction
>;

describe('ShareModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();
  const mockRecordId = 'test-record-id';
  const mockUserId = 'test-user-id';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('初期表示', () => {
    it('シェア種類選択画面が表示される', async () => {
      render(
        <ShareModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          recordId={mockRecordId}
          userId={mockUserId}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('シェアする')).toBeInTheDocument();
      });

      expect(screen.getByText(/励まし募集/)).toBeInTheDocument();
      expect(screen.getByText(/喜びシェア/)).toBeInTheDocument();
      expect(screen.getByText(/頑張った報告/)).toBeInTheDocument();
    });

    it('閉じるボタンが表示される', () => {
      render(
        <ShareModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          recordId={mockRecordId}
          userId={mockUserId}
        />
      );

      const closeButton = screen.getByLabelText('閉じる');
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('シェア種類選択', () => {
    it('励まし募集を選択すると気持ち選択画面へ遷移する', async () => {
      render(
        <ShareModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          recordId={mockRecordId}
          userId={mockUserId}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/励まし募集/)).toBeInTheDocument();
      });

      const supportButton = screen.getByText(/励まし募集/);
      fireEvent.click(supportButton);

      await waitFor(() => {
        expect(screen.getByText('どんな気持ち?')).toBeInTheDocument();
      });

      expect(screen.getByText('とても辛い')).toBeInTheDocument();
      expect(screen.getByText('疲れた')).toBeInTheDocument();
      expect(screen.getByText('不安')).toBeInTheDocument();
      expect(screen.getByText('モヤモヤする')).toBeInTheDocument();
    });

    it('喜びシェアを選択すると気持ち選択画面へ遷移する', async () => {
      render(
        <ShareModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          recordId={mockRecordId}
          userId={mockUserId}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/喜びシェア/)).toBeInTheDocument();
      });

      const joyButton = screen.getByText(/喜びシェア/);
      fireEvent.click(joyButton);

      await waitFor(() => {
        expect(screen.getByText('どんな気持ち?')).toBeInTheDocument();
      });

      expect(screen.getByText('すごく嬉しい!')).toBeInTheDocument();
      expect(screen.getByText('良いことがあった')).toBeInTheDocument();
      expect(screen.getByText('幸せ')).toBeInTheDocument();
      expect(screen.getByText('充実してる')).toBeInTheDocument();
    });

    it('頑張った報告を選択すると気持ち選択画面へ遷移する', async () => {
      render(
        <ShareModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          recordId={mockRecordId}
          userId={mockUserId}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/頑張った報告/)).toBeInTheDocument();
      });

      const achievementButton = screen.getByText(/頑張った報告/);
      fireEvent.click(achievementButton);

      await waitFor(() => {
        expect(screen.getByText('どんな気持ち?')).toBeInTheDocument();
      });

      expect(screen.getByText('やり切った!')).toBeInTheDocument();
      expect(screen.getByText('勉強頑張った')).toBeInTheDocument();
      expect(screen.getByText('体動かした')).toBeInTheDocument();
      expect(screen.getByText('目標達成')).toBeInTheDocument();
    });
  });

  describe('気持ち選択', () => {
    beforeEach(async () => {
      render(
        <ShareModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          recordId={mockRecordId}
          userId={mockUserId}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/励まし募集/)).toBeInTheDocument();
      });

      const supportButton = screen.getByText(/励まし募集/);
      fireEvent.click(supportButton);

      await waitFor(() => {
        expect(screen.getByText('どんな気持ち?')).toBeInTheDocument();
      });
    });

    it('気持ちを選択すると一言入力画面へ遷移する', async () => {
      const feelingButton = screen.getByText('とても辛い');
      fireEvent.click(feelingButton);

      await waitFor(() => {
        expect(screen.getByText('一言メッセージ (任意)')).toBeInTheDocument();
      });

      expect(screen.getByPlaceholderText('10文字以内')).toBeInTheDocument();
    });

    it('スキップボタンで一言入力画面へ遷移する', async () => {
      const skipButton = screen.getByText('スキップ');
      fireEvent.click(skipButton);

      await waitFor(() => {
        expect(screen.getByText('一言メッセージ (任意)')).toBeInTheDocument();
      });
    });

    it('戻るボタンでシェア種類選択画面へ戻る', async () => {
      const backButton = screen.getByLabelText('戻る');
      fireEvent.click(backButton);

      await waitFor(() => {
        expect(screen.getByText('シェアする')).toBeInTheDocument();
      });

      expect(screen.getByText(/励まし募集/)).toBeInTheDocument();
    });
  });

  describe('一言入力', () => {
    beforeEach(async () => {
      render(
        <ShareModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          recordId={mockRecordId}
          userId={mockUserId}
        />
      );

      // シェア種類 → 気持ち選択 → 一言入力画面へ
      await waitFor(() => {
        expect(screen.getByText(/励まし募集/)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/励まし募集/));

      await waitFor(() => {
        expect(screen.getByText('とても辛い')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('とても辛い'));

      await waitFor(() => {
        expect(screen.getByText('一言メッセージ (任意)')).toBeInTheDocument();
      });
    });

    it('一言メッセージを入力できる', () => {
      const input = screen.getByPlaceholderText(
        '10文字以内'
      ) as HTMLInputElement;
      fireEvent.change(input, { target: { value: 'テスト' } });

      expect(input.value).toBe('テスト');
    });

    it('10文字を超える入力は制限される', () => {
      const input = screen.getByPlaceholderText(
        '10文字以内'
      ) as HTMLInputElement;
      fireEvent.change(input, { target: { value: '12345678901' } });

      expect(input.value.length).toBeLessThanOrEqual(10);
    });

    it('文字数カウントが表示される', () => {
      const input = screen.getByPlaceholderText(
        '10文字以内'
      ) as HTMLInputElement;
      fireEvent.change(input, { target: { value: 'テスト' } });

      expect(screen.getByText('3/10')).toBeInTheDocument();
    });

    it('定型文ボタンが表示される', () => {
      expect(screen.getByText('助けてください')).toBeInTheDocument();
      expect(screen.getByText('辛いです')).toBeInTheDocument();
      expect(screen.getByText('話を聞いて')).toBeInTheDocument();
    });

    it('定型文ボタンをクリックするとメッセージが入力される', () => {
      const templateButton = screen.getByText('助けてください');
      fireEvent.click(templateButton);

      const input = screen.getByPlaceholderText(
        '10文字以内'
      ) as HTMLInputElement;
      expect(input.value).toBe('助けてください');
    });

    it('投稿ボタンをクリックするとシェアが作成される', async () => {
      mockCreateShareAction.mockResolvedValue({
        success: true,
        value: {
          id: 'share-id',
          user_id: mockUserId,
          mood_record_id: mockRecordId,
          share_type: 'support_needed',
          feeling: 'とても辛い',
          message: null,
          reaction_count: 0,
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
      });

      const postButton = screen.getByText('投稿する');
      fireEvent.click(postButton);

      await waitFor(() => {
        expect(mockCreateShareAction).toHaveBeenCalledWith({
          user_id: mockUserId,
          mood_record_id: mockRecordId,
          share_type: 'support_needed',
          feeling: 'とても辛い',
          message: undefined,
        });
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it('スキップボタンでメッセージなしで投稿できる', async () => {
      mockCreateShareAction.mockResolvedValue({
        success: true,
        value: {
          id: 'share-id',
          user_id: mockUserId,
          mood_record_id: mockRecordId,
          share_type: 'support_needed',
          feeling: 'とても辛い',
          message: null,
          reaction_count: 0,
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
      });

      const skipButton = screen.getByText('スキップして投稿');
      fireEvent.click(skipButton);

      await waitFor(() => {
        expect(mockCreateShareAction).toHaveBeenCalledWith({
          user_id: mockUserId,
          mood_record_id: mockRecordId,
          share_type: 'support_needed',
          feeling: 'とても辛い',
          message: undefined,
        });
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it('投稿エラー時にエラーメッセージが表示される', async () => {
      mockCreateShareAction.mockResolvedValue({
        success: false,
        error: {
          type: 'MESSAGE_TOO_LONG',
          max: 10,
        },
      });

      const postButton = screen.getByText('投稿する');
      fireEvent.click(postButton);

      await waitFor(() => {
        expect(
          screen.getByText('メッセージは10文字以内にしてください')
        ).toBeInTheDocument();
      });
    });
  });

  describe('モーダル制御', () => {
    it('isOpenがfalseの時は表示されない', () => {
      render(
        <ShareModal
          isOpen={false}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          recordId={mockRecordId}
          userId={mockUserId}
        />
      );

      expect(screen.queryByText('シェアする')).not.toBeInTheDocument();
    });

    it('閉じるボタンでonCloseが呼ばれる', () => {
      render(
        <ShareModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          recordId={mockRecordId}
          userId={mockUserId}
        />
      );

      const closeButton = screen.getByLabelText('閉じる');
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});
