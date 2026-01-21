/**
 * シェアモーダルコンポーネント
 *
 * 記録完了後にシェア投稿を作成するためのモーダル。
 * 3ステップ:
 * 1. シェア種類選択 (励まし募集、喜びシェア、頑張った報告)
 * 2. 気持ち選択 (シェア種類に応じた4つの選択肢)
 * 3. 一言メッセージ入力 (オプション、10文字以内)
 *
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.9
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  type ShareType,
  type Feeling,
  SHARE_TYPE_FEELINGS,
} from '@/lib/types/share';
import { createShareAction } from '@/lib/actions/share';

/**
 * シェアモーダルのプロパティ
 */
type ShareModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  recordId: string;
  userId: string;
};

/**
 * モーダルステップ
 */
type ModalStep = 'shareType' | 'feeling' | 'message';

/**
 * シェア種類ごとの定型文
 */
const TEMPLATE_MESSAGES: Record<ShareType, string[]> = {
  support_needed: ['助けてください', '辛いです', '話を聞いて'],
  joy_share: ['嬉しい!', 'ありがとう', '最高!'],
  achievement: ['やった!', '頑張った', '達成!'],
};

/**
 * シェア種類の表示情報
 */
const SHARE_TYPE_INFO: Record<
  ShareType,
  { emoji: string; label: string; description: string }
> = {
  support_needed: {
    emoji: '💙',
    label: '励まし募集',
    description: '辛い時、疲れた時に',
  },
  joy_share: {
    emoji: '💛',
    label: '喜びシェア',
    description: '嬉しいことがあった時に',
  },
  achievement: {
    emoji: '💚',
    label: '頑張った報告',
    description: '何かを達成した時に',
  },
};

/**
 * ShareModal: シェア投稿作成モーダル
 */
export function ShareModal({
  isOpen,
  onClose,
  onSuccess,
  recordId,
  userId,
}: ShareModalProps) {
  const [step, setStep] = useState<ModalStep>('shareType');
  const [shareType, setShareType] = useState<ShareType | null>(null);
  const [feeling, setFeeling] = useState<Feeling | null>(null);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * モーダルを閉じてリセット
   */
  const handleClose = () => {
    setStep('shareType');
    setShareType(null);
    setFeeling(null);
    setMessage('');
    setError(null);
    onClose();
  };

  /**
   * シェア種類選択
   */
  const handleSelectShareType = (type: ShareType) => {
    setShareType(type);
    setStep('feeling');
  };

  /**
   * 気持ち選択
   */
  const handleSelectFeeling = (selectedFeeling: Feeling) => {
    setFeeling(selectedFeeling);
    setStep('message');
  };

  /**
   * 気持ちスキップ
   */
  const handleSkipFeeling = () => {
    setStep('message');
  };

  /**
   * 戻る
   */
  const handleBack = () => {
    if (step === 'feeling') {
      setStep('shareType');
      setShareType(null);
    } else if (step === 'message') {
      setStep('feeling');
      setFeeling(null);
      setMessage('');
    }
  };

  /**
   * メッセージ入力
   */
  const handleMessageChange = (value: string) => {
    if (value.length <= 10) {
      setMessage(value);
    }
  };

  /**
   * 定型文選択
   */
  const handleSelectTemplate = (template: string) => {
    setMessage(template);
  };

  /**
   * シェア投稿
   */
  const handleSubmit = async () => {
    if (!shareType || !feeling) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const result = await createShareAction({
      user_id: userId,
      mood_record_id: recordId,
      share_type: shareType,
      feeling,
      message: message || undefined,
    });

    if (result.success) {
      onSuccess();
      handleClose();
    } else {
      // エラーメッセージ表示
      if (result.error.type === 'MESSAGE_TOO_LONG') {
        setError(`メッセージは${result.error.max}文字以内にしてください`);
      } else if (result.error.type === 'PRIVACY_SETTINGS_DISABLED') {
        setError('プライバシー設定でシェアが無効になっています');
      } else {
        setError('投稿に失敗しました。もう一度お試しください。');
      }
      setIsSubmitting(false);
    }
  };

  /**
   * メッセージなしで投稿
   */
  const handleSkipMessage = async () => {
    setMessage('');
    await handleSubmit();
  };

  // モーダルが閉じている時は何も表示しない
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl"
      >
        {/* ヘッダー */}
        <div className="flex justify-between items-center mb-6">
          {step !== 'shareType' && (
            <button
              type="button"
              onClick={handleBack}
              aria-label="戻る"
              className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          )}
          {step === 'shareType' && <div className="w-6" />}
          <button
            type="button"
            onClick={handleClose}
            aria-label="閉じる"
            className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* エラーメッセージ */}
        {error && (
          <div
            className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded"
            role="alert"
          >
            <p>{error}</p>
          </div>
        )}

        {/* コンテンツ */}
        <AnimatePresence mode="wait">
          {step === 'shareType' && (
            <motion.div
              key="shareType"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <h2
                id="share-modal-title"
                className="text-2xl font-bold text-center mb-6 text-gray-800 dark:text-gray-100"
              >
                シェアする
              </h2>
              <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
                どんな投稿にしますか?
              </p>
              <div className="space-y-3">
                {(Object.keys(SHARE_TYPE_INFO) as ShareType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleSelectShareType(type)}
                    className="w-full p-4 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600
                             transition-colors text-left flex items-center space-x-4
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    <span className="text-4xl">{SHARE_TYPE_INFO[type].emoji}</span>
                    <div>
                      <p className="font-bold text-gray-800 dark:text-gray-100">
                        {SHARE_TYPE_INFO[type].label}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {SHARE_TYPE_INFO[type].description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 'feeling' && shareType && (
            <motion.div
              key="feeling"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <h2 className="text-2xl font-bold text-center mb-6 text-gray-800 dark:text-gray-100">
                どんな気持ち?
              </h2>
              <div className="space-y-3">
                {SHARE_TYPE_FEELINGS[shareType].map((feelingOption) => (
                  <button
                    key={feelingOption}
                    type="button"
                    onClick={() => handleSelectFeeling(feelingOption)}
                    className={`
                      w-full min-h-[60px] px-6 py-4 rounded-lg
                      flex items-center justify-center
                      transition-all duration-200 transform
                      ${
                        feeling === feelingOption
                          ? 'bg-blue-500 text-white scale-105 ring-4 ring-offset-2 ring-blue-300'
                          : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 hover:scale-102'
                      }
                      shadow-md hover:shadow-lg
                      focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-offset-2
                    `}
                  >
                    <span className="text-lg font-medium">{feelingOption}</span>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={handleSkipFeeling}
                className="w-full mt-4 px-6 py-3 rounded-lg font-medium text-gray-600 dark:text-gray-400
                         bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700
                         transition-all duration-200
                         focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                スキップ
              </button>
            </motion.div>
          )}

          {step === 'message' && (
            <motion.div
              key="message"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <h2 className="text-2xl font-bold text-center mb-6 text-gray-800 dark:text-gray-100">
                一言メッセージ (任意)
              </h2>

              {/* メッセージ入力 */}
              <div className="mb-4">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => handleMessageChange(e.target.value)}
                  placeholder="10文字以内"
                  maxLength={10}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600
                           bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-right text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {message.length}/10
                </p>
              </div>

              {/* 定型文ボタン */}
              {shareType && (
                <div className="mb-6">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    定型文
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {TEMPLATE_MESSAGES[shareType].map((template) => (
                      <button
                        key={template}
                        type="button"
                        onClick={() => handleSelectTemplate(template)}
                        className="px-4 py-2 rounded-full text-sm font-medium
                                 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100
                                 hover:bg-gray-200 dark:hover:bg-gray-600
                                 transition-colors
                                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        {template}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 投稿ボタン */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className={`
                    w-full px-6 py-4 rounded-lg font-bold text-lg text-white
                    transition-all duration-200
                    ${
                      isSubmitting
                        ? 'bg-gray-300 cursor-not-allowed'
                        : 'bg-blue-500 hover:bg-blue-600 shadow-lg hover:shadow-xl'
                    }
                    focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-offset-2
                  `}
                >
                  {isSubmitting ? '投稿中...' : '投稿する'}
                </button>
                <button
                  type="button"
                  onClick={handleSkipMessage}
                  disabled={isSubmitting}
                  className="w-full px-6 py-3 rounded-lg font-medium text-gray-600 dark:text-gray-400
                           bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700
                           transition-all duration-200
                           focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
                           disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  スキップして投稿
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
