import * as vscode from "vscode";

// ログ出力用のチャンネル（activateで初期化）
let outputChannel: vscode.OutputChannel | undefined;

// ログ出力用ユーティリティ
function log(message: string, ...optionalParams: any[]) {
  const time = new Date().toLocaleTimeString();
  const formattedParams = optionalParams.map(p =>
    typeof p === 'object' ? JSON.stringify(p) : p
  ).join(' ');

  if (outputChannel) {
    outputChannel.appendLine(`[${time}] ${message} ${formattedParams}`);
  }

  if (process.env.NODE_ENV !== "production") {
    console.log(`[uri-grep] ${message}`, ...optionalParams);
  }
}

// パラメータ定義の型
interface ParamDef<T> {
  name: keyof FindInFilesArgs;
  configKey: string;
  defaultValue: T;
  type: "string" | "boolean" | "number";
}

// 設定キーのプレフィックス
const CONFIG_PREFIX = "urigrep";

// パラメータ定義リスト
const PARAM_DEFINITIONS: ParamDef<any>[] = [
  { name: "query", configKey: "defaultQuery", defaultValue: "", type: "string" },
  { name: "filesToInclude", configKey: "defaultFilesToInclude", defaultValue: "", type: "string" },
  { name: "filesToExclude", configKey: "defaultFilesToExclude", defaultValue: "", type: "string" },
  { name: "isCaseSensitive", configKey: "defaultIsCaseSensitive", defaultValue: false, type: "boolean" },
  { name: "matchWholeWord", configKey: "defaultMatchWholeWord", defaultValue: false, type: "boolean" },
  { name: "isRegex", configKey: "defaultIsRegex", defaultValue: false, type: "boolean" },
];

interface FindInFilesArgs {
  query?: string;
  filesToInclude?: string;
  filesToExclude?: string;
  isRegex?: boolean;
  isCaseSensitive?: boolean;
  matchWholeWord?: boolean;
  triggerSearch?: boolean;
}

class UriHandler implements vscode.UriHandler {
  public handleUri(uri: vscode.Uri): vscode.ProviderResult<void> {
    log(`Received URI: ${uri.toString()}`);
    const config = vscode.workspace.getConfiguration(CONFIG_PREFIX);
    const queryParams = new URLSearchParams(uri.query);

    const commandArgs: FindInFilesArgs = {
      triggerSearch: true
    };

    for (const def of PARAM_DEFINITIONS) {
      const value = this.getParam(queryParams, def.name, config, def.configKey, def.defaultValue, def.type);
      (commandArgs as any)[def.name] = value;
    }

    log("Executing findInFiles command with parameters:", commandArgs);
    this.executeFindInFiles(commandArgs);
  }

  private getParam<T>(
    queryParams: URLSearchParams,
    uriParamName: string,
    config: vscode.WorkspaceConfiguration,
    configKeySuffix: string,
    fallbackValue: T,
    type: "string" | "boolean" | "number"
  ): T {
    if (queryParams.has(uriParamName)) {
      const value = queryParams.get(uriParamName);
      if (value !== null) {
        if (type === "boolean") {
          return (value.toLowerCase() === "true") as unknown as T;
        }
        if (type === "number") {
            const num = Number(value);
            return (isNaN(num) ? fallbackValue : num) as unknown as T;
        }
        return value as unknown as T;
      }
    }

    return config.get<T>(configKeySuffix, fallbackValue);
  }

  private executeFindInFiles(args: FindInFilesArgs) {
    vscode.commands.executeCommand("workbench.action.findInFiles", args).then(
      () => log("findInFiles command executed successfully."),
      (err) => {
        vscode.window.showErrorMessage(`Failed to execute findInFiles: ${err}`);
        log(`Failed to execute findInFiles:`, err);
      }
    );
  }
}

export function activate(context: vscode.ExtensionContext) {
  // OutputChannelを作成し、破棄リストに登録
  outputChannel = vscode.window.createOutputChannel("URI Grep");
  context.subscriptions.push(outputChannel);

  log('Extension "uri-grep" is now active!');

  const uriHandler = new UriHandler();
  context.subscriptions.push(vscode.window.registerUriHandler(uriHandler));
  log("URI handler registered.");
}

export function deactivate() {
  log('Extension "uri-grep" is deactivated.');
  // context.subscriptionsによりoutputChannelは自動的に破棄されるため、ここで明示的なdisposeは不要だが、
  // 参照をクリアしておくのは良い習慣
  outputChannel = undefined;
}
