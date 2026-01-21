// 期限切れシェアを削除するSupabase Function
import { createClient } from 'jsr:@supabase/supabase-js@2'

Deno.serve(async (req) => {
  try {
    // Supabaseクライアント初期化（サービスロールキーを使用）
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // 現在時刻を取得
    const now = new Date().toISOString()

    // 期限切れのシェアを取得（削除前に通知を送信するため）
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
      return new Response(
        JSON.stringify({ error: '期限切れシェア取得エラー', details: fetchError }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (!expiredShares || expiredShares.length === 0) {
      console.log('削除対象のシェアはありません')
      return new Response(
        JSON.stringify({ message: '削除対象のシェアはありません', deleted_count: 0 }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log(`${expiredShares.length}件のシェアを削除します`)

    // 各シェアについて削除前に通知を送信
    const notificationPromises = expiredShares.map(async (share) => {
      try {
        // 通知メッセージを作成
        const message = share.reaction_count > 0
          ? `あなたの投稿は${share.reaction_count}人に応援されました`
          : 'あなたの投稿が24時間経過したため削除されました'

        // notification_settingsを確認（通知が有効かチェック）
        const { data: settings } = await supabase
          .from('notification_settings')
          .select('reaction_notification_mode')
          .eq('user_id', share.user_id)
          .single()

        // 通知が無効でなければ通知レコードを作成
        // （実際のプッシュ通知送信は別途実装が必要）
        if (settings && settings.reaction_notification_mode !== 'off') {
          // 通知テーブルがある場合はINSERT（今回は簡易実装としてログ出力）
          console.log(`通知送信: user_id=${share.user_id}, message=${message}`)

          // TODO: 実際のプッシュ通知送信またはin-app通知作成
          // await sendPushNotification(share.user_id, message)
        }

        // Realtimeで share:deleted イベントを配信
        // （Supabase Realtimeは自動的にDELETEイベントをブロードキャストする）
      } catch (notificationError) {
        console.error(`通知送信エラー (share_id=${share.id}):`, notificationError)
        // 通知エラーは削除処理を中断しない
      }
    })

    // 全通知送信を待機
    await Promise.all(notificationPromises)

    // 期限切れシェアを削除
    const { error: deleteError, count } = await supabase
      .from('shares')
      .delete()
      .lt('expires_at', now)

    if (deleteError) {
      console.error('シェア削除エラー:', deleteError)
      return new Response(
        JSON.stringify({ error: 'シェア削除エラー', details: deleteError }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log(`${count || 0}件のシェアを削除しました`)

    return new Response(
      JSON.stringify({
        message: '期限切れシェアを削除しました',
        deleted_count: count || 0,
        notified_count: expiredShares.length
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('予期しないエラー:', error)
    return new Response(
      JSON.stringify({ error: '予期しないエラー', details: String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
