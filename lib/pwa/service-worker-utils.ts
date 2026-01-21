/**
 * Service Worker関連のユーティリティ
 * オンライン/オフライン検知と状態管理
 */

import type { NetworkStatus } from "./types";

/**
 * 現在のネットワーク状態を取得
 */
export function isOnline(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return navigator.onLine;
}

/**
 * ネットワーク状態の変更を監視
 */
export function addNetworkStatusListener(
  callback: (status: NetworkStatus) => void
): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleOnline = () => {
    callback("online");
  };

  const handleOffline = () => {
    callback("offline");
  };

  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);

  // 初期状態を通知
  callback(navigator.onLine ? "online" : "offline");

  // クリーンアップ関数を返す
  return () => {
    window.removeEventListener("online", handleOnline);
    window.removeEventListener("offline", handleOffline);
  };
}

/**
 * Service Workerの登録状態を確認
 */
export async function isServiceWorkerRegistered(): Promise<boolean> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    return registration !== undefined;
  } catch (error) {
    console.error("Service Worker registration check failed:", error);
    return false;
  }
}

/**
 * Service Workerの登録を待機
 */
export async function waitForServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    return registration;
  } catch (error) {
    console.error("Service Worker ready failed:", error);
    return null;
  }
}

/**
 * Service Workerにメッセージを送信
 */
export async function sendMessageToServiceWorker(message: unknown): Promise<void> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return;
  }

  const registration = await navigator.serviceWorker.ready;

  if (registration.active) {
    registration.active.postMessage(message);
  }
}

/**
 * Service Workerからのメッセージを購読
 */
export function subscribeToServiceWorkerMessages(
  callback: (data: unknown) => void
): () => void {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return () => {};
  }

  const handleMessage = (event: MessageEvent) => {
    callback(event.data);
  };

  navigator.serviceWorker.addEventListener("message", handleMessage);

  return () => {
    navigator.serviceWorker.removeEventListener("message", handleMessage);
  };
}

/**
 * PWAのインストール可能状態を確認
 */
export function checkPWAInstallable(
  callback: (event: Event) => void
): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener("beforeinstallprompt", callback);

  return () => {
    window.removeEventListener("beforeinstallprompt", callback);
  };
}
