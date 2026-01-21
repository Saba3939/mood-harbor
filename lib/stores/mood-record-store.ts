/**
 * MoodRecordStore: Zustandを使用した気分記録フォーム状態管理
 *
 * 責務:
 * - 記録ステップ進行状態の管理（ステップ1〜3）
 * - 入力データの一時保存
 * - フォーム未完成時のリロード復元（persist機能）
 * - 各ステップでのバリデーション
 *
 * 永続化:
 * - ZustandのpersistミドルウェアでlocalStorageに保存
 * - フォーム途中での離脱時も復元可能
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  MoodLevel,
  ReasonCategory,
  TimeOfDay,
  Weather,
  RecordError,
} from '@/lib/types/mood-record';

/**
 * 定数: 制約値
 */
const MAX_REASONS_COUNT = 2; // 理由カテゴリーの最大選択数
const MAX_MEMO_LENGTH = 10; // メモの最大文字数
const MAX_STEP = 3; // 最大ステップ数

/**
 * 気分記録フォームの状態
 */
export type RecordFormState = {
  currentStep: 1 | 2 | 3;
  moodLevel: MoodLevel | null;
  selectedReasons: ReasonCategory[];
  questionId: string | null;
  answerOption: string | null;
  memo: string;
  timeOfDay: TimeOfDay | null;
  weather: Weather | null;
  isSubmitting: boolean;
  error: RecordError | null;
};

/**
 * 気分記録ストアのアクション
 */
export type RecordStoreActions = {
  setMoodLevel: (level: MoodLevel) => void;
  toggleReason: (reason: ReasonCategory) => void;
  setQuestionId: (id: string) => void;
  setAnswer: (option: string) => void;
  setMemo: (text: string) => void;
  setTimeOfDay: (time: TimeOfDay) => void;
  setWeather: (weather: Weather) => void;
  nextStep: () => void;
  resetForm: () => void;
  submitRecord: () => Promise<void>;
};

/**
 * 初期状態
 */
const initialState: RecordFormState = {
  currentStep: 1,
  moodLevel: null,
  selectedReasons: [],
  questionId: null,
  answerOption: null,
  memo: '',
  timeOfDay: null,
  weather: null,
  isSubmitting: false,
  error: null,
};

/**
 * MoodRecordStore: 気分記録フォームの状態とアクションを管理
 *
 * persistミドルウェアによる永続化:
 * - localStorageに'mood-record-store'キーで保存
 * - フォーム未完成時のリロードでも復元される
 * - 記録完了後はresetFormでクリア推奨
 */
export const useMoodRecordStore = create<RecordFormState & RecordStoreActions>()(
  persist(
    (set, get) => ({
      // 初期状態
      ...initialState,

      /**
       * 気分レベルを設定
       */
      setMoodLevel: (level: MoodLevel) => {
        set({ moodLevel: level });
      },

      /**
       * 理由カテゴリーをトグル（選択/解除）
       * 最大2つまで選択可能
       */
      toggleReason: (reason: ReasonCategory) => {
        const { selectedReasons } = get();

        if (selectedReasons.includes(reason)) {
          // 既に選択されている場合は削除
          set({
            selectedReasons: selectedReasons.filter((r) => r !== reason),
          });
        } else if (selectedReasons.length < MAX_REASONS_COUNT) {
          // 最大数未満の場合のみ追加
          set({
            selectedReasons: [...selectedReasons, reason],
          });
        }
        // 最大数を超える場合は何もしない
      },

      /**
       * 質問IDを設定
       */
      setQuestionId: (id: string) => {
        set({ questionId: id });
      },

      /**
       * 回答を設定
       */
      setAnswer: (option: string) => {
        set({ answerOption: option });
      },

      /**
       * メモを設定（10文字以内）
       */
      setMemo: (text: string) => {
        if (text.length <= MAX_MEMO_LENGTH) {
          set({ memo: text });
        }
        // 最大文字数を超える場合は何もしない
      },

      /**
       * 時間帯を設定
       */
      setTimeOfDay: (time: TimeOfDay) => {
        set({ timeOfDay: time });
      },

      /**
       * 天気を設定
       */
      setWeather: (weather: Weather) => {
        set({ weather });
      },

      /**
       * 次のステップへ進む
       * ステップ3が最後なので、それ以上は進まない
       */
      nextStep: () => {
        const { currentStep } = get();

        if (currentStep < MAX_STEP) {
          set({ currentStep: (currentStep + 1) as 1 | 2 | 3 });
        }
      },

      /**
       * フォームをリセット（初期状態に戻す）
       */
      resetForm: () => {
        set(initialState);
      },

      /**
       * 記録を送信
       * 注意: このメソッドは現在使用されていません
       * 代わりに、QuestionAnswerStepコンポーネントで直接createRecordActionを呼び出しています
       */
      submitRecord: async () => {
        const state = get();

        // バリデーション
        if (!state.moodLevel || !state.questionId || !state.answerOption) {
          set({
            error: { type: 'INVALID_MOOD_LEVEL', level: 0 },
          });
          return;
        }

        set({ isSubmitting: true, error: null });

        try {
          // 実際の送信処理はQuestionAnswerStepコンポーネントで実行
          await new Promise((resolve) => setTimeout(resolve, 100));

          set({ isSubmitting: false });
        } catch {
          set({
            isSubmitting: false,
            error: { type: 'RECORD_NOT_FOUND', record_id: '' },
          });
        }
      },
    }),
    {
      name: 'mood-record-store', // localStorageのキー名
      // 永続化する状態を選択（isSubmittingとerrorは永続化しない）
      partialize: (state) => ({
        currentStep: state.currentStep,
        moodLevel: state.moodLevel,
        selectedReasons: state.selectedReasons,
        questionId: state.questionId,
        answerOption: state.answerOption,
        memo: state.memo,
        timeOfDay: state.timeOfDay,
        weather: state.weather,
      }),
    }
  )
);
