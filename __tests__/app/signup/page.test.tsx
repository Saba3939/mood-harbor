/**
 * サインアップページのテスト
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import SignupPage from "@/app/signup/page";
import { useAuthStore } from "@/lib/stores/auth-store";

// AuthStore をモック
jest.mock("@/lib/stores/auth-store");

// next/navigation をモック
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
}));

describe("SignupPage", () => {
  const mockSignUp = jest.fn();
  const mockSignInWithOAuth = jest.fn();
  const mockClearError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuthStore as unknown as ReturnType<typeof jest.fn>).mockReturnValue({
      signUp: mockSignUp,
      signInWithOAuth: mockSignInWithOAuth,
      clearError: mockClearError,
      isLoading: false,
      error: null,
    });
  });

  it("メールアドレスとパスワードの入力フィールドが表示される", () => {
    render(<SignupPage />);

    expect(screen.getByLabelText(/メールアドレス/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^パスワード$/i)).toBeInTheDocument();
  });

  it("新規登録ボタンが表示される", () => {
    render(<SignupPage />);

    expect(screen.getByRole("button", { name: /^新規登録$/i })).toBeInTheDocument();
  });

  it("Google OAuth連携ボタンが表示される", () => {
    render(<SignupPage />);

    expect(screen.getByRole("button", { name: /Googleで登録/i })).toBeInTheDocument();
  });

  it("パスワード強度インジケーターが表示される", () => {
    render(<SignupPage />);

    const passwordInput = screen.getByLabelText(/^パスワード$/i);
    fireEvent.change(passwordInput, { target: { value: "weak" } });

    expect(screen.getByText(/弱い/i)).toBeInTheDocument();
  });

  it("強いパスワードを入力すると強度インジケーターが「強い」になる", () => {
    render(<SignupPage />);

    const passwordInput = screen.getByLabelText(/^パスワード$/i);
    fireEvent.change(passwordInput, { target: { value: "Password123!" } });

    expect(screen.getByText(/強い/i)).toBeInTheDocument();
  });

  it("メールアドレスとパスワードを入力して新規登録ボタンをクリックするとsignUpが呼ばれる", async () => {
    render(<SignupPage />);

    const emailInput = screen.getByLabelText(/メールアドレス/i);
    const passwordInput = screen.getByLabelText(/^パスワード$/i);
    const signupButton = screen.getByRole("button", { name: /^新規登録$/i });

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "Password123" } });
    fireEvent.click(signupButton);

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "Password123",
      });
    });
  });

  it("Google OAuth連携ボタンをクリックするとsignInWithOAuthが呼ばれる", async () => {
    render(<SignupPage />);

    const oauthButton = screen.getByRole("button", { name: /Googleで登録/i });
    fireEvent.click(oauthButton);

    await waitFor(() => {
      expect(mockSignInWithOAuth).toHaveBeenCalledWith("google");
    });
  });

  it("エラーが存在する場合、エラーメッセージが表示される", () => {
    (useAuthStore as unknown as ReturnType<typeof jest.fn>).mockReturnValue({
      signUp: mockSignUp,
      signInWithOAuth: mockSignInWithOAuth,
      clearError: mockClearError,
      isLoading: false,
      error: { type: "EMAIL_ALREADY_EXISTS" },
    });

    render(<SignupPage />);

    expect(screen.getByText(/このメールアドレスは既に登録されています/i)).toBeInTheDocument();
  });

  it("弱いパスワードの場合、エラーメッセージが表示される", () => {
    (useAuthStore as unknown as ReturnType<typeof jest.fn>).mockReturnValue({
      signUp: mockSignUp,
      signInWithOAuth: mockSignInWithOAuth,
      clearError: mockClearError,
      isLoading: false,
      error: { type: "WEAK_PASSWORD" },
    });

    render(<SignupPage />);

    expect(screen.getByText(/パスワードは8文字以上で、英数字を含める必要があります/i)).toBeInTheDocument();
  });

  it("ローディング中はボタンが無効化される", () => {
    (useAuthStore as unknown as ReturnType<typeof jest.fn>).mockReturnValue({
      signUp: mockSignUp,
      signInWithOAuth: mockSignInWithOAuth,
      clearError: mockClearError,
      isLoading: true,
      error: null,
    });

    render(<SignupPage />);

    const signupButton = screen.getByRole("button", { name: /登録中/i });
    expect(signupButton).toBeDisabled();
  });

  it("ARIA属性が適切に設定されている", () => {
    render(<SignupPage />);

    const emailInput = screen.getByLabelText(/メールアドレス/i);
    const passwordInput = screen.getByLabelText(/^パスワード$/i);

    expect(emailInput).toHaveAttribute("type", "email");
    expect(emailInput).toHaveAttribute("required");
    expect(passwordInput).toHaveAttribute("type", "password");
    expect(passwordInput).toHaveAttribute("required");
  });

  it("ログインページへのリンクが表示される", () => {
    render(<SignupPage />);

    expect(screen.getByText(/既にアカウントをお持ちの方/i)).toBeInTheDocument();
    const loginLink = screen.getByRole("link", { name: /ログイン/i });
    expect(loginLink).toHaveAttribute("href", "/login");
  });
});
