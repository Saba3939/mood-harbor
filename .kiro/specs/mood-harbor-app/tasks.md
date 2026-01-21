# 実装タスク

## タスク一覧

### 1. プロジェクト初期設定とインフラ構築

- [x] 1.1 (P) Supabase プロジェクトの初期化とデータベーススキーマ構築
  - Supabaseプロジェクトを作成しPostgreSQLデータベースを初期化
  - `profiles`, `mood_records`, `daily_questions`, `shares`, `reactions`, `notification_settings`テーブルのCREATE文を実行
  - 各テーブルのインデックスを設定（user_id, created_at, share_type, expires_atなど）
  - Row Level Security (RLS)ポリシーをテーブルごとに定義（ユーザーごとのデータアクセス制御）
  - 外部キー制約とCASCADE削除ルールを設定
  - _Requirements: 1.5, 1.6, 19.1, 19.6, 20.1_

- [x] 1.2 (P) Next.js プロジェクトの設定と依存関係のインストール
  - Next.js 16.1.1とReact 19.2.3の設定を確認
  - TypeScript strict mode（noImplicitAny, strictNullChecks）をtsconfig.jsonで有効化
  - TailwindCSS v4の統合とCSS設定（ダークモード準備含む）
  - Zustand、Framer Motion、@ducanh2912/next-pwa、Supabase クライアントSDKをインストール
  - ESLintとPrettierの設定（anyの使用禁止ルール追加）
  - _Requirements: 18.1, 18.4, 19.2, 21.2, 21.3_

- [x] 1.3 (P) PWA設定とService Workerの基盤構築
  - @ducanh2912/next-pwaを設定しmanifest.jsonを作成
  - アプリ名「Mood Harbor」、アイコン、テーマカラーを定義
  - Service Workerのキャッシング戦略を設定（NetworkFirst for records, CacheFirst for static assets）
  - IndexedDBスキーマを定義（オフライン記録キュー用）
  - オンライン/オフライン検知機能を実装
  - _Requirements: 18.1, 18.2, 18.3, 21.2_

- [x] 1.4 環境変数とSupabase認証設定
  - `.env.local`にSupabase URLとAnon Keyを設定
  - Supabase AuthでGoogle OAuth providerを有効化しリダイレクトURLを登録
  - Next.js middlewareでSupabase Auth統合を設定
  - HTTPS通信の強制設定（Vercel自動設定確認）
  - CSRF対策とSame-Site Cookie設定を確認
  - _Requirements: 1.2, 1.6, 19.2, 19.4_

### 2. 認証ドメインの実装

- [x] 2.1 Supabase Auth統合とAuthServiceの実装
  - Supabase Auth SDKを使用したAuthServiceの実装（signUp, signIn, signInWithOAuth, signOut, getCurrentUser, deleteAccount）
  - TypeScript Result型でエラーハンドリング（INVALID_CREDENTIALS, EMAIL_ALREADY_EXISTS, WEAK_PASSWORD, NETWORK_ERROR）
  - パスワード強度バリデーション（8文字以上、英数字混在）をクライアントとサーバーの両方で実装
  - OAuth認証フロー（Google）の実装とリダイレクト処理
  - アカウント削除時の全データCASCADE削除の動作確認
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 19.1_

- [x] 2.2 Next.js Middlewareによる認証チェックとルート保護
  - middlewareで全リクエストの認証状態をチェック
  - 未認証ユーザーを`/login`へリダイレクト（公開ページは除外）
  - 認証済みユーザーの`/login`, `/signup`アクセスを`/`へリダイレクト
  - セッショントークンの有効性チェックと自動リフレッシュ
  - Edge Runtimeで実行されるようmiddleware設定を最適化
  - _Requirements: 1.3, 1.6, 19.2, 19.4_

- [x] 2.3 Zustand AuthStoreの実装
  - AuthStore（user, session, isLoading, error状態）をZustandで実装
  - Supabase Auth SDKのセッション変更イベントをリッスンし状態を同期
  - signUp, signIn, signInWithOAuth, signOut, refreshSession, clearErrorアクションを実装
  - localStorageへのセッション永続化をSupabase Authに委譲
  - 全UIコンポーネントから認証状態を参照可能にする
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.6_

- [x] 2.4 ログイン・サインアップUIの実装
  - `/login`ページと`/signup`ページの作成（モバイルファーストデザイン）
  - メールアドレス・パスワード入力フォームの実装
  - Google OAuth連携ボタンの実装
  - パスワード強度リアルタイム検証と視覚的フィードバック
  - エラーメッセージ表示（INVALID_CREDENTIALS, EMAIL_ALREADY_EXISTS等）
  - TailwindCSSでレスポンシブデザインとARIA属性の実装
  - _Requirements: 1.1, 1.2, 1.3, 21.1, 21.2, 21.4_

- [x]* 2.5 認証機能のテスト実装
  - AuthServiceのユニットテスト（全メソッドの成功/失敗ケース）
  - middlewareの認証チェックテスト（リダイレクト動作確認）
  - AuthStoreの状態遷移テスト
  - E2Eテスト: サインアップ → ログイン → ログアウトフロー
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

### 3. プロフィール設定機能の実装

- [x] 3.1 ProfileServiceとServer Actionsの実装
  - ProfileService（createProfile, updateProfile, getProfile, generateRandomNickname）を実装
  - Server Actionsで`profiles`テーブルへのCRUD操作を実装
  - ニックネーム10文字制限バリデーションとXSS対策サニタイゼーション
  - アバターID（30種類以上のプリセット）のホワイトリストバリデーション
  - ランダムニックネーム生成ロジック（「港の旅人123」形式）
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 19.3_

- [x] 3.2 プロフィール設定UIの実装
  - `/profile/setup`ページの作成（初回登録後に表示）
  - ニックネーム入力フォーム（10文字制限、リアルタイム文字数表示）
  - アバター選択UI（30種類以上、カテゴリー分類：動物、植物、食べ物、天気）
  - ランダム生成ボタンとプレビュー機能
  - 保存ボタンとバリデーションエラー表示
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 21.1, 21.4_

- [x]* 3.3 プロフィール機能のテスト実装
  - ProfileServiceのユニットテスト（バリデーションとランダム生成）
  - プロフィール作成・更新のServer Actionsテスト
  - E2Eテスト: 初回登録 → プロフィール設定 → 保存
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

### 4. 気分記録機能（3ステップ）の実装

- [x] 4.1 DailyQuestionServiceとマスターデータ登録
  - DailyQuestionService（getTodayQuestion, getQuestionById）を実装
  - 曜日判定ロジック（金曜・土曜はweekend、日曜はsunday、平日はカテゴリーローテーション）
  - `daily_questions`テーブルに質問マスターデータを手動登録（各カテゴリー10問程度）
  - 質問テキストと選択肢（3-4個）のサニタイゼーション
  - Server Actionsで質問取得APIを実装
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [x] 4.2 MoodRecordServiceとServer Actionsの実装
  - MoodRecordService（createRecord, updateRecord, getRecord, getRecordsByUser, deleteRecord）を実装
  - mood_level（1-5）、reasons（最大2つ）、memo（10文字以内）のバリデーション
  - Server Actionsで`mood_records`テーブルへのCRUD操作を実装
  - DailyQuestionServiceから当日の質問IDを取得して記録に関連付け
  - XSS対策とSQLインジェクション対策（Supabase Postgrest自動対応）
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.7, 3.8, 5.1, 5.2, 5.3, 19.3, 19.6_

- [x] 4.3 Zustand MoodRecordStoreの実装
  - MoodRecordStore（currentStep, moodLevel, selectedReasons, questionId, answerOption, memo, timeOfDay, weather, isSubmitting, error）を実装
  - setMoodLevel, toggleReason, setAnswer, setMemo, setTimeOfDay, setWeather, nextStep, resetForm, submitRecordアクションを実装
  - Zustand persistミドルウェアでlocalStorageに保存（フォーム復元用）
  - フォーム未完成時のリロード復元ロジック
  - 各ステップでのバリデーションとエラーメッセージ管理
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

- [x] 4.4 気分記録UI（ステップ1: 気分選択）の実装
  - `/record`ページの作成とステップ進行管理
  - ステップ1: 5段階気分アイコン（とても良い、良い、普通、少し疲れた、とても疲れた）の表示
  - タップで気分選択し自動遷移（アニメーション付き）
  - モバイルファーストデザインとタップ領域最小44x44px
  - ARIA属性とアクセシビリティ対応
  - _Requirements: 3.1, 3.2, 3.7, 21.1, 21.2, 21.4, 21.5_

- [x] 4.5 気分記録UI（ステップ2: 理由選択）の実装
  - ステップ2: 8つの理由カテゴリー（勉強・学校、人間関係、体調・健康、趣味・遊び、バイト・仕事、家族・家のこと、睡眠、特に理由なし）の表示
  - 最大2つまで選択可能なマルチセレクト機能
  - 選択状態の視覚的フィードバックとバリデーションメッセージ
  - 自動遷移（選択完了後、次ボタンまたはタップでステップ3へ）
  - _Requirements: 3.2, 3.3, 3.8, 21.1, 21.4_

- [x] 4.6 気分記録UI（ステップ3: 日替わり質問）の実装
  - ステップ3: 当日の日替わり質問と選択肢（3-4個）の表示
  - DailyQuestionServiceから取得した質問をレンダリング
  - タップで回答選択し記録完了
  - 完了アニメーション（Framer Motionで「船が港に入る」イメージ）
  - Server Actionsで記録データを一括送信（ネットワークリクエスト削減）
  - _Requirements: 3.4, 3.6, 4.1, 4.6, 18.2, 21.4_

- [x] 4.7 補足入力機能（オプション）の実装
  - 記録完了後の「もう少し詳しく」ボタンと補足入力モーダル
  - メモ入力フィールド（10文字以内、リアルタイム文字数表示）
  - 時間帯タグ選択（朝、昼、夕方、夜）
  - 天気選択（晴れ、曇り、雨、その他）
  - スキップボタンと保存ボタン
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [x]* 4.8 気分記録機能のテスト実装
  - MoodRecordServiceのユニットテスト（バリデーション、CRUD操作）
  - DailyQuestionServiceのユニットテスト（曜日判定ロジック）
  - MoodRecordStoreの状態遷移テスト
  - 統合テスト: ステップ1 → ステップ2 → ステップ3 → 記録保存 → Server Actions成功
  - E2Eテスト: ログイン → 記録 → 完了アニメーション表示
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.1, 4.6_

### 5. カレンダー表示機能の実装

- [x] 5.1 カレンダーUIとデータ取得の実装
  - `/calendar`ページの作成と月間カレンダービューの表示
  - MoodRecordServiceから当月の記録データを取得
  - 記録済みの日を5段階気分に対応した色で表示（色覚異常対応）
  - 記録していない日を灰色で表示
  - 連続記録日数の計算とカレンダー上部への表示
  - 月切り替え機能（前月・次月ボタン）
  - _Requirements: 6.1, 6.2, 6.3, 6.8, 21.5_

- [x] 5.2 記録詳細モーダルと編集・削除機能の実装
  - 日付タップ時の記録詳細モーダル表示
  - 詳細内容: 気分アイコン、理由カテゴリー、質問と回答、メモ、時間帯・天気、シェア状態
  - 編集ボタンタップで記録編集画面を表示
  - 削除ボタンタップで確認ダイアログを表示し削除実行
  - Server Actionsで記録の更新・削除を実行
  - _Requirements: 6.4, 6.5, 6.6, 6.7_

- [ ]* 5.3 カレンダー機能のテスト実装
  - カレンダー表示ロジックのユニットテスト
  - 連続記録日数計算のテスト
  - 統合テスト: 記録取得 → カレンダー表示 → 詳細モーダル → 編集・削除
  - E2Eテスト: カレンダー画面 → 日付タップ → 詳細表示 → 編集 → 保存
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8_

### 6. シェア機能とハーバー（タイムライン）の実装

- [x] 6.1 ShareServiceとSupabase Realtimeの統合
  - ShareService（createShare, getShare, deleteShare）を実装
  - Server Actionsで`shares`テーブルへのCRUD操作を実装
  - シェア作成時にexpires_at（created_at + 24時間）を自動設定
  - Supabase Realtimeチャンネルで`share:created`イベントをブロードキャスト
  - messageのXSS対策とshare_type + feelingの組み合わせバリデーション
  - _Requirements: 10.1, 10.2, 10.3, 10.10, 10.11, 10.12, 19.3_

- [x] 6.2 シェアUIの実装（シェア種類・気持ち・一言入力）
  - 記録完了後の「シェアする」ボタンとシェアモーダル
  - シェア種類選択（💙 励まし募集、💛 喜びシェア、💚 頑張った報告）
  - 選択したシェア種類に応じた気持ち選択肢の表示（各4つ）
  - 一言入力フィールド（10文字以内、定型文ボタン付き）
  - スキップ機能と投稿ボタン
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.9_

- [x] 6.3 HarborServiceとハーバーフィード取得の実装
  - HarborService（getFeed, subscribeToFeed）を実装
  - Server Actionsで`shares`と`profiles`をJOINしてハーバーフィードを取得
  - share_type別フィルターとソート機能（newest, most_reactions）
  - ページネーション（limit, offset）と無限スクロール対応
  - Supabase Realtimeで`share:created`, `reaction:added`, `reaction:removed`イベントを購読
  - 24時間以内の投稿のみ表示（expires_at < 現在時刻のフィルター）
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.8_

- [x] 6.4 ハーバーUIの実装（タイムラインと投稿カード）
  - `/harbor`ページの作成と3つのタブ（励まし募集、喜びシェア、頑張った報告）
  - 投稿カードの表示（アバター、ニックネーム、気分アイコン、気持ち、一言、投稿時刻相対表示、応援数、応援ボタン）
  - プルダウンで最新投稿読み込み
  - 新着通知（「新着○件」表示）
  - Supabase Realtimeでリアルタイム更新（新規投稿と応援カウント）
  - _Requirements: 11.1, 11.2, 11.5, 11.6, 11.7, 21.4_

- [x] 6.5 フィルター機能の実装
  - ハーバーのフィルターボタンとモーダル表示
  - 時間帯フィルター（朝、昼、夕、夜、すべて表示）
  - フィルター適用後のフィード再取得とUI更新
  - _Requirements: 12.1, 12.2, 12.3_

- [x] 6.6 24時間後の自動削除とユーザー通知
  - Supabase Functionまたはcronジョブでexpires_at < NOW()のshares削除
  - 削除前に「あなたの投稿は○○人に応援されました」通知を送信
  - 削除時に`share:deleted`イベントをRealtimeで配信
  - _Requirements: 11.8, 11.9_

- [ ]* 6.7 シェア・ハーバー機能のテスト実装
  - ShareServiceのユニットテスト（バリデーション、Realtime配信）
  - HarborServiceのユニットテスト（フィルター、ページネーション）
  - 統合テスト: シェア投稿 → Realtimeイベント配信 → ハーバー表示 → リアルタイム更新
  - E2Eテスト: ハーバー画面 → タブ切り替え → フィルター適用 → 投稿表示
  - _Requirements: 10.1, 10.10, 11.1, 11.2, 11.3, 11.5_

### 7. 応援・リアクション機能の実装

- [ ] 7.1 ReactionServiceとSupabase Realtime統合
  - ReactionService（addReaction, removeReaction, getReactionsByShare）を実装
  - Server Actionsで`reactions`テーブルへのCRUD操作を実装
  - 重複応援防止（UNIQUE(user_id, share_id)制約）と自己応援チェック
  - 応援追加時にsharesのreaction_countを更新
  - Supabase Realtimeで`reaction:added`, `reaction:removed`イベントを配信
  - _Requirements: 13.1, 13.5, 13.6, 13.7_

- [ ] 7.2 応援UIとスタンプ選択モーダルの実装
  - 投稿カードの「応援する」ボタンとスタンプ選択モーダル
  - シェア種類に応じたスタンプ（各6種類）の表示
  - スタンプタップで応援送信と完了アニメーション
  - 応援後30秒以内の取り消し機能（クライアント側タイムスタンプ制御）
  - 応援済み状態の視覚的フィードバック
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.8_

- [ ] 7.3 応援通知の実装
  - 応援追加時にNotificationServiceを呼び出し通知送信
  - リアルタイム通知（即座に配信）とまとめ通知（1日1回）の設定対応
  - 通知内容: 「○○さんがあなたを応援しました」
  - 通知タップで誰がどのスタンプを送ったかの詳細表示
  - _Requirements: 13.9, 13.10, 14.3, 14.4_

- [ ]* 7.4 応援機能のテスト実装
  - ReactionServiceのユニットテスト（重複チェック、自己応援チェック）
  - 統合テスト: 応援追加 → Realtimeイベント配信 → ハーバー応援カウント更新 → 通知送信
  - E2Eテスト: ハーバー表示 → 応援ボタンタップ → スタンプ選択 → 応援完了 → 通知確認
  - _Requirements: 13.1, 13.5, 13.6, 13.7, 13.9_

### 8. 通知機能の実装

- [ ] 8.1 NotificationServiceとWeb Push API統合
  - NotificationService（sendNotification, getNotificationSettings, updateNotificationSettings）を実装
  - Web Push APIでプッシュ通知送信（record_reminder, reaction_realtime, reaction_summary, weekly_summary, streak_reminder）
  - `notification_settings`テーブルへのCRUD操作をServer Actionsで実装
  - おやすみモード時間帯判定と通知スキップロジック
  - 一時停止期間中の全通知停止
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.6, 14.7_

- [ ] 8.2 記録リマインダー通知の実装
  - Supabase Functionまたはcronジョブで毎日設定時刻（デフォルト21時）にリマインダー送信
  - 未記録ユーザーのみに通知送信（当日のmood_records存在チェック）
  - 連続記録中の場合は「○日連続記録中！今日も記録しませんか？」メッセージ
  - 通知タップで記録画面へ直接遷移
  - _Requirements: 14.1, 14.2, 14.5_

- [ ] 8.3 通知設定UIの実装
  - `/settings/notifications`ページの作成
  - 記録リマインダーのオン/オフ切り替えと時刻設定
  - 応援通知モード選択（リアルタイム、まとめ、オフ）
  - おやすみモードのオン/オフと時間帯設定
  - 一時停止設定（1日、3日、1週間、無期限）
  - _Requirements: 14.1, 14.3, 14.4, 14.6, 14.7_

- [ ]* 8.4 通知機能のテスト実装
  - NotificationServiceのユニットテスト（通知送信ロジック、設定チェック）
  - 記録リマインダーの定期実行テスト（モック時刻で動作確認）
  - 統合テスト: 応援追加 → 通知送信 → ユーザー受信確認
  - E2Eテスト: 通知設定変更 → リマインダー受信 → 記録画面遷移
  - _Requirements: 14.1, 14.2, 14.3, 14.4_

### 9. 分析機能（サマリー・レポート・インサイト）の実装

- [ ] 9.1 (P) SummaryServiceと週間サマリーの実装
  - SummaryService（generateWeeklySummary）を実装
  - 先週（月曜-日曜）の気分データを集計（気分グラフ、最も多かった気分、記録日数/7日、最も多かった理由カテゴリー）
  - Supabase Functionまたはcronジョブで毎週月曜朝9時にサマリー生成と通知送信
  - サマリー詳細画面（折れ線グラフ、統計情報、励ましメッセージ）の実装
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 9.2 (P) 月間レポート機能の実装
  - `/stats`ページの作成と月間レポートの表示
  - 月間気分分布の円グラフ表示（Chart.js or Recharts使用）
  - 曜日別気分傾向の棒グラフ表示
  - 理由カテゴリーの割合表示
  - 連続記録最長日数と質問回答傾向の表示
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [ ] 9.3 (P) InsightServiceとパターン検出の実装
  - InsightService（detectPatterns）を実装
  - 30日以上のデータで天候・曜日・時間帯と気分の相関分析
  - 検出パターン: 「雨の日は気分が下がりがち」「趣味の日は気分が良い」など
  - インサイトをテキストカードとして統計画面に表示
  - サーバーサイドで定期的にパターン検出（1日1回程度）
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ]* 9.4 分析機能のテスト実装
  - SummaryServiceのユニットテスト（集計ロジック）
  - InsightServiceのユニットテスト（パターン検出ロジック）
  - 統合テスト: サマリー生成 → 通知送信 → 詳細画面表示
  - E2Eテスト: 統計画面表示 → グラフレンダリング → インサイト表示
  - _Requirements: 7.1, 7.2, 8.1, 8.2, 9.1, 9.2_

### 10. プライバシー設定とデータエクスポート

- [ ] 10.1 (P) プライバシー設定機能の実装
  - `/settings/privacy`ページの作成
  - 投稿公開範囲設定（全体公開、公開しない）の実装
  - 「公開しない」選択時のシェア機能無効化ロジック
  - ブロック機能の実装（指定ユーザーの投稿非表示）
  - ブロック時の通知送信防止
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [ ] 10.2 (P) ExportServiceとデータエクスポート機能の実装
  - ExportService（exportAsJSON, exportAsCSV）を実装
  - 全記録データ（気分レベル、理由カテゴリー、質問と回答、メモ、投稿情報、タイムスタンプ）をJSON形式でエクスポート
  - CSV形式のエクスポート機能
  - ダウンロードボタンと進行状態表示
  - GDPR準拠のデータポータビリティ保証
  - _Requirements: 16.1, 16.2, 16.3, 16.4_

- [ ]* 10.3 プライバシー・エクスポート機能のテスト実装
  - プライバシー設定のユニットテスト（公開範囲、ブロック機能）
  - ExportServiceのユニットテスト（JSON/CSV形式変換）
  - E2Eテスト: プライバシー設定変更 → シェアボタン無効化確認
  - E2Eテスト: データエクスポート実行 → ダウンロード確認
  - _Requirements: 15.1, 15.2, 16.1, 16.2_

### 11. オンボーディングとチュートリアル

- [ ] 11.1 オンボーディングUIの実装
  - `/onboarding`ページの作成と初回登録後の自動表示
  - チュートリアルスライド（「毎日3タップで記録完了」「シェアして誰かとつながれる」「応援もタップだけ」）
  - Framer Motionでアニメーション付きチュートリアル
  - スキップボタンと次へボタン
  - 初回気分記録画面への遷移
  - _Requirements: 17.1, 17.2, 17.3, 17.4_

- [ ] 11.2 プライバシーポリシー同意の実装
  - プライバシーポリシーページの作成（`/privacy-policy`）
  - サインアップ時のプライバシーポリシーへの同意チェックボックス必須化
  - 同意なしではアカウント作成不可の制御
  - _Requirements: 17.5_

- [ ]* 11.3 オンボーディング機能のテスト実装
  - E2Eテスト: 初回登録 → チュートリアル表示 → スキップ → 記録画面遷移
  - E2Eテスト: 初回記録完了 → 「これだけ！」メッセージ表示
  - プライバシーポリシー同意チェックのバリデーションテスト
  - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5_

### 12. PWAオフライン同期機能の実装

- [ ] 12.1 PWAServiceとオフライン記録キューの実装
  - PWAService（registerServiceWorker, cacheRecord, syncOfflineRecords, clearCache）を実装
  - IndexedDBで未同期記録をキュー管理（OfflineRecord型）
  - オフライン時の記録データをIndexedDBに保存
  - オンライン復帰検知（`online`イベント）時の同期トリガー
  - Service Worker background syncでリトライ処理
  - _Requirements: 18.1, 18.2, 18.3_

- [ ] 12.2 オフライン同期UIと状態表示の実装
  - オフライン状態のインジケーター表示（「オフライン」バッジ）
  - 同期中のローディング表示
  - 同期完了・失敗の通知表示
  - IndexedDB容量上限監視と警告メッセージ
  - 古いデータの自動削除ロジック
  - _Requirements: 18.1, 18.2, 18.3_

- [ ]* 12.3 オフライン同期機能のテスト実装
  - PWAServiceのユニットテスト（IndexedDB操作、同期ロジック）
  - 統合テスト: オフライン記録 → IndexedDB保存 → オンライン復帰 → Server Actions送信 → 同期完了
  - E2Eテスト: ネットワーク切断 → 記録実行 → オフライン表示 → ネットワーク復帰 → 同期完了通知
  - _Requirements: 18.1, 18.2, 18.3_

### 13. パフォーマンス最適化とアクセシビリティ

- [ ] 13.1 パフォーマンス最適化の実装
  - Next.js Image最適化（自動リサイズ、WebP変換、遅延読み込み）
  - React Server Componentsの活用でTTFB短縮
  - Service Workerキャッシュでページ読み込み高速化
  - Supabase Realtimeの接続再利用
  - Lighthouseでパフォーマンス測定（LCP < 2.5s, FID < 100ms, CLS < 0.1）
  - _Requirements: 18.1, 18.2, 18.3, 18.4_

- [ ] 13.2 アクセシビリティ対応の実装
  - 全UIコンポーネントにARIA属性を追加
  - キーボードナビゲーション対応
  - スクリーンリーダー対応（alt属性、role属性）
  - 色覚異常ユーザー対応の色使い検証
  - タップ可能なボタン最小44x44pxの確認
  - _Requirements: 21.1, 21.2, 21.4, 21.5_

- [ ]* 13.3 パフォーマンス・アクセシビリティのテスト実装
  - Lighthouseによるパフォーマンステスト（2秒以内読み込み、1秒以内保存、3秒以内タイムライン表示）
  - 60FPSアニメーション計測
  - 同時接続100ユーザーのRealtime配信遅延測定
  - アクセシビリティ自動テスト（axe-core）
  - _Requirements: 18.1, 18.2, 18.3, 18.4, 21.1_

### 14. セキュリティ強化とRow Level Security

- [ ] 14.1 Row Level Security (RLS)ポリシーの実装
  - `profiles`テーブルのRLSポリシー（ユーザーは自分のプロフィールのみCRUD可能）
  - `mood_records`テーブルのRLSポリシー（ユーザーは自分の記録のみCRUD可能）
  - `shares`テーブルのRLSポリシー（プライバシー設定に応じた公開範囲制御）
  - `reactions`テーブルのRLSポリシー（ユーザーは自分の応援のみ削除可能）
  - `notification_settings`テーブルのRLSポリシー（ユーザーは自分の設定のみCRUD可能）
  - _Requirements: 19.1, 19.6_

- [ ] 14.2 XSSとCSRF対策の実装
  - React自動エスケープの確認
  - DOMPurifyでユーザー入力のサニタイゼーション（ニックネーム、メモ、一言メッセージ）
  - Supabase Auth SDKのCSRFトークン確認
  - Same-Site Cookie設定の確認
  - Content Security Policy (CSP)ヘッダーの設定
  - _Requirements: 19.3, 19.4_

- [ ]* 14.3 セキュリティテストの実装
  - RLSポリシーのテスト（他ユーザーのデータへのアクセス拒否確認）
  - XSS脆弱性テスト（ユーザー入力にスクリプトタグ注入試行）
  - CSRF脆弱性テスト（外部サイトからのリクエスト拒否確認）
  - SQLインジェクションテスト（Supabase Postgrestの自動対応確認）
  - _Requirements: 19.1, 19.3, 19.4, 19.6_

### 15. 統合テストとE2Eテスト

- [ ] 15.1 認証フローの統合テスト
  - サインアップ → プロフィール設定 → ログイン → ログアウトフロー
  - OAuth認証フロー（Google）の動作確認
  - アカウント削除とデータCASCADE削除の確認
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1_

- [ ] 15.2 気分記録フローの統合テスト
  - 気分選択 → 理由選択 → 質問回答 → 記録保存 → カレンダー表示
  - 補足入力（メモ、時間帯、天気）の動作確認
  - 記録編集・削除の動作確認
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 5.1, 6.4_

- [ ] 15.3 シェア・ハーバー・応援フローの統合テスト
  - シェア投稿 → ハーバー表示 → 応援追加 → 通知配信
  - Realtimeリアルタイム配信の動作確認
  - 24時間後の自動削除と通知の動作確認
  - _Requirements: 10.1, 10.10, 11.1, 11.5, 13.1, 13.9_

- [ ] 15.4 オフライン同期フローの統合テスト
  - オフライン記録 → IndexedDB保存 → オンライン復帰 → 同期完了
  - 同期失敗時のリトライ処理の動作確認
  - IndexedDB容量上限の動作確認
  - _Requirements: 18.1, 18.2, 18.3_

- [ ] 15.5 E2Eテストスイートの実装
  - 記録フロー全体（ログイン → 記録 → 完了アニメーション表示）
  - ハーバー閲覧と応援（ハーバー表示 → 投稿カードタップ → スタンプ選択 → 応援完了）
  - カレンダー表示と記録編集（カレンダー表示 → 日付タップ → 詳細モーダル → 編集）
  - オンボーディング（初回登録 → チュートリアル → 初回記録）
  - プライバシー設定（設定画面 → 公開範囲変更 → シェアボタン無効化確認）
  - _Requirements: 3.1, 3.6, 6.4, 11.1, 13.1, 15.1, 17.1_

### 16. 最終統合とデプロイ準備

- [ ] 16.1 全機能の統合確認
  - 全ドメイン（認証、記録、コミュニティ、通知、分析、設定）の動作確認
  - Server Components、Server Actions、Realtime、PWAの連携確認
  - モバイル・タブレット・PCでのレスポンシブ動作確認
  - 全エラーハンドリングパスの動作確認
  - _Requirements: 18.1, 18.2, 21.2, 21.3_

- [ ] 16.2 パフォーマンス最終検証
  - Lighthouseで全ページのパフォーマンス測定（目標: ページ読み込み2秒以内）
  - 気分記録保存1秒以内の確認
  - ハーバー表示3秒以内の確認
  - 60FPSアニメーション動作確認
  - 同時接続100ユーザーの負荷テスト
  - _Requirements: 18.1, 18.2, 18.3, 18.4_

- [ ] 16.3 セキュリティ最終検証
  - 全RLSポリシーの動作確認
  - HTTPS通信の強制確認
  - XSS・CSRF・SQLインジェクション対策の最終確認
  - 個人情報暗号化の確認
  - _Requirements: 1.6, 19.1, 19.2, 19.3, 19.4, 19.5, 19.6_

- [ ] 16.4 可用性・スケーラビリティ準備
  - Supabase Proプラン移行準備（初期想定1000ユーザー対応）
  - Vercel Serverless Functionsの自動スケール設定確認
  - エラー追跡（Sentry）の統合
  - ヘルスモニタリング（Vercel Analytics + Supabase Dashboard）の設定
  - _Requirements: 20.1, 20.2, 20.3, 20.4_
