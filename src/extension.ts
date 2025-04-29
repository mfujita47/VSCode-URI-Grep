import * as vscode from "vscode";

// 設定キーを定数として定義
const CONFIG_KEYS = {
  DEFAULT_FILES_TO_INCLUDE: "urigrep.defaultFilesToInclude",
  DEFAULT_FILES_TO_EXCLUDE: "urigrep.defaultFilesToExclude",
  DEFAULT_IS_CASE_SENSITIVE: "urigrep.defaultIsCaseSensitive",
  DEFAULT_MATCH_WHOLE_WORD: "urigrep.defaultMatchWholeWord",
  DEFAULT_IS_REGEX: "urigrep.defaultIsRegex",
} as const;

class UriHandler implements vscode.UriHandler {
  public handleUri(uri: vscode.Uri): vscode.ProviderResult<void> {
    console.log(`Received URI: ${uri.toString()}`); // URI受信ログ

    const getBooleanParam = (
      paramName: string,
      configKey: (typeof CONFIG_KEYS)[keyof typeof CONFIG_KEYS],
      fallbackValue: boolean
    ): boolean => {
      if (queryParams.has(paramName)) {
        return queryParams.get(paramName) === "true";
      }
      return config.get<boolean>(configKey, fallbackValue);
    };

    const getBooleanParamNotFalse = (
      paramName: string,
      configKey: (typeof CONFIG_KEYS)[keyof typeof CONFIG_KEYS],
      fallbackValue: boolean
    ): boolean => {
      if (queryParams.has(paramName)) {
        return queryParams.get(paramName) !== "false";
      }
      return config.get<boolean>(configKey, fallbackValue);
    };

    // 設定オブジェクトを取得
    const config = vscode.workspace.getConfiguration("urigrep"); // 'urigrep' は拡張機能のIDなのでこのまま
    const queryParams = new URLSearchParams(uri.query);
    const searchQuery = queryParams.get("query") ?? "";
    const filesToInclude =
      queryParams.get("filesToInclude") ??
      config.get<string>(CONFIG_KEYS.DEFAULT_FILES_TO_INCLUDE, "");
    const filesToExclude =
      queryParams.get("filesToExclude") ??
      config.get<string>(CONFIG_KEYS.DEFAULT_FILES_TO_EXCLUDE, "");
    const isCaseSensitive = getBooleanParam(
      "isCaseSensitive",
      CONFIG_KEYS.DEFAULT_IS_CASE_SENSITIVE,
      false
    );
    const matchWholeWord = getBooleanParam(
      "matchWholeWord",
      CONFIG_KEYS.DEFAULT_MATCH_WHOLE_WORD,
      false
    );
    const isRegex = getBooleanParam(
      "isRegex",
      CONFIG_KEYS.DEFAULT_IS_REGEX,
      false
    );

    console.log("Executing findInFiles command with parameters:", {
      query: searchQuery,
      filesToInclude,
      filesToExclude,
      isRegex,
      isCaseSensitive,
      matchWholeWord,
    });

    // executeCommand に渡す引数オブジェクトを作成
    const commandArgs: Record<string, any> = {
      query: searchQuery,
      filesToInclude: filesToInclude,
      filesToExclude: filesToExclude,
      isRegex: isRegex,
      isCaseSensitive: isCaseSensitive,
      matchWholeWord: matchWholeWord,
    };

    vscode.commands
      .executeCommand("workbench.action.findInFiles", commandArgs)
      .then(
        () => console.log("findInFiles command executed successfully."),
        (err) => {
          vscode.window.showErrorMessage(
            `Failed to execute findInFiles command: ${err}`
          );
          console.error("Failed to execute findInFiles command:", err);
        }
      );
  }
}

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "uri-search" is now active!');

  const uriHandler = new UriHandler();
  context.subscriptions.push(vscode.window.registerUriHandler(uriHandler));
  console.log("URI handler registered.");
}

export function deactivate() {
  console.log('Extension "uri-grep" is deactivated.');
}
