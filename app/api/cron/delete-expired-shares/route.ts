/**
 * 期限切れシェアを削除するcron API Route
 * Vercel Cronから1時間ごとに呼び出される
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'edge'

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

    // Supabaseクライアント初期化（サービスロールキーを使用）
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
      return NextResponse.json(
        { error: '期限切れシェア取得エラー', details: fetchError },
        { status: 500 }
      )
    }

    if (!expiredShares || expiredShares.length === 0) {
      console.log('削除対象のシェアはありません')
      return NextResponse.json({
        message: '削除対象のシェアはありません',
        deleted_count: 0
      })
    }

    console.log(`${expiredShares.length}件のシェアを削除します`)

    // 各シェアについて削除前に通知を送信
    const notificationPromises = expiredShares.map(async (share) => {
      try {
        const message = share.reaction_count > 0
          ? `あなたの投稿は${share.reaction_count}人に応援されました`
          : 'あなたの投稿が24時間経過したため削除されました'

        // 通知設定を確認
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
      return NextResponse.json(
        { error: 'シェア削除エラー', details: deleteError },
        { status: 500 }
      )
    }

    console.log(`${count || 0}件のシェアを削除しました`)

    return NextResponse.json({
      message: '期限切れシェアを削除しました',
      deleted_count: count || 0,
      notified_count: expiredShares.length
    })

  } catch (error) {
    console.error('予期しないエラー:', error)
    return NextResponse.json(
      { error: '予期しないエラー', details: String(error) },
      { status: 500 }
    )
  }
}
