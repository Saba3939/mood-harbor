/**
 * 気分記録ページ
 *
 * 3ステップの気分記録フローを提供:
 * - ステップ1: 気分選択(5段階)
 * - ステップ2: 理由選択(最大2つ)
 * - ステップ3: 日替わり質問回答
 *
 * Requirements: 3.1-3.8, 21.1, 21.2, 21.4, 21.5
 */

'use client';

import { useMoodRecordStore } from '@/lib/stores/mood-record-store';
import { MoodSelectorStep } from './components/step-1-mood-selector';
import { ReasonSelectorStep } from './components/step-2-reason-selector';
import { QuestionAnswerStep } from './components/step-3-question-answer';

/**
 * RecordPage: 気分記録フローのメインページ
 */
export default function RecordPage() {
  const { currentStep } = useMoodRecordStore();

  // 現在のステップに応じたコンポーネントを表示
  switch (currentStep) {
    case 1:
      return <MoodSelectorStep />;
    case 2:
      return <ReasonSelectorStep />;
    case 3:
      return <QuestionAnswerStep />;
    default:
      return (
        <main className="container mx-auto px-4 py-8">
          <p>不正なステップです</p>
        </main>
      );
  }
}
