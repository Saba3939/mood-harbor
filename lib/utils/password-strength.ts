/**
 * パスワード強度判定ユーティリティ
 */

export type PasswordStrength = "weak" | "medium" | "strong";

export type PasswordStrengthResult = {
  strength: PasswordStrength;
  label: string;
  color: string;
};

/**
 * パスワードの強度を判定
 *
 * 弱い: 8文字未満、または英数字混在なし
 * 中程度: 8文字以上、英数字混在
 * 強い: 10文字以上、英数字混在、特殊文字含む
 */
export function getPasswordStrength(password: string): PasswordStrengthResult {
  if (!password) {
    return {
      strength: "weak",
      label: "弱い",
      color: "bg-red-500",
    };
  }

  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const length = password.length;

  // 強い: 10文字以上 + 英数字 + 特殊文字
  if (length >= 10 && hasLetter && hasNumber && hasSpecial) {
    return {
      strength: "strong",
      label: "強い",
      color: "bg-green-500",
    };
  }

  // 中程度: 8文字以上 + 英数字
  if (length >= 8 && hasLetter && hasNumber) {
    return {
      strength: "medium",
      label: "中程度",
      color: "bg-yellow-500",
    };
  }

  // 弱い: その他
  return {
    strength: "weak",
    label: "弱い",
    color: "bg-red-500",
  };
}
