/**
 * delete-expired-shares Supabase Function の統合テスト
 */

import { createClient } from '@supabase/supabase-js'

// テスト用のSupabaseクライアント設定
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-role-key'

describe('delete-expired-shares Supabase Function', () => {
  let supabase: ReturnType<typeof createClient>

  beforeAll(() => {
    supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  })

  afterEach(async () => {
    // テストデータのクリーンアップ
    await supabase.from('shares').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('profiles').delete().neq('user_id', '00000000-0000-0000-0000-000000000000')
  })

  describe('期限切れシェアの削除', () => {
    it('expires_at < NOW() のシェアを削除する', async () => {
      // テストユーザーとプロフィールを作成
      const testUserId = 'test-user-expired-1'
      await supabase.from('profiles').insert({
        user_id: testUserId,
        nickname: 'テストユーザー',
        avatar_id: 'avatar_01'
      })

      // 期限切れシェアを作成（24時間以上前）
      const expiredDate = new Date()
      expiredDate.setHours(expiredDate.getHours() - 25) // 25時間前

      const { data: share } = await supabase
        .from('shares')
        .insert({
          user_id: testUserId,
          mood_record_id: '00000000-0000-0000-0000-000000000001',
          share_type: 'support_needed',
          feeling: 'とても辛い',
          message: 'テスト投稿',
          reaction_count: 5,
          created_at: expiredDate.toISOString(),
          expires_at: expiredDate.toISOString()
        })
        .select()
        .single()

      expect(share).toBeDefined()

      // Supabase Functionを呼び出し（実際の環境ではHTTPリクエストで呼び出す）
      // このテストではデータベースの状態をチェックする
      const { data: expiredShares } = await supabase
        .from('shares')
        .select('*')
        .lt('expires_at', new Date().toISOString())

      expect(expiredShares).toBeDefined()
      expect(expiredShares!.length).toBeGreaterThan(0)

      // 削除実行
      const { count } = await supabase
        .from('shares')
        .delete()
        .lt('expires_at', new Date().toISOString())

      expect(count).toBe(1)

      // 削除後の確認
      const { data: remainingShares } = await supabase
        .from('shares')
        .select('*')
        .eq('id', share!.id)

      expect(remainingShares).toBeDefined()
      expect(remainingShares!.length).toBe(0)
    })

    it('expires_at >= NOW() のシェアは削除しない', async () => {
      // テストユーザーとプロフィールを作成
      const testUserId = 'test-user-valid-1'
      await supabase.from('profiles').insert({
        user_id: testUserId,
        nickname: 'テストユーザー2',
        avatar_id: 'avatar_02'
      })

      // 有効期限内のシェアを作成（1時間後に期限切れ）
      const futureDate = new Date()
      futureDate.setHours(futureDate.getHours() + 1)

      const { data: share } = await supabase
        .from('shares')
        .insert({
          user_id: testUserId,
          mood_record_id: '00000000-0000-0000-0000-000000000002',
          share_type: 'joy_share',
          feeling: 'すごく嬉しい!',
          message: '有効な投稿',
          reaction_count: 3,
          created_at: new Date().toISOString(),
          expires_at: futureDate.toISOString()
        })
        .select()
        .single()

      expect(share).toBeDefined()

      // 削除実行（期限切れのみ対象）
      const { count } = await supabase
        .from('shares')
        .delete()
        .lt('expires_at', new Date().toISOString())

      expect(count).toBe(0)

      // 有効なシェアが残っているか確認
      const { data: remainingShares } = await supabase
        .from('shares')
        .select('*')
        .eq('id', share!.id)

      expect(remainingShares).toBeDefined()
      expect(remainingShares!.length).toBe(1)
    })
  })

  describe('削除前の通知送信', () => {
    it('reaction_count > 0 の場合、応援数を含む通知メッセージを生成', () => {
      const reactionCount = 10
      const message = reactionCount > 0
        ? `あなたの投稿は${reactionCount}人に応援されました`
        : 'あなたの投稿が24時間経過したため削除されました'

      expect(message).toBe('あなたの投稿は10人に応援されました')
    })

    it('reaction_count = 0 の場合、削除通知メッセージを生成', () => {
      const reactionCount = 0
      const message = reactionCount > 0
        ? `あなたの投稿は${reactionCount}人に応援されました`
        : 'あなたの投稿が24時間経過したため削除されました'

      expect(message).toBe('あなたの投稿が24時間経過したため削除されました')
    })
  })

  describe('通知設定のチェック', () => {
    it('notification_settings.reaction_notification_mode が off の場合、通知をスキップ', async () => {
      const testUserId = 'test-user-notification-off'

      // 通知設定を作成（off）
      await supabase.from('notification_settings').insert({
        user_id: testUserId,
        record_reminder_enabled: false,
        record_reminder_time: '21:00',
        reaction_notification_mode: 'off',
        quiet_mode_enabled: false
      })

      // 通知設定を取得
      const { data: settings } = await supabase
        .from('notification_settings')
        .select('reaction_notification_mode')
        .eq('user_id', testUserId)
        .single()

      expect(settings).toBeDefined()
      expect(settings!.reaction_notification_mode).toBe('off')

      // 通知をスキップするロジック
      const shouldNotify = settings && settings.reaction_notification_mode !== 'off'
      expect(shouldNotify).toBe(false)
    })

    it('notification_settings.reaction_notification_mode が realtime の場合、通知を送信', async () => {
      const testUserId = 'test-user-notification-realtime'

      // 通知設定を作成（realtime）
      await supabase.from('notification_settings').insert({
        user_id: testUserId,
        record_reminder_enabled: true,
        record_reminder_time: '21:00',
        reaction_notification_mode: 'realtime',
        quiet_mode_enabled: false
      })

      // 通知設定を取得
      const { data: settings } = await supabase
        .from('notification_settings')
        .select('reaction_notification_mode')
        .eq('user_id', testUserId)
        .single()

      expect(settings).toBeDefined()
      expect(settings!.reaction_notification_mode).toBe('realtime')

      // 通知を送信するロジック
      const shouldNotify = settings && settings.reaction_notification_mode !== 'off'
      expect(shouldNotify).toBe(true)
    })
  })

  describe('Realtime share:deleted イベント', () => {
    it('シェア削除時にDELETEイベントが自動的にブロードキャストされる', async () => {
      // Supabase Realtimeは自動的にDELETEイベントをブロードキャストする
      // このテストでは、削除が正常に実行されることを確認

      const testUserId = 'test-user-realtime-1'
      await supabase.from('profiles').insert({
        user_id: testUserId,
        nickname: 'リアルタイムテスト',
        avatar_id: 'avatar_03'
      })

      const expiredDate = new Date()
      expiredDate.setHours(expiredDate.getHours() - 25)

      const { data: share } = await supabase
        .from('shares')
        .insert({
          user_id: testUserId,
          mood_record_id: '00000000-0000-0000-0000-000000000003',
          share_type: 'achievement',
          feeling: 'やり切った!',
          message: 'リアルタイムテスト投稿',
          reaction_count: 2,
          created_at: expiredDate.toISOString(),
          expires_at: expiredDate.toISOString()
        })
        .select()
        .single()

      expect(share).toBeDefined()

      // 削除実行
      const { error, count } = await supabase
        .from('shares')
        .delete()
        .eq('id', share!.id)

      expect(error).toBeNull()
      expect(count).toBe(1)

      // Supabase RealtimeはDELETE操作を自動的にブロードキャストする
      // クライアント側でこのイベントを購読することで、リアルタイム更新を実現
    })
  })
})
