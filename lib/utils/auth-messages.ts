/**
 * 認証エラーメッセージのマッピング
 */

import type { AuthError } from "@/lib/services/auth";

/**
 * AuthErrorを日本語のエラーメッセージに変換
 */
export function getAuthErrorMessage(error: AuthError): string {
  switch (error.type) {
    case "INVALID_CREDENTIALS":
      return "メールアドレスまたはパスワードが正しくありません";
    case "EMAIL_ALREADY_EXISTS":
      return "このメールアドレスは既に登録されています";
    case "WEAK_PASSWORD":
      return "パスワードは8文字以上で、英数字を含める必要があります";
    case "NETWORK_ERROR":
      return "ネットワークエラーが発生しました。インターネット接続を確認してください";
    case "USER_NOT_FOUND":
      return "ユーザーが見つかりませんでした";
    case "SESSION_EXPIRED":
      return "セッションの有効期限が切れました。再度ログインしてください";
    case "UNKNOWN_ERROR":
      return `エラーが発生しました: ${error.message}`;
    default:
      return "予期しないエラーが発生しました";
  }
}
