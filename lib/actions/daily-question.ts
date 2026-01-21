'use server';

import { createClient } from '@/lib/supabase/server';
import { DailyQuestionService } from '@/lib/services/daily-question';
import type {
  DailyQuestion,
  QuestionError,
  Result,
} from '@/lib/types/daily-question';

/**
 * 今日の日替わり質問を取得する Server Action
 */
export async function getTodayQuestionAction(): Promise<
  Result<DailyQuestion, QuestionError>
> {
  const supabase = await createClient();
  const service = new DailyQuestionService(supabase);

  return await service.getTodayQuestion();
}

/**
 * 指定したIDの質問を取得する Server Action
 */
export async function getQuestionByIdAction(
  questionId: string
): Promise<Result<DailyQuestion | null, QuestionError>> {
  const supabase = await createClient();
  const service = new DailyQuestionService(supabase);

  return await service.getQuestionById(questionId);
}
