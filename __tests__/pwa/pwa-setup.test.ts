/**
 * PWA設定とService Worker基盤のテスト
 * タスク1.3: PWA設定とService Workerの基盤構築
 */

import { describe, it, expect } from "@jest/globals";
import * as fs from "fs";
import * as path from "path";

describe("PWA設定の検証", () => {
  describe("manifest.json設定", () => {
    it("public/manifest.jsonが存在する", () => {
      const manifestPath = path.join(process.cwd(), "public", "manifest.json");
      expect(fs.existsSync(manifestPath)).toBe(true);
    });

    it("manifest.jsonにアプリ名「Mood Harbor」が設定されている", () => {
      const manifestPath = path.join(process.cwd(), "public", "manifest.json");
      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));

      expect(manifest.name).toBe("Mood Harbor");
      expect(manifest.short_name).toBe("Mood Harbor");
    });

    it("manifest.jsonにテーマカラーとアイコンが設定されている", () => {
      const manifestPath = path.join(process.cwd(), "public", "manifest.json");
      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));

      expect(manifest.theme_color).toBeDefined();
      expect(manifest.background_color).toBeDefined();
      expect(manifest.icons).toBeDefined();
      expect(Array.isArray(manifest.icons)).toBe(true);
      expect(manifest.icons.length).toBeGreaterThan(0);
    });

    it("manifest.jsonにPWA displayモードが設定されている", () => {
      const manifestPath = path.join(process.cwd(), "public", "manifest.json");
      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));

      expect(manifest.display).toBe("standalone");
    });
  });

  describe("next-pwa設定", () => {
    it("next.config.tsにnext-pwaが統合されている", () => {
      const nextConfigPath = path.join(process.cwd(), "next.config.ts");
      const nextConfig = fs.readFileSync(nextConfigPath, "utf-8");

      expect(nextConfig).toContain("@ducanh2912/next-pwa");
    });

    it("Service Workerが生成される設定になっている", () => {
      const nextConfigPath = path.join(process.cwd(), "next.config.ts");
      const nextConfig = fs.readFileSync(nextConfigPath, "utf-8");

      // next-pwaの設定が含まれていることを確認
      expect(nextConfig).toContain("withPWA");
    });
  });

  describe("Service Workerユーティリティ", () => {
    it("lib/pwa/service-worker-utils.tsが存在する", () => {
      const utilsPath = path.join(process.cwd(), "lib", "pwa", "service-worker-utils.ts");
      expect(fs.existsSync(utilsPath)).toBe(true);
    });

    it("オンライン/オフライン検知機能が実装されている", () => {
      const utilsPath = path.join(process.cwd(), "lib", "pwa", "service-worker-utils.ts");
      const utils = fs.readFileSync(utilsPath, "utf-8");

      // オンライン/オフライン検知関数の存在確認
      expect(utils).toContain("isOnline");
      expect(utils).toContain("addEventListener");
    });
  });

  describe("IndexedDBスキーマ", () => {
    it("lib/pwa/indexed-db.tsが存在する", () => {
      const indexedDBPath = path.join(process.cwd(), "lib", "pwa", "indexed-db.ts");
      expect(fs.existsSync(indexedDBPath)).toBe(true);
    });

    it("オフライン記録キュー用のスキーマが定義されている", () => {
      const indexedDBPath = path.join(process.cwd(), "lib", "pwa", "indexed-db.ts");
      const indexedDB = fs.readFileSync(indexedDBPath, "utf-8");

      // オフライン記録キュー関連の型定義が含まれていることを確認
      expect(indexedDB).toContain("OfflineRecord");
      expect(indexedDB).toContain("openDB");
    });
  });

  describe("PWAアイコン", () => {
    it("public/icons/ディレクトリが存在する", () => {
      const iconsDir = path.join(process.cwd(), "public", "icons");
      expect(fs.existsSync(iconsDir)).toBe(true);
    });

    it("必要なアイコンサイズが存在する", () => {
      const iconsDir = path.join(process.cwd(), "public", "icons");
      const requiredSizes = ["192x192", "512x512"];

      requiredSizes.forEach((size) => {
        const iconPath = path.join(iconsDir, `icon-${size}.png`);
        expect(fs.existsSync(iconPath)).toBe(true);
      });
    });
  });
});
