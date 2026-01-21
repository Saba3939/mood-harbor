/**
 * 気分記録ステップ2: 理由選択UIのテスト
 *
 * Requirements: 3.2, 3.3, 3.8, 21.1, 21.4
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RecordPage from '@/app/record/page';
import { useMoodRecordStore } from '@/lib/stores/mood-record-store';

describe('RecordPage - ステップ2: 理由選択', () => {
  beforeEach(() => {
    // ストアをリセット
    useMoodRecordStore.getState().resetForm();
  });

  describe('表示テスト', () => {
    it('ステップ2で8つの理由カテゴリーが表示される', async () => {
      // ステップ2に移行
      const store = useMoodRecordStore.getState();
      store.setMoodLevel(3);
      store.nextStep();

      render(<RecordPage />);

      await waitFor(() => {
        expect(screen.getByText('理由は何ですか？')).toBeInTheDocument();
      });

      // 8つの理由カテゴリーを確認
      expect(screen.getByText('勉強・学校')).toBeInTheDocument();
      expect(screen.getByText('人間関係')).toBeInTheDocument();
      expect(screen.getByText('体調・健康')).toBeInTheDocument();
      expect(screen.getByText('趣味・遊び')).toBeInTheDocument();
      expect(screen.getByText('バイト・仕事')).toBeInTheDocument();
      expect(screen.getByText('家族・家のこと')).toBeInTheDocument();
      expect(screen.getByText('睡眠')).toBeInTheDocument();
      expect(screen.getByText('特に理由なし')).toBeInTheDocument();
    });

    it('ステップインジケーターがステップ2を示している', async () => {
      const store = useMoodRecordStore.getState();
      store.setMoodLevel(3);
      store.nextStep();

      render(<RecordPage />);

      await waitFor(() => {
        const indicator = screen.getByLabelText('ステップ2: 理由選択 (現在)');
        expect(indicator).toBeInTheDocument();
      });
    });
  });

  describe('選択機能テスト', () => {
    it('理由カテゴリーを1つ選択できる', async () => {
      const user = userEvent.setup();
      const store = useMoodRecordStore.getState();
      store.setMoodLevel(3);
      store.nextStep();

      render(<RecordPage />);

      await waitFor(() => {
        expect(screen.getByText('理由は何ですか？')).toBeInTheDocument();
      });

      const studyButton = screen.getByRole('button', { name: /勉強・学校/ });
      await user.click(studyButton);

      // 選択状態を確認
      expect(studyButton).toHaveAttribute('aria-pressed', 'true');
      expect(useMoodRecordStore.getState().selectedReasons).toEqual([
        'study_school',
      ]);
    });

    it('理由カテゴリーを2つまで選択できる', async () => {
      const user = userEvent.setup();
      const store = useMoodRecordStore.getState();
      store.setMoodLevel(3);
      store.nextStep();

      render(<RecordPage />);

      await waitFor(() => {
        expect(screen.getByText('理由は何ですか？')).toBeInTheDocument();
      });

      const studyButton = screen.getByRole('button', { name: /勉強・学校/ });
      const relationshipButton = screen.getByRole('button', {
        name: /人間関係/,
      });

      await user.click(studyButton);
      await user.click(relationshipButton);

      // 選択状態を確認
      expect(studyButton).toHaveAttribute('aria-pressed', 'true');
      expect(relationshipButton).toHaveAttribute('aria-pressed', 'true');
      expect(useMoodRecordStore.getState().selectedReasons).toEqual([
        'study_school',
        'relationships',
      ]);
    });

    it('理由カテゴリーを3つ以上は選択できない', async () => {
      const user = userEvent.setup();
      const store = useMoodRecordStore.getState();
      store.setMoodLevel(3);
      store.nextStep();

      render(<RecordPage />);

      await waitFor(() => {
        expect(screen.getByText('理由は何ですか？')).toBeInTheDocument();
      });

      const studyButton = screen.getByRole('button', { name: /勉強・学校/ });
      const relationshipButton = screen.getByRole('button', {
        name: /人間関係/,
      });
      const healthButton = screen.getByRole('button', { name: /体調・健康/ });

      await user.click(studyButton);
      await user.click(relationshipButton);
      await user.click(healthButton);

      // 2つまでしか選択されない
      expect(useMoodRecordStore.getState().selectedReasons).toHaveLength(2);
      expect(useMoodRecordStore.getState().selectedReasons).not.toContain(
        'health'
      );
    });

    it('選択した理由カテゴリーを解除できる', async () => {
      const user = userEvent.setup();
      const store = useMoodRecordStore.getState();
      store.setMoodLevel(3);
      store.nextStep();

      render(<RecordPage />);

      await waitFor(() => {
        expect(screen.getByText('理由は何ですか？')).toBeInTheDocument();
      });

      const studyButton = screen.getByRole('button', { name: /勉強・学校/ });

      // 選択
      await user.click(studyButton);
      expect(useMoodRecordStore.getState().selectedReasons).toContain(
        'study_school'
      );

      // 解除
      await user.click(studyButton);
      expect(useMoodRecordStore.getState().selectedReasons).not.toContain(
        'study_school'
      );
    });
  });

  describe('バリデーションテスト', () => {
    it('理由未選択時に次へボタンが無効化される', async () => {
      const store = useMoodRecordStore.getState();
      store.setMoodLevel(3);
      store.nextStep();

      render(<RecordPage />);

      await waitFor(() => {
        expect(screen.getByText('理由は何ですか？')).toBeInTheDocument();
      });

      const nextButton = screen.getByRole('button', { name: /次へ/ });
      expect(nextButton).toBeDisabled();
    });

    it('理由選択後に次へボタンが有効化される', async () => {
      const user = userEvent.setup();
      const store = useMoodRecordStore.getState();
      store.setMoodLevel(3);
      store.nextStep();

      render(<RecordPage />);

      await waitFor(() => {
        expect(screen.getByText('理由は何ですか？')).toBeInTheDocument();
      });

      const studyButton = screen.getByRole('button', { name: /勉強・学校/ });
      await user.click(studyButton);

      const nextButton = screen.getByRole('button', { name: /次へ/ });
      expect(nextButton).not.toBeDisabled();
    });

    it('最大選択数の表示が正しい', async () => {
      const user = userEvent.setup();
      const store = useMoodRecordStore.getState();
      store.setMoodLevel(3);
      store.nextStep();

      render(<RecordPage />);

      await waitFor(() => {
        expect(screen.getByText('理由は何ですか？')).toBeInTheDocument();
      });

      // 初期状態: 0/2
      expect(screen.getByText('0/2 選択中')).toBeInTheDocument();

      const studyButton = screen.getByRole('button', { name: /勉強・学校/ });
      await user.click(studyButton);

      // 1つ選択: 1/2
      expect(screen.getByText('1/2 選択中')).toBeInTheDocument();

      const relationshipButton = screen.getByRole('button', {
        name: /人間関係/,
      });
      await user.click(relationshipButton);

      // 2つ選択: 2/2
      expect(screen.getByText('2/2 選択中')).toBeInTheDocument();
    });
  });

  describe('アクセシビリティテスト', () => {
    it('各ボタンに適切なARIA属性が設定されている', async () => {
      const store = useMoodRecordStore.getState();
      store.setMoodLevel(3);
      store.nextStep();

      render(<RecordPage />);

      await waitFor(() => {
        expect(screen.getByText('理由は何ですか？')).toBeInTheDocument();
      });

      const buttons = screen.getAllByRole('button');
      const reasonButtons = buttons.filter((btn) =>
        btn.getAttribute('aria-label')?.includes('理由カテゴリー')
      );

      reasonButtons.forEach((button) => {
        expect(button).toHaveAttribute('aria-pressed');
      });
    });

    it('ボタンに最小タップ領域のCSSクラスが設定されている', async () => {
      const store = useMoodRecordStore.getState();
      store.setMoodLevel(3);
      store.nextStep();

      render(<RecordPage />);

      await waitFor(() => {
        expect(screen.getByText('理由は何ですか？')).toBeInTheDocument();
      });

      const studyButton = screen.getByRole('button', { name: /勉強・学校/ });

      // min-h-[60px]クラスが設定されていることを確認（44px以上を満たす）
      expect(studyButton.className).toMatch(/min-h-\[60px\]/);
    });
  });

  describe('遷移テスト', () => {
    it('次へボタンクリックでステップ3へ遷移する', async () => {
      const user = userEvent.setup();
      const store = useMoodRecordStore.getState();
      store.setMoodLevel(3);
      store.nextStep();

      render(<RecordPage />);

      await waitFor(() => {
        expect(screen.getByText('理由は何ですか？')).toBeInTheDocument();
      });

      const studyButton = screen.getByRole('button', { name: /勉強・学校/ });
      await user.click(studyButton);

      const nextButton = screen.getByRole('button', { name: /次へ/ });
      await user.click(nextButton);

      // ステップ3に遷移
      expect(useMoodRecordStore.getState().currentStep).toBe(3);
    });
  });
});
