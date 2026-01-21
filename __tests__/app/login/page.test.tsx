/**
 * ログインページのテスト
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import LoginPage from "@/app/login/page";
import { useAuthStore } from "@/lib/stores/auth-store";

// AuthStore をモック
jest.mock("@/lib/stores/auth-store");

// next/navigation をモック
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
}));

describe("LoginPage", () => {
  const mockSignIn = jest.fn();
  const mockSignInWithOAuth = jest.fn();
  const mockClearError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuthStore as unknown as ReturnType<typeof jest.fn>).mockReturnValue({
      signIn: mockSignIn,
      signInWithOAuth: mockSignInWithOAuth,
      clearError: mockClearError,
      isLoading: false,
      error: null,
    });
  });

  it("メールアドレスとパスワードの入力フィールドが表示される", () => {
    render(<LoginPage />);

    expect(screen.getByLabelText(/メールアドレス/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/パスワード/i)).toBeInTheDocument();
  });

  it("ログインボタンが表示される", () => {
    render(<LoginPage />);

    expect(screen.getByRole("button", { name: /^ログイン$/i })).toBeInTheDocument();
  });

  it("Google OAuth連携ボタンが表示される", () => {
    render(<LoginPage />);

    expect(screen.getByRole("button", { name: /Googleでログイン/i })).toBeInTheDocument();
  });

  it("メールアドレスとパスワードを入力してログインボタンをクリックするとsignInが呼ばれる", async () => {
    render(<LoginPage />);

    const emailInput = screen.getByLabelText(/メールアドレス/i);
    const passwordInput = screen.getByLabelText(/パスワード/i);
    const loginButton = screen.getByRole("button", { name: /^ログイン$/i });

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
    });
  });

  it("Google OAuth連携ボタンをクリックするとsignInWithOAuthが呼ばれる", async () => {
    render(<LoginPage />);

    const oauthButton = screen.getByRole("button", { name: /Googleでログイン/i });
    fireEvent.click(oauthButton);

    await waitFor(() => {
      expect(mockSignInWithOAuth).toHaveBeenCalledWith("google");
    });
  });

  it("エラーが存在する場合、エラーメッセージが表示される", () => {
    (useAuthStore as unknown as ReturnType<typeof jest.fn>).mockReturnValue({
      signIn: mockSignIn,
      signInWithOAuth: mockSignInWithOAuth,
      clearError: mockClearError,
      isLoading: false,
      error: { type: "INVALID_CREDENTIALS" },
    });

    render(<LoginPage />);

    expect(screen.getByText(/メールアドレスまたはパスワードが正しくありません/i)).toBeInTheDocument();
  });

  it("ローディング中はボタンが無効化される", () => {
    (useAuthStore as unknown as ReturnType<typeof jest.fn>).mockReturnValue({
      signIn: mockSignIn,
      signInWithOAuth: mockSignInWithOAuth,
      clearError: mockClearError,
      isLoading: true,
      error: null,
    });

    render(<LoginPage />);

    const loginButton = screen.getByRole("button", { name: /ログイン中/i });
    expect(loginButton).toBeDisabled();
  });

  it("ARIA属性が適切に設定されている", () => {
    render(<LoginPage />);

    const emailInput = screen.getByLabelText(/メールアドレス/i);
    const passwordInput = screen.getByLabelText(/パスワード/i);

    expect(emailInput).toHaveAttribute("type", "email");
    expect(emailInput).toHaveAttribute("required");
    expect(passwordInput).toHaveAttribute("type", "password");
    expect(passwordInput).toHaveAttribute("required");
  });

  it("サインアップページへのリンクが表示される", () => {
    render(<LoginPage />);

    expect(screen.getByText(/アカウントをお持ちでない方/i)).toBeInTheDocument();
    const signupLink = screen.getByRole("link", { name: /新規登録/i });
    expect(signupLink).toHaveAttribute("href", "/signup");
  });
});
