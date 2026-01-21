# 調査・設計決定ログ

---
**目的**: 技術設計を裏付けるディスカバリー成果、アーキテクチャ調査、および根拠を記録する。

**用途**:
- ディスカバリー段階における調査活動と成果をログに記録
- `design.md`には詳細すぎる設計決定のトレードオフを文書化
- 将来の監査や再利用のための参考資料と証拠を提供
---

## 概要
- **機能**: `mood-harbor-app`
- **ディスカバリー範囲**: 新規機能開発（New Feature - greenfield）/ 複雑な統合
- **主要な発見**:
  - Next.js 16 App Router + React 19 Server Componentsによるモダンな構成を採用
  - Supabase（PostgreSQL + Auth + Realtime）を統合バックエンドとして活用
  - モバイルファーストPWAとしてオフライン対応とインストール可能性を実現
  - TypeScript strict mode + Zustand/Jotaiによる型安全な状態管理パターン

## 調査ログ

### Next.js 16 App Router認証パターン
- **コンテキスト**: セキュアなユーザー認証・アカウント管理機能の実装方式の検討
- **参照元**:
  - [Next.js Authentication Guide](https://nextjs.org/docs/app/guides/authentication)
  - [Robust Security & Authentication Best Practices in Next.js 16](https://medium.com/@sureshdotariya/robust-security-authentication-best-practices-in-next-js-16-6265d2d41b13)
  - [Auth.js v5 with Next.js 16](https://javascript.plainenglish.io/stop-crying-over-auth-a-senior-devs-guide-to-next-js-15-auth-js-v5-42a57bc5b4ce)
- **発見**:
  - React Server Components (RSC)を活用したサーバーサイドファーストのセキュリティ設計
  - パスワードはbcrypt/Argon2でハッシュ化し、データベース保存前に処理
  - middlewareによるルート保護がリクエストエントリーポイントで実現可能
  - Auth.js v5（NextAuth）がNext.js 16 App Routerの推奨認証ライブラリ
  - Server ComponentsでのRole-Based Access Controlによる条件付きレンダリング
  - .envファイルの秘密鍵管理とセッション無効化リスクの認識
- **影響**:
  - Supabase Authをメイン認証プロバイダーとして採用（OAuth、メール/パスワード、電話認証サポート）
  - Next.js middlewareでグローバルな認証チェックとルート保護を実装
  - Server Actionsを用いたサーバーサイドでの認証状態の検証

### React 19状態管理とコンカレントレンダリング
- **コンテキスト**: 感情記録データの状態管理とパフォーマンス最適化
- **参照元**:
  - [React 19 State Management Libraries 2026](https://fe-tool.com/awesome-react-state-management)
  - [Best State Management Strategies in React 19](https://medium.com/@roman_j/the-best-state-management-strategies-in-react-19-bb51f64775c6)
  - [React Stack Patterns 2026](https://www.patterns.dev/react/react-2026/)
- **発見**:
  - Zustand: 軽量でスケーラブルな状態管理、シンプルなFlux原則を採用
  - Jotai: Atomic状態管理、React 19のconcurrent modeに最適化
  - Redux: 2026年時点でnpmトレンドでトップ維持、大規模アプリに有効
  - MobX: observable状態と自動依存追跡による効率的な再レンダリング
  - React 19のServer Componentsとの統合が重要になり、サーバーサイドレンダリングとストリーミングが可能
- **影響**:
  - 感情記録アプリには軽量かつatomic状態管理が適合（Zustand or Jotai推奨）
  - ユーザー認証状態、記録データ、UIステートを分離して管理
  - Server ComponentsとClient Componentsの境界を明確にする

### Supabaseリアルタイム機能と認証
- **コンテキスト**: リアルタイムタイムライン更新と安全なデータアクセス制御
- **参照元**:
  - [Supabase Platform Features](https://supabase.com/)
  - [Supabase Realtime Authorization](https://supabase.com/docs/guides/realtime/authorization)
  - [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- **発見**:
  - Elixirサーバーによるリアルタイム機能：PostgreSQLのレプリケーション機能を利用してWebSocket経由でデータ変更をブロードキャスト
  - 複数の認証方法：メール/パスワード、パスワードレス、OAuth、電話ログイン、Web3（Ethereum/Solana）、匿名サインイン、MFA
  - Row Level Security (RLS)ポリシーによる行単位のアクセス制御、Supabase SDKとの自動統合
  - 認証トークンが自動的にデータベースリクエストに付与され、手動のトークン処理が不要
  - Realtime AuthorizationはPublic Beta（supabase-js v2.44.0以降で利用可能）
  - 2026年のセキュリティロードマップと機能強化が進行中
- **影響**:
  - Supabaseをバックエンドプラットフォームとして全面採用
  - Realtime機能でハーバー（タイムライン）の投稿と応援をリアルタイム反映
  - RLSポリシーでユーザーごとのデータアクセスを厳密に制御

### モバイルファーストPWAとオフライン対応
- **コンテキスト**: モバイル優先のUX設計とPWA化によるネイティブアプリ体験
- **参照元**:
  - [Next.js 16 PWA Guide](https://nextjs.org/docs/app/guides/progressive-web-apps)
  - [PWA + Next.js 15/16: React Server Components & Offline-First](https://medium.com/@mernstackdevbykevin/progressive-web-app-next-js-15-16-react-server-components-is-it-still-relevant-in-2025-4dff01d32a5d)
  - [Next.js 16 PWA Implementation](https://www.buildwithmatija.com/blog/turn-nextjs-16-app-into-pwa)
- **発見**:
  - Next.js 16とReact Server Componentsの成熟により、PWA実装が実用的に
  - 米国成人の16%がスマートフォンのみのインターネットユーザーであり、モバイルファーストPWAの重要性が高い
  - Serwist（Workboxのフォーク）がNext.js向けのオフライン対応を提供
  - @ducanh2912/next-pwaがNext.js 13+、14、16のApp Routerをサポート
  - cacheOnFrontEndNav、aggressiveFrontEndNavCaching、reloadOnOnlineなどの機能が利用可能
  - manifest、service worker、push notificationの追加で10分でPWA化可能
- **影響**:
  - next-pwaまたはSerwistを用いたPWA設定
  - manifest.jsonの定義とservice workerによるキャッシング戦略
  - オフライン時の記録データをローカルに保存し、オンライン復帰時に同期

### TypeScript Strict ModeとReact 19ベストプラクティス
- **コンテキスト**: 型安全性の強化とコード品質の維持
- **参照元**:
  - [React 19 Strict Mode](https://react.dev/reference/react/StrictMode)
  - [TypeScript Strict Mode Guide](https://typescriptworld.com/the-ultimate-guide-to-typescript-strict-mode-elevating-code-quality-and-safety)
  - [React 19 TypeScript Best Practices 2025](https://medium.com/@CodersWorld99/react-19-typescript-best-practices-the-new-rules-every-developer-must-follow-in-2025-3a74f63a0baf)
- **発見**:
  - TypeScript strict mode（`"strict": true`）は型チェックオプションのスイートを有効化
  - noImplicitAny: 暗黙的なany型を禁止、明示的な型定義を強制
  - strictNullChecks: null、undefined、実際の値を区別し、ランタイムエラーを防止
  - strictFunctionTypes: 関数パラメータの反変性を保証
  - React Strict Modeは開発時のみのツールで、追加チェックを実行（本番ビルドには影響なし）
  - Concurrent renderingの機能依存により、Strict Modeが強制するパターンに従う必要
  - 新規コンポーネントや独立したセクションから始め、段階的に全体に適用
- **影響**:
  - tsconfig.jsonで`"strict": true`を設定
  - Reactアプリ全体を`<StrictMode>`でラップ
  - anyの使用を禁止し、全インターフェースで明示的な型定義を実施

### Framer Motion（Motion）アニメーション性能
- **コンテキスト**: 気分記録完了アニメーションと滑らかなUXの実現
- **参照元**:
  - [Motion Official Documentation](https://motion.dev/docs/react)
  - [Framer Motion Performance Tips](https://tillitsdone.com/blogs/framer-motion-performance-tips/)
  - [React 19 Animation Guide](https://blog.logrocket.com/creating-react-animations-with-motion/)
- **発見**:
  - Framer MotionはMotionにリブランド（2025年初頭）
  - ハイブリッドエンジン：ネイティブブラウザアニメーションのパフォーマンスとJavaScriptの柔軟性を両立
  - 120fpsアニメーション＆ジェスチャーをサポート
  - requestAnimationFrameループと自動バッチングで滑らかなアニメーション
  - React 19互換性：2025年9月にFramer Motion v11で更新、スクロールベースおよび速度駆動アニメーションの改善
  - パフォーマンス最適化手法：
    - LazyMotion、domAnimations、lazy mをグローバル設定で使用
    - transformとopacityプロパティのアニメーションでハードウェアアクセラレーション活用
    - layoutプロップでレイアウトアニメーションを最小限の再レンダリングで実現
    - useInViewで遅延ローディング
- **影響**:
  - Framer Motionを採用し、記録完了時の「船が港に入る」アニメーションを実装
  - transformとopacityを中心としたアニメーション設計
  - LazyMotionで初期バンドルサイズを削減

### TailwindCSS v4ダークモードとモバイルファースト
- **コンテキスト**: レスポンシブUIとダークモード対応
- **参照元**:
  - [TailwindCSS v4 Dark Mode](https://tailwindcss.com/docs/dark-mode)
  - [Tailwind CSS v4.0 Blog](https://tailwindcss.com/blog/tailwindcss-v4)
  - [Dark/Light Mode with Tailwind v4 and Next.js](https://www.thingsaboutweb.dev/en/posts/dark-mode-with-tailwind-v4-nextjs)
- **発見**:
  - TailwindCSS v4の最大の変更：ダークモード設定がJavaScript configファイルではなくCSS内で定義
  - データ属性でダークモードを制御可能：`@variant dark (&:where([data-theme="dark"], [data-theme="dark"] *))`
  - モバイルファースト哲学を維持、ユーティリティはレスポンシブバリアントで上書きしない限り全てのブレイクポイントに適用
  - パフォーマンス向上：フルビルドが最大5倍高速、インクリメンタルビルドが100倍以上高速（マイクロ秒単位）
  - インストールが簡素化：依存関係が少なく、設定不要、CSS内で1行追加のみ
  - CSS変数を使った複数テーマサポートについて議論継続中（2025-2026）
- **影響**:
  - TailwindCSS v4を採用しモバイルファーストデザインを実現
  - ダークモード対応は将来的な拡張として準備（初期はライトモードのみ）
  - CSS-first設定によるシンプルな統合

### Next.js 16 Edge Runtimeとパフォーマンス最適化
- **コンテキスト**: 高速なページ読み込みとサーバーレスデプロイメント
- **参照元**:
  - [Next.js 16 Release](https://nextjs.org/blog/next-16)
  - [Next.js 16 Server Actions: TTFB Boost](https://markaicode.com/nextjs-16-server-actions-edge-runtime-ttfb/)
  - [Next.js 16 Middleware & Edge Functions](https://medium.com/@mernstackdevbykevin/next-js-16-middleware-edge-functions-latest-patterns-in-2025-8ab2653bc9de)
- **発見**:
  - Next.js 16の重要なパフォーマンス最適化：`next dev`と`next start`コマンドの改善
  - ターミナル出力の改善：明確なフォーマット、より良いエラーメッセージ、パフォーマンスメトリクスの向上
  - Server ActionsとストリーミングレスポンスがEdge Runtimeでより信頼性を持つように改善
  - Edge Runtimeパターンが成熟し、初期採用者が直面した複雑性なしにエッジでロジックを実装可能
  - TTFB改善：Next.js 16のServer ActionsはEdge Runtime最適化により最大300%のTTFB短縮
  - ルーティング最適化：
    - レイアウト重複排除（共有レイアウトは一度だけダウンロード）
    - インクリメンタルプリフェッチ（キャッシュにない部分のみプリフェッチ）
  - キャッシング強化：fetchオプション、revalidate、タグベースの無効化による一貫性向上
  - 注意：新しいproxy systemではEdge Runtimeがサポートされていない、middlewareを使用継続
- **影響**:
  - Next.js 16のApp RouterとServer Actionsを活用
  - Edge Runtimeをmiddlewareで使用し、認証チェックやルート保護を実現
  - キャッシング戦略を活用してパフォーマンス要件（ページ読み込み2秒以内、記録保存1秒以内）を達成

## アーキテクチャパターン評価

| オプション | 説明 | 強み | リスク/制限 | 備考 |
|--------|-------------|-----------|---------------------|-------|
| クリーンアーキテクチャ | ドメイン中心のレイヤー分離 | テスタビリティ、保守性 | 小規模アプリには過剰 | 将来的な拡張性を考慮 |
| Feature-Sliced Design | 機能ごとにファイルを分離 | 並行開発しやすい、スケーラブル | 初期設定が複雑 | Next.js App Routerと相性良好 |
| Server-First Architecture | React Server Componentsを最大活用 | パフォーマンス、SEO、セキュリティ | クライアントステート管理が複雑化 | Next.js 16推奨パターン、採用 |

## 設計決定

### 決定: Supabaseを統合バックエンドプラットフォームとして採用

- **コンテキスト**: 認証、データベース、リアルタイム機能を一元管理する必要
- **検討した代替案**:
  1. Firebase — Google製、類似機能だがPostgreSQLではなくNoSQL
  2. カスタムバックエンド（Node.js + PostgreSQL + Socket.io）— 柔軟性が高いが開発コストと保守負担が大
  3. Auth0 + Prisma + PostgreSQL — 個別サービスの組み合わせ、統合の複雑性
- **選択したアプローチ**: Supabase（PostgreSQL + Auth + Realtime + Storage）
- **根拠**:
  - PostgreSQLベースでリレーショナルデータモデルに最適
  - Row Level Security (RLS)による強力なアクセス制御
  - リアルタイム機能がネイティブで統合され、追加のWebSocketサーバー不要
  - Next.js公式ドキュメントでもSupabaseが推奨される事例が多い
  - 無料プランで初期開発可能、スケーラビリティも確保
- **トレードオフ**:
  - 利点：開発速度向上、インフラ管理不要、セキュリティベストプラクティスの自動適用
  - 欠点：ベンダーロックインのリスク、カスタマイズの制約
- **フォローアップ**: 本番環境移行前にSupabase RLSポリシーの詳細テストを実施

### 決定: Zustandを主要な状態管理ライブラリとして採用

- **コンテキスト**: 感情記録、認証状態、UI状態を効率的に管理
- **検討した代替案**:
  1. Redux — 大規模アプリ向け、ボイラープレートが多い
  2. Jotai — Atomic状態管理、React 19 concurrent modeに最適
  3. React Context + useReducer — シンプルだがパフォーマンス問題の可能性
- **選択したアプローチ**: Zustand
- **根拠**:
  - 軽量で学習コストが低い
  - Fluxパターンをシンプルに実装
  - React 19との互換性が高く、concurrent renderingに対応
  - ミドルウェアでpersistやdevtoolsサポート
  - 感情記録アプリのようなatomicなデータ管理に最適
- **トレードオフ**:
  - 利点：バンドルサイズ削減、開発速度向上、パフォーマンス最適化
  - 欠点：大規模化した際にReduxほどのエコシステムはない
- **フォローアップ**: 状態のpersist設定（localStorage連携）とdevtoolsの統合を実装時に確認

### 決定: PWA対応とオフライン同期機能の実装

- **コンテキスト**: モバイルユーザーの利便性向上とオフライン環境での記録継続性
- **検討した代替案**:
  1. PWA対応なし — シンプルだがオフライン時に利用不可
  2. Capacitor/React Nativeによるネイティブアプリ化 — ストア配信可能だが開発コスト大
  3. PWA + 同期機能 — Web技術のみで実現、インストール可能
- **選択したアプローチ**: PWA + service workerによるオフライン同期
- **根拠**:
  - Next.js 16とReact Server Componentsの成熟によりPWA実装が実用的
  - @ducanh2912/next-pwaがApp Routerをサポート
  - 学生ユーザーが多く、モバイル環境での利用が中心
  - オフライン時も記録を継続でき、オンライン復帰時に同期
  - ネイティブアプリなしでホーム画面追加とプッシュ通知が可能
- **トレードオフ**:
  - 利点：開発コスト削減、Webとネイティブのギャップ縮小、ストア審査不要
  - 欠点：ネイティブAPIへのアクセス制限、iOSでのPWA制限
- **フォローアップ**: service worker戦略の選定（NetworkFirst、CacheFirstなど）と同期ロジックの実装

### 決定: TypeScript strict modeとReact Strict Modeを有効化

- **コンテキスト**: 型安全性とコード品質の確保、バグの早期発見
- **検討した代替案**:
  1. TypeScript非strict mode — 柔軟だが型の抜け穴が多い
  2. PropTypes（JavaScript） — 型チェックが弱く、ビルド時の検証不可
  3. Strict mode有効化 — 厳格だが品質向上
- **選択したアプローチ**: TypeScript strict mode + React Strict Mode
- **根拠**:
  - 型安全性がバグを未然に防ぎ、リファクタリングを安全に実施可能
  - noImplicitAny、strictNullChecksによりランタイムエラー削減
  - React Strict Modeで副作用やクリーンアップの問題を開発時に検出
  - React 19のconcurrent renderingとの互換性確保
  - チーム開発時にコード品質を統一
- **トレードオフ**:
  - 利点：バグ削減、保守性向上、リファクタリング安全性
  - 欠点：初期開発時の学習コスト、型定義の手間
- **フォローアップ**: tsconfig.jsonで`"strict": true`を設定、eslintルールでanyを禁止

## リスクと緩和策

- **リスク1: Supabaseベンダーロックイン** — データエクスポート機能を実装し、PostgreSQL互換の他サービスへの移行パスを確保
- **リスク2: PWAのiOS制限** — iOSユーザーへの説明とホーム画面追加ガイドを提供、将来的にCapacitor移行を検討
- **リスク3: リアルタイム機能の負荷** — Supabase Realtimeの接続数制限を把握し、必要に応じてポーリングへのフォールバック実装
- **リスク4: 型安全性とReact Server Components境界の混乱** — Server/Client Components間のprops型定義を明確化、zod等でランタイムバリデーション追加
- **リスク5: パフォーマンス要件未達** — 初期段階でLighthouse計測とCore Web Vitals監視、Next.js Image最適化とEdge Runtimeの活用

## 参考文献

- [Next.js Authentication Guide](https://nextjs.org/docs/app/guides/authentication)
- [Robust Security & Authentication Best Practices in Next.js 16](https://medium.com/@sureshdotariya/robust-security-authentication-best-practices-in-next-js-16-6265d2d41b13)
- [React 19 State Management Libraries 2026](https://fe-tool.com/awesome-react-state-management)
- [Supabase Platform](https://supabase.com/)
- [Supabase Realtime Authorization](https://supabase.com/docs/guides/realtime/authorization)
- [PWA + Next.js 15/16: React Server Components](https://medium.com/@mernstackdevbykevin/progressive-web-app-next-js-15-16-react-server-components-is-it-still-relevant-in-2025-4dff01d32a5d)
- [TypeScript Strict Mode Guide](https://typescriptworld.com/the-ultimate-guide-to-typescript-strict-mode-elevating-code-quality-and-safety)
- [Framer Motion Performance Tips](https://tillitsdone.com/blogs/framer-motion-performance-tips/)
- [TailwindCSS v4 Blog](https://tailwindcss.com/blog/tailwindcss-v4)
- [Next.js 16 Release](https://nextjs.org/blog/next-16)
- [Next.js 16 Server Actions: TTFB Boost](https://markaicode.com/nextjs-16-server-actions-edge-runtime-ttfb/)
