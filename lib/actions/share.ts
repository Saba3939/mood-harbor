/**
 * ShareのServer Actions
 * クライアントコンポーネントから呼び出される
 */

'use server';

import { createClient } from '@/lib/supabase/server';
import { ShareService } from '@/lib/services/share';
import type {
  CreateShareParams,
  Share,
  ShareError,
  Result,
} from '@/lib/types/share';

/**
 * シェアを作成するServer Action
 */
export async function createShareAction(
  params: CreateShareParams
): Promise<Result<Share, ShareError>> {
  const supabase = await createClient();
  const shareService = new ShareService(supabase);

  // 現在のユーザーを取得して認証チェック
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: { type: 'UNAUTHORIZED_DELETE' },
    };
  }

  // user_idを現在のユーザーIDに上書き（セキュリティ対策）
  const paramsWithUser: CreateShareParams = {
    ...params,
    user_id: user.id,
  };

  return shareService.createShare(paramsWithUser);
}

/**
 * シェアを取得するServer Action
 */
export async function getShareAction(
  shareId: string
): Promise<Result<Share | null, ShareError>> {
  const supabase = await createClient();
  const shareService = new ShareService(supabase);

  return shareService.getShare(shareId);
}

/**
 * シェアを削除するServer Action
 */
export async function deleteShareAction(
  shareId: string
): Promise<Result<void, ShareError>> {
  const supabase = await createClient();
  const shareService = new ShareService(supabase);

  // 現在のユーザーを取得して認証チェック
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: { type: 'UNAUTHORIZED_DELETE' },
    };
  }

  return shareService.deleteShare(shareId, user.id);
}
