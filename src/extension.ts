import * as vscode from "vscode";
import { UriParser, FindInFilesArgs, IConfigProvider } from "./uriParser";

// ログ出力用のチャンネル（activateで初期化）
let outputChannel: vscode.OutputChannel | undefined;

// ログ出力用ユーティリティ
function log(message: string, ...optionalParams: unknown[]) {
  const time = new Date().toLocaleTimeString();
  const formattedParams = optionalParams.map(p =>
    typeof p === 'object' && p !== null ? JSON.stringify(p) : String(p)
  ).join(' ');

  if (outputChannel) {
    outputChannel.appendLine(`[${time}] ${message} ${formattedParams}`);
  }

  // 開発環境のみコンソールにも出力
  if (process.env.NODE_ENV !== "production") {
    console.log(`[uri-grep] ${message}`, ...optionalParams);
  }
}

// Wrapper for vscode.WorkspaceConfiguration to match IConfigProvider
class VSCodeConfigProvider implements IConfigProvider {
    private config: vscode.WorkspaceConfiguration;

    constructor(section: string) {
        this.config = vscode.workspace.getConfiguration(section);
    }

    get<T>(key: string, defaultValue: T): T {
        // VS Code の get は undefined を返す可能性があるため、defaultValue を確実に返すようにする
        const value = this.config.get<T>(key);
        return value !== undefined ? value : defaultValue;
    }
}

const CONFIG_PREFIX = "urigrep";

class UriHandler implements vscode.UriHandler {
  private parser: UriParser;

  constructor() {
    this.parser = new UriParser();
  }

  public handleUri(uri: vscode.Uri): vscode.ProviderResult<void> {
    log(`Received URI: ${uri.toString()}`);
    const configProvider = new VSCodeConfigProvider(CONFIG_PREFIX);
    const queryParams = new URLSearchParams(uri.query);

    const commandArgs = this.parser.parse(queryParams, configProvider);

    log("Executing findInFiles command with parameters:", commandArgs);
    this.executeFindInFiles(commandArgs);
  }

  private executeFindInFiles(args: FindInFilesArgs) {
    vscode.commands.executeCommand("workbench.action.findInFiles", args).then(
      () => log("findInFiles command executed successfully."),
      (err: unknown) => {
        const errorMessage = err instanceof Error ? err.message : String(err);
        vscode.window.showErrorMessage(`Failed to execute findInFiles: ${errorMessage}`);
        log(`Failed to execute findInFiles:`, errorMessage);
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
  outputChannel = undefined;
}
