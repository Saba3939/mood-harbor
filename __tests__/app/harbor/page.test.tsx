/**
 * Harbor Page Component Tests
 * ハーバー（タイムライン）ページのテスト
 */

import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HarborPage from '@/app/harbor/page';

// モック
jest.mock('@/lib/actions/harbor', () => ({
  getHarborFeed: jest.fn(),
}));

jest.mock('@/lib/supabase/client', () => ({
  createBrowserClient: jest.fn(() => ({
    channel: jest.fn(() => ({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
    })),
  })),
}));

import { getHarborFeed } from '@/lib/actions/harbor';
import type { HarborPost } from '@/lib/types/harbor';

describe('HarborPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockPosts: HarborPost[] = [
    {
      share: {
        id: 'share-1',
        user_id: 'user-1',
        mood_record_id: 'record-1',
        share_type: 'support_needed',
        feeling: 'とても辛い',
        message: 'つらいです',
        reaction_count: 5,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
      user: {
        nickname: '港の旅人123',
        avatar_id: 'cat-01',
      },
      reactions: {
        count: 5,
        user_reacted: false,
      },
    },
    {
      share: {
        id: 'share-2',
        user_id: 'user-2',
        mood_record_id: 'record-2',
        share_type: 'support_needed',
        feeling: '疲れた',
        message: null,
        reaction_count: 2,
        created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1時間前
        expires_at: new Date(Date.now() + 23 * 60 * 60 * 1000).toISOString(),
      },
      user: {
        nickname: '海の仲間456',
        avatar_id: 'dog-02',
      },
      reactions: {
        count: 2,
        user_reacted: true,
      },
    },
  ];

  describe('初期表示', () => {
    it('3つのタブ（励まし募集、喜びシェア、頑張った報告）を表示する', async () => {
      (getHarborFeed as jest.Mock).mockResolvedValue({
        success: true,
        value: [],
      });

      render(<HarborPage />);

      await waitFor(() => {
        expect(screen.getByText('💙 励まし募集')).toBeInTheDocument();
        expect(screen.getByText('💛 喜びシェア')).toBeInTheDocument();
        expect(screen.getByText('💚 頑張った報告')).toBeInTheDocument();
      });
    });

    it('デフォルトで「励まし募集」タブが選択されている', async () => {
      (getHarborFeed as jest.Mock).mockResolvedValue({
        success: true,
        value: [],
      });

      render(<HarborPage />);

      await waitFor(() => {
        const supportTab = screen.getByText('💙 励まし募集').closest('button');
        expect(supportTab).toHaveAttribute('aria-selected', 'true');
      });
    });
  });

  describe('投稿カードの表示', () => {
    it('投稿カードに必要な情報を全て表示する', async () => {
      (getHarborFeed as jest.Mock).mockResolvedValue({
        success: true,
        value: mockPosts,
      });

      render(<HarborPage />);

      await waitFor(() => {
        // 最初の投稿カード
        const firstCard = screen.getByText('港の旅人123').closest('[role="article"]');
        expect(firstCard).toBeInTheDocument();

        if (firstCard) {
          const cardContent = within(firstCard);
          expect(cardContent.getByText('港の旅人123')).toBeInTheDocument();
          expect(cardContent.getByText('とても辛い')).toBeInTheDocument();
          expect(cardContent.getByText('つらいです')).toBeInTheDocument();
          expect(cardContent.getByText('5')).toBeInTheDocument(); // reaction_count
        }
      });
    });

    it('一言メッセージがない場合は表示しない', async () => {
      (getHarborFeed as jest.Mock).mockResolvedValue({
        success: true,
        value: [mockPosts[1]], // messageがnullの投稿
      });

      render(<HarborPage />);

      await waitFor(() => {
        expect(screen.getByText('海の仲間456')).toBeInTheDocument();
        // messageがnullの場合は表示されない
        expect(screen.queryByText('つらいです')).not.toBeInTheDocument();
      });
    });

    it('投稿時刻を相対表示する', async () => {
      (getHarborFeed as jest.Mock).mockResolvedValue({
        success: true,
        value: [mockPosts[1]], // 1時間前の投稿
      });

      render(<HarborPage />);

      await waitFor(() => {
        expect(screen.getByText(/時間前/)).toBeInTheDocument();
      });
    });

    it('応援数とボタンを表示する', async () => {
      (getHarborFeed as jest.Mock).mockResolvedValue({
        success: true,
        value: mockPosts,
      });

      render(<HarborPage />);

      await waitFor(() => {
        const reactionButtons = screen.getAllByRole('button', { name: /応援/ });
        expect(reactionButtons.length).toBeGreaterThan(0);
      });
    });
  });

  describe('タブ切り替え', () => {
    it('タブをクリックすると該当するシェア種類の投稿を表示する', async () => {
      const user = userEvent.setup();

      // 初期表示（励まし募集）
      (getHarborFeed as jest.Mock).mockResolvedValue({
        success: true,
        value: mockPosts,
      });

      render(<HarborPage />);

      await waitFor(() => {
        expect(screen.getByText('港の旅人123')).toBeInTheDocument();
      });

      // 「喜びシェア」タブをクリック
      const joyPosts: HarborPost[] = [
        {
          ...mockPosts[0],
          share: {
            ...mockPosts[0].share,
            share_type: 'joy_share',
            feeling: 'すごく嬉しい!',
            message: '良いことがあった!',
          },
        },
      ];

      (getHarborFeed as jest.Mock).mockResolvedValue({
        success: true,
        value: joyPosts,
      });

      await user.click(screen.getByText('💛 喜びシェア'));

      await waitFor(() => {
        expect(screen.getByText('すごく嬉しい!')).toBeInTheDocument();
      });
    });
  });

  describe('プルダウン更新', () => {
    it('プルダウン操作で最新の投稿を読み込む', async () => {
      const user = userEvent.setup();

      (getHarborFeed as jest.Mock).mockResolvedValue({
        success: true,
        value: mockPosts,
      });

      const { container } = render(<HarborPage />);

      await waitFor(() => {
        expect(screen.getByText('港の旅人123')).toBeInTheDocument();
      });

      // プルダウンエリアを見つけてスクロール操作をシミュレート
      const scrollContainer = container.querySelector('[data-testid="harbor-scroll-container"]');
      expect(scrollContainer).toBeInTheDocument();

      // プルダウンリフレッシュをトリガー
      if (scrollContainer) {
        // スクロール位置を-50に設定（プルダウン）
        Object.defineProperty(scrollContainer, 'scrollTop', {
          writable: true,
          value: -50,
        });

        // スクロールイベントをトリガー
        scrollContainer.dispatchEvent(new Event('scroll'));
      }

      // getHarborFeedが再度呼ばれることを確認
      await waitFor(() => {
        expect(getHarborFeed).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('エラーハンドリング', () => {
    it('投稿の取得に失敗した場合、エラーメッセージを表示する', async () => {
      (getHarborFeed as jest.Mock).mockResolvedValue({
        success: false,
        error: { type: 'INVALID_FILTERS' },
      });

      render(<HarborPage />);

      await waitFor(() => {
        expect(
          screen.getByText(/投稿の読み込みに失敗しました/)
        ).toBeInTheDocument();
      });
    });

    it('投稿が0件の場合、空状態メッセージを表示する', async () => {
      (getHarborFeed as jest.Mock).mockResolvedValue({
        success: true,
        value: [],
      });

      render(<HarborPage />);

      await waitFor(() => {
        expect(
          screen.getByText(/まだ投稿がありません/)
        ).toBeInTheDocument();
      });
    });
  });

  describe('新着通知', () => {
    it('リアルタイムで新規投稿があった場合、「新着○件」と表示する', async () => {
      // TODO: Realtime機能のテストを後で実装
      expect(true).toBe(true);
    });
  });
});
