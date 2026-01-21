'use server';

import { createClient } from '@/lib/supabase/server';
import { MoodRecordService } from '@/lib/services/mood-record';
import type {
  MoodRecord,
  CreateRecordParams,
  UpdateRecordParams,
  RecordFilters,
  RecordError,
  Result,
} from '@/lib/types/mood-record';

/**
 * 気分記録を作成する Server Action
 */
export async function createRecordAction(
  params: CreateRecordParams
): Promise<Result<MoodRecord, RecordError>> {
  const supabase = await createClient();
  const service = new MoodRecordService(supabase);

  return await service.createRecord(params);
}

/**
 * 気分記録を更新する Server Action
 */
export async function updateRecordAction(
  recordId: string,
  updates: UpdateRecordParams
): Promise<Result<MoodRecord, RecordError>> {
  const supabase = await createClient();
  const service = new MoodRecordService(supabase);

  return await service.updateRecord(recordId, updates);
}

/**
 * 指定したIDの気分記録を取得する Server Action
 */
export async function getRecordAction(
  recordId: string
): Promise<Result<MoodRecord | null, RecordError>> {
  const supabase = await createClient();
  const service = new MoodRecordService(supabase);

  return await service.getRecord(recordId);
}

/**
 * ユーザーの気分記録を取得する Server Action
 */
export async function getRecordsByUserAction(
  userId: string,
  filters?: RecordFilters
): Promise<Result<MoodRecord[], RecordError>> {
  const supabase = await createClient();
  const service = new MoodRecordService(supabase);

  return await service.getRecordsByUser(userId, filters);
}

/**
 * 気分記録を削除する Server Action
 */
export async function deleteRecordAction(
  recordId: string
): Promise<Result<void, RecordError>> {
  const supabase = await createClient();
  const service = new MoodRecordService(supabase);

  return await service.deleteRecord(recordId);
}
