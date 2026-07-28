import { existsSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { defineConfig } from "@vscode/test-cli";

/**
 * テストを走らせるエディタを選ぶ。
 *
 *   URIGREP_TEST_TARGET=antigravity  Antigravity IDE（既定）
 *   URIGREP_TEST_TARGET=vscode       stable の VS Code をダウンロードして使う
 *   URIGREP_TEST_TARGET=<パス>       任意の実行ファイル（他の VS Code フォーク）
 *
 * Antigravity IDE は VS Code 1.107 系のフォークで、拡張機能ホストの API はそのまま使えるが
 * URI スキームが vscode: ではなく antigravity-ide: になる。
 */
const target = process.env.URIGREP_TEST_TARGET ?? "antigravity";

const ANTIGRAVITY_CANDIDATES = [
    path.join(homedir(), "AppData", "Local", "Programs", "Antigravity IDE", "Antigravity IDE.exe"),
    "/Applications/Antigravity IDE.app/Contents/MacOS/Electron",
    "/usr/share/antigravity-ide/antigravity-ide",
];

function resolveExecutable() {
    if (target === "vscode") {
        return undefined;
    }

    if (target !== "antigravity") {
        if (!existsSync(target)) {
            throw new Error(`URIGREP_TEST_TARGET points to a missing executable: ${target}`);
        }
        return target;
    }

    const found = ANTIGRAVITY_CANDIDATES.find(candidate => existsSync(candidate));
    if (!found) {
        console.log("Antigravity IDE was not found; falling back to a downloaded VS Code build.");
        console.log("Set URIGREP_TEST_TARGET=vscode to silence this message.");
    }
    return found;
}

const executable = resolveExecutable();
if (executable) {
    console.log(`Running tests in: ${executable}`);
}

export default defineConfig({
    files: "out/test/**/*.test.js",
    // 指定がなければ stable の VS Code がダウンロードされる。
    ...(executable ? { useInstallation: { fromPath: executable } } : {}),
});
