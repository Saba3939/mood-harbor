/**
 * 統合cronエンドポイント
 * Vercel無料プランでは1つのcronジョブのみ許可されるため、
 * すべてのcronタスクをこのエンドポイントに統合
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'edge'
export const maxDuration = 60 // 最大60秒

export async function GET(request: Request) {
  try {
    // Vercel Cronからの呼び出しを検証
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const results: Record<string, unknown> = {}

    // タスク1: 期限切れシェアの削除
    results.deleteExpiredShares = await deleteExpiredShares()

    // TODO: 将来的に他のcronタスクをここに追加
    // results.otherTask = await otherTask()

    return NextResponse.json({
      message: 'Cronタスク完了',
      results
    })

  } catch (error) {
    console.error('Cronエラー:', error)
    return NextResponse.json(
      { error: 'Cronエラー', details: String(error) },
      { status: 500 }
    )
  }
}

/**
 * 期限切れシェアを削除するタスク
 */
async function deleteExpiredShares() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  const now = new Date().toISOString()

  // 期限切れのシェアを取得
  const { data: expiredShares, error: fetchError } = await supabase
    .from('shares')
    .select(`
      id,
      user_id,
      reaction_count,
      created_at,
      profiles:user_id (
        nickname
      )
    `)
    .lt('expires_at', now)

  if (fetchError) {
    console.error('期限切れシェア取得エラー:', fetchError)
    return { error: '取得エラー', details: fetchError }
  }

  if (!expiredShares || expiredShares.length === 0) {
    console.log('削除対象のシェアはありません')
    return { deleted_count: 0, notified_count: 0 }
  }

  console.log(`${expiredShares.length}件のシェアを削除します`)

  // 各シェアについて削除前に通知を送信
  const notificationPromises = expiredShares.map(async (share) => {
    try {
      const message = share.reaction_count > 0
        ? `あなたの投稿は${share.reaction_count}人に応援されました`
        : 'あなたの投稿が24時間経過したため削除されました'

      const { data: settings } = await supabase
        .from('notification_settings')
        .select('reaction_notification_mode')
        .eq('user_id', share.user_id)
        .single()

      if (settings && settings.reaction_notification_mode !== 'off') {
        console.log(`通知送信: user_id=${share.user_id}, message=${message}`)
        // TODO: 実際のプッシュ通知送信
      }
    } catch (notificationError) {
      console.error(`通知送信エラー (share_id=${share.id}):`, notificationError)
    }
  })

  await Promise.all(notificationPromises)

  // 期限切れシェアを削除
  const { error: deleteError, count } = await supabase
    .from('shares')
    .delete()
    .lt('expires_at', now)

  if (deleteError) {
    console.error('シェア削除エラー:', deleteError)
    return { error: '削除エラー', details: deleteError }
  }

  console.log(`${count || 0}件のシェアを削除しました`)

  return {
    deleted_count: count || 0,
    notified_count: expiredShares.length
  }
}
