/**
 * ハーバーフィルター機能のテスト
 *
 * テスト対象:
 * - FilterModalコンポーネント（時間帯フィルター選択UI)
 * - HarborServiceのgetFeedメソッド（時間帯フィルター適用）
 * - HarborPageでのフィルター統合
 */

import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from '@jest/globals';
import FilterModal from '@/app/harbor/components/FilterModal';
import { HarborService } from '@/lib/services/harbor';
import type { TimeOfDay } from '@/lib/types/mood-record';
import type { HarborFilters } from '@/lib/types/harbor';

describe('FilterModal', () => {
  it('時間帯フィルター選択肢を表示する', () => {
    const mockOnApply = jest.fn();
    const mockOnClose = jest.fn();

    render(
      <FilterModal
        isOpen={true}
        onClose={mockOnClose}
        onApply={mockOnApply}
        currentFilter={null}
      />
    );

    // 時間帯選択肢が表示されていることを確認
    expect(screen.getByText('朝')).toBeInTheDocument();
    expect(screen.getByText('昼')).toBeInTheDocument();
    expect(screen.getByText('夕')).toBeInTheDocument();
    expect(screen.getByText('夜')).toBeInTheDocument();
    expect(screen.getByText('すべて表示')).toBeInTheDocument();
  });

  it('時間帯を選択すると適用ボタンが有効になる', async () => {
    const mockOnApply = jest.fn();
    const mockOnClose = jest.fn();

    render(
      <FilterModal
        isOpen={true}
        onClose={mockOnClose}
        onApply={mockOnApply}
        currentFilter={null}
      />
    );

    // 初期状態では適用ボタンが無効
    const applyButton = screen.getByRole('button', { name: /適用/i });

    // 「朝」を選択
    const morningOption = screen.getByText('朝');
    fireEvent.click(morningOption);

    // 適用ボタンをクリック
    fireEvent.click(applyButton);

    await waitFor(() => {
      expect(mockOnApply).toHaveBeenCalledWith('morning');
    });
  });

  it('「すべて表示」を選択するとnullが渡される', async () => {
    const mockOnApply = jest.fn();
    const mockOnClose = jest.fn();

    render(
      <FilterModal
        isOpen={true}
        onClose={mockOnClose}
        onApply={mockOnApply}
        currentFilter="morning"
      />
    );

    // 「すべて表示」を選択
    const allOption = screen.getByText('すべて表示');
    fireEvent.click(allOption);

    const applyButton = screen.getByRole('button', { name: /適用/i });
    fireEvent.click(applyButton);

    await waitFor(() => {
      expect(mockOnApply).toHaveBeenCalledWith(null);
    });
  });

  it('現在のフィルターが選択状態として表示される', () => {
    const mockOnApply = jest.fn();
    const mockOnClose = jest.fn();

    render(
      <FilterModal
        isOpen={true}
        onClose={mockOnClose}
        onApply={mockOnApply}
        currentFilter="afternoon"
      />
    );

    // 「昼」が選択状態として表示されていることを確認
    const afternoonOption = screen.getByText('昼');
    expect(afternoonOption).toHaveClass('bg-blue-100'); // 選択状態のスタイル
  });

  it('閉じるボタンでモーダルが閉じる', () => {
    const mockOnApply = jest.fn();
    const mockOnClose = jest.fn();

    render(
      <FilterModal
        isOpen={true}
        onClose={mockOnClose}
        onApply={mockOnApply}
        currentFilter={null}
      />
    );

    const closeButton = screen.getByRole('button', { name: /閉じる/i });
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });
});

describe('HarborService - time_of_dayフィルター', () => {
  it('時間帯フィルターを適用してフィードを取得できる', async () => {
    // モックSupabaseクライアント
    const mockFrom = jest.fn();
    const mockSelect = jest.fn();
    const mockEq = jest.fn();
    const mockEq2 = jest.fn(); // time_of_day用の追加eq
    const mockGt = jest.fn();
    const mockOrder = jest.fn();
    const mockRange = jest.fn();

    // モックチェーン
    mockRange.mockResolvedValue({
      data: [
        {
          id: '1',
          user_id: 'user1',
          mood_record_id: 'record1',
          share_type: 'support_needed',
          feeling: 'とても辛い',
          message: 'テストメッセージ',
          reaction_count: 0,
          created_at: '2025-01-19T09:00:00Z',
          expires_at: '2025-01-20T09:00:00Z',
          profiles: {
            nickname: 'テストユーザー',
            avatar_id: 'avatar1',
          },
          mood_records: {
            time_of_day: 'morning',
          },
        },
      ],
      error: null,
    });

    mockOrder.mockReturnValue({ range: mockRange });
    mockGt.mockReturnValue({ eq: mockEq2, order: mockOrder });
    mockEq2.mockReturnValue({ order: mockOrder });
    mockEq.mockReturnValue({ gt: mockGt });
    mockSelect.mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ select: mockSelect });

    const mockSupabase = {
      from: mockFrom,
    } as any;

    const harborService = new HarborService(mockSupabase);

    const filters: HarborFilters = {
      share_type: 'support_needed',
      time_of_day: 'morning',
      sort_by: 'newest',
      limit: 20,
      offset: 0,
    };

    const result = await harborService.getFeed(filters);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toHaveLength(1);
      expect(result.value[0].user.nickname).toBe('テストユーザー');
    }
  });

  it('時間帯フィルターなしでフィードを取得できる', async () => {
    const mockFrom = jest.fn();
    const mockSelect = jest.fn();
    const mockEq = jest.fn();
    const mockGt = jest.fn();
    const mockOrder = jest.fn();
    const mockRange = jest.fn();

    mockRange.mockResolvedValue({
      data: [
        {
          id: '1',
          user_id: 'user1',
          mood_record_id: 'record1',
          share_type: 'joy_share',
          feeling: 'すごく嬉しい！',
          message: null,
          reaction_count: 3,
          created_at: '2025-01-19T14:00:00Z',
          expires_at: '2025-01-20T14:00:00Z',
          profiles: {
            nickname: 'ユーザー2',
            avatar_id: 'avatar2',
          },
        },
      ],
      error: null,
    });

    mockOrder.mockReturnValue({ range: mockRange });
    mockGt.mockReturnValue({ order: mockOrder });
    mockEq.mockReturnValue({ gt: mockGt });
    mockSelect.mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ select: mockSelect });

    const mockSupabase = {
      from: mockFrom,
    } as any;

    const harborService = new HarborService(mockSupabase);

    const filters: HarborFilters = {
      share_type: 'joy_share',
      sort_by: 'newest',
      limit: 20,
      offset: 0,
    };

    const result = await harborService.getFeed(filters);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toHaveLength(1);
    }
  });
});
