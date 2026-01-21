# PWA機能

Mood HarborのPWA（Progressive Web App）機能を提供するモジュールです。

## 概要

このモジュールは以下の機能を提供します:

- Service Workerの管理
- オフライン時のデータ保存（IndexedDB）
- ネットワーク状態の検知
- PWAインストールの管理

## ファイル構成

- `types.ts`: PWA関連の型定義
- `indexed-db.ts`: IndexedDBの操作ユーティリティ
- `service-worker-utils.ts`: Service Worker関連のユーティリティ

## 使用方法

### オンライン/オフライン検知

```typescript
import { isOnline, addNetworkStatusListener } from "@/lib/pwa/service-worker-utils";

// 現在のネットワーク状態を確認
const online = isOnline();

// ネットワーク状態の変更を監視
const unsubscribe = addNetworkStatusListener((status) => {
  console.log("Network status:", status);
});

// クリーンアップ
unsubscribe();
```

### オフライン記録の保存

```typescript
import {
  saveOfflineRecord,
  getAllOfflineRecords,
  deleteOfflineRecord,
} from "@/lib/pwa/indexed-db";
import type { OfflineRecord } from "@/lib/pwa/types";

// オフライン記録を保存
const record: OfflineRecord = {
  temp_id: crypto.randomUUID(),
  data: {
    user_id: "user123",
    mood_level: 3,
    reasons: ["study_school"],
    question_id: "q1",
    answer_option: "good",
  },
  created_at: new Date().toISOString(),
};

await saveOfflineRecord(record);

// 全てのオフライン記録を取得
const records = await getAllOfflineRecords();

// オフライン記録を削除
await deleteOfflineRecord(record.temp_id);
```

### Service Workerのメッセージング

```typescript
import {
  sendMessageToServiceWorker,
  subscribeToServiceWorkerMessages,
} from "@/lib/pwa/service-worker-utils";

// Service Workerにメッセージを送信
await sendMessageToServiceWorker({ type: "SYNC_REQUEST" });

// Service Workerからのメッセージを購読
const unsubscribe = subscribeToServiceWorkerMessages((data) => {
  console.log("Message from Service Worker:", data);
});

// クリーンアップ
unsubscribe();
```

## 技術仕様

### IndexedDBスキーマ

- **データベース名**: `mood-harbor-offline`
- **バージョン**: 1
- **オブジェクトストア**: `offline-records`
  - キーパス: `temp_id`
  - インデックス: `created_at`

### Service Worker設定

- **キャッシュ戦略**:
  - 記録データ: Network First（オフライン時はキャッシュ）
  - 静的アセット: Cache First（高速表示）
- **自動登録**: 本番環境のみ有効
- **開発環境**: Service Worker無効化

## テスト

```bash
# PWA機能のテスト実行
npm test -- __tests__/pwa/pwa-setup.test.ts
```

## 注意事項

- Service Workerはブラウザ環境でのみ動作します
- IndexedDBはプライベートブラウジングモードでは制限される場合があります
- オフライン記録は同期完了後に自動削除されます
