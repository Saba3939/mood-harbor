/**
 * ステップ3: 日替わり質問回答コンポーネント
 *
 * 日替わり質問の表示と回答選択、記録送信を担当します
 *
 * Requirements: 3.4, 3.6, 4.1, 4.6, 18.2, 21.4
 */

'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMoodRecordStore } from '@/lib/stores/mood-record-store';
import { getTodayQuestionAction } from '@/lib/actions/daily-question';
import {
  createRecordAction,
  updateRecordAction,
} from '@/lib/actions/mood-record';
import { useAuthStore } from '@/lib/stores/auth-store';
import type { DailyQuestion } from '@/lib/types/daily-question';
import { SupplementForm } from './supplement-form';
import { ShareModal } from './share-modal';

/**
 * QuestionAnswerStep: 日替わり質問回答ステップ
 */
export function QuestionAnswerStep() {
  const { user } = useAuthStore();
  const {
    moodLevel,
    selectedReasons,
    questionId,
    answerOption,
    memo,
    timeOfDay,
    weather,
    isSubmitting,
    error,
    setQuestionId,
    setAnswer,
    resetForm,
  } = useMoodRecordStore();

  const [question, setQuestion] = useState<DailyQuestion | null>(null);
  const [loadingQuestion, setLoadingQuestion] = useState(true);
  const [questionError, setQuestionError] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showSupplementForm, setShowSupplementForm] = useState(false);
  const [recordId, setRecordId] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  /**
   * コンポーネントマウント時に今日の質問を取得
   */
  useEffect(() => {
    const fetchQuestion = async () => {
      setLoadingQuestion(true);
      setQuestionError(null);

      const result = await getTodayQuestionAction();

      if (result.success) {
        setQuestion(result.value);
        setQuestionId(result.value.id);
      } else {
        setQuestionError('質問の取得に失敗しました。');
      }

      setLoadingQuestion(false);
    };

    fetchQuestion();
  }, [setQuestionId]);

  /**
   * 回答選択ハンドラー
   */
  const handleAnswerSelect = (option: string) => {
    setAnswer(option);
  };

  /**
   * 補足入力を開くハンドラー
   */
  const handleOpenSupplement = () => {
    setShowSupplementForm(true);
  };

  /**
   * 補足入力をスキップするハンドラー
   */
  const handleSkipSupplement = () => {
    // フォームをリセットして完了
    resetForm();
    setIsCompleted(false);
    setShowSupplementForm(false);
    setShowShareModal(false);
  };

  /**
   * シェアモーダルを開く
   */
  const handleOpenShareModal = () => {
    setShowShareModal(true);
  };

  /**
   * シェア成功ハンドラー
   */
  const handleShareSuccess = () => {
    setShowShareModal(false);
    // フォームをリセットして完了
    resetForm();
    setIsCompleted(false);
    setShowSupplementForm(false);
  };

  /**
   * 補足入力を保存するハンドラー
   */
  const handleSubmitSupplement = async () => {
    if (!recordId) {
      return;
    }

    // 記録を更新
    const result = await updateRecordAction(recordId, {
      memo: memo || undefined,
      time_of_day: timeOfDay || undefined,
      weather: weather || undefined,
    });

    if (result.success) {
      // フォームをリセットして完了
      resetForm();
      setIsCompleted(false);
      setShowSupplementForm(false);
    }
  };

  /**
   * 記録送信ハンドラー
   */
  const handleSubmit = async () => {
    if (!user?.id || !moodLevel || !questionId || !answerOption) {
      return;
    }

    const result = await createRecordAction({
      user_id: user.id,
      mood_level: moodLevel,
      reasons: selectedReasons,
      question_id: questionId,
      answer_option: answerOption,
      memo: memo || undefined,
      time_of_day: timeOfDay || undefined,
      weather: weather || undefined,
    });

    if (result.success) {
      setRecordId(result.value.id);
      setIsCompleted(true);
    }
  };

  // ローディング中
  if (loadingQuestion) {
    return (
      <main
        className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-screen"
        role="main"
      >
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" />
          <p className="text-gray-600 dark:text-gray-400">
            質問を読み込み中...
          </p>
        </div>
      </main>
    );
  }

  // 質問取得エラー
  if (questionError || !question) {
    return (
      <main
        className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-screen"
        role="main"
      >
        <div className="w-full max-w-md space-y-6">
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded"
            role="alert"
          >
            <p>{questionError || '質問の取得に失敗しました'}</p>
          </div>
        </div>
      </main>
    );
  }

  // 記録完了画面（補足入力モーダル表示）
  if (isCompleted && showSupplementForm) {
    return (
      <main
        className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-screen"
        role="main"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <SupplementForm
            onSubmit={handleSubmitSupplement}
            onSkip={handleSkipSupplement}
            onShare={handleOpenShareModal}
          />
        </motion.div>

        {/* シェアモーダル（補足入力画面） */}
        {user?.id && recordId && (
          <ShareModal
            isOpen={showShareModal && showSupplementForm}
            onClose={() => setShowShareModal(false)}
            onSuccess={handleShareSuccess}
            recordId={recordId}
            userId={user.id}
          />
        )}
      </main>
    );
  }

  // 記録完了画面
  if (isCompleted) {
    return (
      <main
        className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-screen"
        role="main"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md space-y-6 text-center"
        >
          {/* 船が港に入るアニメーション */}
          <motion.div
            initial={{ x: -200, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            className="text-8xl"
          >
            🚢
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
              記録完了!
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              今日の気分を記録しました
            </p>
          </motion.div>

          {/* アクションボタン */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="space-y-3"
          >
            <button
              type="button"
              onClick={handleOpenShareModal}
              className="w-full px-6 py-3 rounded-lg font-medium text-white
                       bg-blue-500 hover:bg-blue-600
                       transition-all duration-200
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              シェアする
            </button>
            <button
              type="button"
              onClick={handleOpenSupplement}
              className="w-full px-6 py-3 rounded-lg font-medium text-blue-600 dark:text-blue-400
                       bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40
                       transition-all duration-200
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              もう少し詳しく
            </button>
            <button
              type="button"
              onClick={handleSkipSupplement}
              className="w-full px-6 py-3 rounded-lg font-medium text-gray-600 dark:text-gray-400
                       bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700
                       transition-all duration-200
                       focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              スキップして完了
            </button>
          </motion.div>
        </motion.div>

        {/* シェアモーダル */}
        {user?.id && recordId && (
          <ShareModal
            isOpen={showShareModal}
            onClose={() => setShowShareModal(false)}
            onSuccess={handleShareSuccess}
            recordId={recordId}
            userId={user.id}
          />
        )}
      </main>
    );
  }

  // 質問回答画面
  return (
    <main
      className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-screen"
      role="main"
    >
      <div className="w-full max-w-md space-y-6">
        {/* タイトル */}
        <h1 className="text-2xl font-bold text-center text-gray-800 dark:text-gray-100">
          {question.question_text}
        </h1>

        {/* エラーメッセージ */}
        {error && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded"
            role="alert"
          >
            <p>記録の保存に失敗しました</p>
          </div>
        )}

        {/* 回答選択肢 */}
        <div className="space-y-3">
          <AnimatePresence>
            {question.options.map((option, index) => (
              <motion.button
                key={option}
                type="button"
                onClick={() => handleAnswerSelect(option)}
                aria-label={`選択肢: ${option}`}
                aria-pressed={answerOption === option}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`
                  w-full min-h-[60px] px-6 py-4 rounded-lg
                  flex items-center justify-center
                  transition-all duration-200 transform
                  ${
                    answerOption === option
                      ? 'bg-blue-500 text-white scale-105 ring-4 ring-offset-2 ring-blue-300'
                      : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 hover:scale-102'
                  }
                  shadow-md hover:shadow-lg
                  focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-offset-2
                `}
              >
                <span className="text-lg font-medium">{option}</span>
              </motion.button>
            ))}
          </AnimatePresence>
        </div>

        {/* 記録ボタン */}
        <motion.button
          type="button"
          onClick={handleSubmit}
          disabled={!answerOption || isSubmitting}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`
            w-full min-h-[60px] px-6 py-4 rounded-lg
            font-bold text-lg text-white
            transition-all duration-200
            ${
              !answerOption || isSubmitting
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-green-500 hover:bg-green-600 shadow-lg hover:shadow-xl'
            }
            focus:outline-none focus:ring-4 focus:ring-green-300 focus:ring-offset-2
          `}
        >
          {isSubmitting ? '送信中...' : '記録を完了'}
        </motion.button>

        {/* ステップインジケーター */}
        <div className="flex justify-center space-x-2 pt-4">
          <div
            className="h-2 w-2 rounded-full bg-blue-500"
            aria-label="ステップ1: 気分選択 (完了)"
          />
          <div
            className="h-2 w-2 rounded-full bg-blue-500"
            aria-label="ステップ2: 理由選択 (完了)"
          />
          <div
            className="h-2 w-2 rounded-full bg-blue-500"
            aria-label="ステップ3: 質問回答 (現在)"
          />
        </div>
      </div>
    </main>
  );
}
