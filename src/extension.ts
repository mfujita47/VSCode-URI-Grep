import * as vscode from "vscode";
import { UriParser, SearchRequest, IConfigProvider, parseQueryString } from "./uriParser";

// ログ出力用のチャンネル（activateで初期化）
let outputChannel: vscode.OutputChannel | undefined;

// 開発ホストで起動しているかどうか（activateで初期化）
let isDevelopment = false;

// ログ出力用ユーティリティ
function log(message: string, ...optionalParams: unknown[]) {
  const time = new Date().toLocaleTimeString();
  const formattedParams = optionalParams.map(p =>
    typeof p === 'object' && p !== null ? JSON.stringify(p) : String(p)
  ).join(' ');

  if (outputChannel) {
    outputChannel.appendLine(`[${time}] ${message} ${formattedParams}`);
  }

  // 開発ホストのみコンソールにも出力（拡張ホストでは NODE_ENV が設定されないため ExtensionMode で判定する）
  if (isDevelopment) {
    console.log(`[uri-grep] ${message}`, ...optionalParams);
  }
}

// Wrapper for vscode.WorkspaceConfiguration to match IConfigProvider
class VSCodeConfigProvider implements IConfigProvider {
    private config: vscode.WorkspaceConfiguration;

    constructor(section: string) {
        this.config = vscode.workspace.getConfiguration(section);
    }

    get(key: string): string | boolean | number | undefined {
        // ユーザーが明示的に設定した値だけを返す。
        // get() では package.json の既定値が返るため、「未設定」と区別できない。
        const inspected = this.config.inspect<string | boolean | number>(key);
        return inspected?.workspaceFolderValue ?? inspected?.workspaceValue ?? inspected?.globalValue;
    }
}

const CONFIG_PREFIX = "urigrep";
const SEARCH_PATH = "/search";

/** README で案内しているパスは /search のみ。パスなし（末尾スラッシュのみ）は後方互換のため許容する。 */
function isSearchPath(path: string): boolean {
  const normalized = path.replace(/\/+$/, "");
  return normalized === "" || normalized === SEARCH_PATH;
}

class UriHandler implements vscode.UriHandler {
  private parser: UriParser;

  constructor() {
    this.parser = new UriParser();
  }

  public handleUri(uri: vscode.Uri): vscode.ProviderResult<void> {
    log(`Received URI: ${uri.toString()}`);

    if (!isSearchPath(uri.path)) {
      const message = `Unsupported URI path '${uri.path}'. Expected '${SEARCH_PATH}'.`;
      vscode.window.showErrorMessage(`URI Grep: ${message}`);
      log(message);
      return;
    }

    const configProvider = new VSCodeConfigProvider(CONFIG_PREFIX);
    // uri.query は VS Code の Uri.parse によって percent-decode 済みで渡ってくる。
    // URLSearchParams に直接渡すと "+" が空白に化けるため、自前のパーサを使う。
    const queryParams = parseQueryString(uri.query);

    const request = this.parser.parse(queryParams, configProvider);
    for (const warning of request.warnings) {
      log(`Warning: ${warning}`);
    }

    log(`Executing ${request.command} with parameters:`, request.args);
    this.executeSearch(request);
  }

  private executeSearch(request: SearchRequest) {
    vscode.commands.executeCommand(request.command, request.args).then(
      () => log(`${request.command} executed successfully.`),
      (err: unknown) => {
        const errorMessage = err instanceof Error ? err.message : String(err);
        vscode.window.showErrorMessage(`Failed to execute ${request.command}: ${errorMessage}`);
        log(`Failed to execute ${request.command}:`, errorMessage);
      }
    );
  }
}

export function activate(context: vscode.ExtensionContext) {
  isDevelopment = context.extensionMode === vscode.ExtensionMode.Development;

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
