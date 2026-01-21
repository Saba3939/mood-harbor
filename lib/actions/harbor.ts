/**
 * Harbor Server Actions
 * ハーバーフィード取得のサーバーアクション
 */

'use server';

import { createClient } from '@/lib/supabase/server';
import { HarborService } from '@/lib/services/harbor';
import type { HarborFilters, HarborPost, HarborError, Result } from '@/lib/types/harbor';

/**
 * ハーバーフィードを取得する
 *
 * @example
 * ```tsx
 * const result = await getHarborFeed({
 *   share_type: 'support_needed',
 *   sort_by: 'newest',
 *   limit: 20,
 *   offset: 0,
 * });
 *
 * if (result.success) {
 *   console.log('投稿:', result.value);
 * }
 * ```
 */
export async function getHarborFeed(
  filters: HarborFilters
): Promise<Result<HarborPost[], HarborError>> {
  try {
    const supabase = await createClient();
    const harborService = new HarborService(supabase);

    return await harborService.getFeed(filters);
  } catch (error) {
    console.error('getHarborFeed error:', error);
    return {
      success: false,
      error: { type: 'INVALID_FILTERS' },
    };
  }
}
