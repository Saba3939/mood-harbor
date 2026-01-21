/**
 * プロジェクト設定の検証テスト
 * タスク1.2: Next.js プロジェクトの設定と依存関係のインストール
 */

import { describe, it, expect } from "@jest/globals";
import * as fs from "fs";
import * as path from "path";

describe("プロジェクト設定の検証", () => {
  describe("TypeScript strict mode設定", () => {
    it("tsconfig.jsonにstrict modeが有効化されている", () => {
      const tsconfigPath = path.join(process.cwd(), "tsconfig.json");
      const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, "utf-8"));

      expect(tsconfig.compilerOptions.strict).toBe(true);
      expect(tsconfig.compilerOptions.noImplicitAny).toBe(true);
      expect(tsconfig.compilerOptions.strictNullChecks).toBe(true);
    });
  });

  describe("必要な依存関係のインストール", () => {
    it("package.jsonに必要な依存関係が含まれている", () => {
      const packageJsonPath = path.join(process.cwd(), "package.json");
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

      // 本番依存関係
      expect(packageJson.dependencies).toHaveProperty("next");
      expect(packageJson.dependencies).toHaveProperty("react");
      expect(packageJson.dependencies).toHaveProperty("react-dom");
      expect(packageJson.dependencies).toHaveProperty("zustand");
      expect(packageJson.dependencies).toHaveProperty("framer-motion");
      expect(packageJson.dependencies).toHaveProperty("@supabase/supabase-js");
      expect(packageJson.dependencies).toHaveProperty("@supabase/ssr");

      // 開発依存関係
      expect(packageJson.devDependencies).toHaveProperty("@ducanh2912/next-pwa");
      expect(packageJson.devDependencies).toHaveProperty("tailwindcss");
      expect(packageJson.devDependencies).toHaveProperty("typescript");
      expect(packageJson.devDependencies).toHaveProperty("prettier");
      expect(packageJson.devDependencies).toHaveProperty("eslint");
      expect(packageJson.devDependencies).toHaveProperty("@typescript-eslint/eslint-plugin");
      expect(packageJson.devDependencies).toHaveProperty("@typescript-eslint/parser");
    });

    it("バージョンが要件を満たしている", () => {
      const packageJsonPath = path.join(process.cwd(), "package.json");
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

      expect(packageJson.dependencies.next).toBe("16.1.1");
      expect(packageJson.dependencies.react).toBe("19.2.3");
      expect(packageJson.dependencies["react-dom"]).toBe("19.2.3");
    });
  });

  describe("ESLint設定", () => {
    it("eslint.config.mjsが存在する", () => {
      const eslintConfigPath = path.join(process.cwd(), "eslint.config.mjs");
      expect(fs.existsSync(eslintConfigPath)).toBe(true);
    });

    it("package.jsonにlintスクリプトが存在する", () => {
      const packageJsonPath = path.join(process.cwd(), "package.json");
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

      expect(packageJson.scripts).toHaveProperty("lint");
      expect(packageJson.scripts).toHaveProperty("lint:fix");
    });
  });

  describe("Prettier設定", () => {
    it(".prettierrc.jsonが存在する", () => {
      const prettierConfigPath = path.join(process.cwd(), ".prettierrc.json");
      expect(fs.existsSync(prettierConfigPath)).toBe(true);
    });

    it(".prettierignoreが存在する", () => {
      const prettierIgnorePath = path.join(process.cwd(), ".prettierignore");
      expect(fs.existsSync(prettierIgnorePath)).toBe(true);
    });

    it("package.jsonにformatスクリプトが存在する", () => {
      const packageJsonPath = path.join(process.cwd(), "package.json");
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

      expect(packageJson.scripts).toHaveProperty("format");
      expect(packageJson.scripts).toHaveProperty("format:check");
    });
  });

  describe("TailwindCSS設定", () => {
    it("postcss.config.mjsにTailwindCSSが設定されている", () => {
      const postcssConfigPath = path.join(process.cwd(), "postcss.config.mjs");
      expect(fs.existsSync(postcssConfigPath)).toBe(true);

      const postcssConfig = fs.readFileSync(postcssConfigPath, "utf-8");
      expect(postcssConfig).toContain("@tailwindcss/postcss");
    });

    it("globals.cssにTailwindCSSがインポートされている", () => {
      const globalsCssPath = path.join(process.cwd(), "app/globals.css");
      const globalsCss = fs.readFileSync(globalsCssPath, "utf-8");

      expect(globalsCss).toContain("@import \"tailwindcss\"");
    });

    it("ダークモード対応が準備されている", () => {
      const globalsCssPath = path.join(process.cwd(), "app/globals.css");
      const globalsCss = fs.readFileSync(globalsCssPath, "utf-8");

      expect(globalsCss).toContain("prefers-color-scheme: dark");
    });
  });

  describe("スクリプト設定", () => {
    it("必要なnpmスクリプトが全て定義されている", () => {
      const packageJsonPath = path.join(process.cwd(), "package.json");
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

      expect(packageJson.scripts).toHaveProperty("dev");
      expect(packageJson.scripts).toHaveProperty("build");
      expect(packageJson.scripts).toHaveProperty("start");
      expect(packageJson.scripts).toHaveProperty("lint");
      expect(packageJson.scripts).toHaveProperty("lint:fix");
      expect(packageJson.scripts).toHaveProperty("format");
      expect(packageJson.scripts).toHaveProperty("format:check");
      expect(packageJson.scripts).toHaveProperty("type-check");
    });
  });
});
