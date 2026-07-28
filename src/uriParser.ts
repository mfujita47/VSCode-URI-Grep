/**
 * `workbench.action.findInFiles` が受け付ける引数（検索パネル）。
 * VS Code 本体の IFindInFilesArgs に対応する。contextLines は含まれない。
 */
export interface FindInFilesArgs {
    query?: string;
    filesToInclude?: string;
    filesToExclude?: string;
    isRegex?: boolean;
    isCaseSensitive?: boolean;
    matchWholeWord?: boolean;
    useExcludeSettingsAndIgnoreFiles?: boolean;
    triggerSearch?: boolean;
}

/**
 * `search.action.openEditor` が受け付ける引数（Search Editor）。
 * 正規表現フラグの名前が findInFiles の isRegex ではなく isRegexp である点に注意。
 */
export interface SearchEditorArgs {
    query?: string;
    filesToInclude?: string;
    filesToExclude?: string;
    isRegexp?: boolean;
    isCaseSensitive?: boolean;
    matchWholeWord?: boolean;
    useExcludeSettingsAndIgnoreFiles?: boolean;
    triggerSearch?: boolean;
    contextLines?: number;
}

/** 検索パネルを開くコマンド。contextLines は受け付けない。 */
export const FIND_IN_FILES_COMMAND = "workbench.action.findInFiles";

/** Search Editor を開くコマンド。既存の Search Editor があれば再利用される（location: 'reuse'）。 */
export const OPEN_SEARCH_EDITOR_COMMAND = "search.action.openEditor";

/** 実行すべきコマンドと、それに渡す引数の組。warnings は無視した入力の説明。 */
export type SearchRequest =
    | { command: typeof FIND_IN_FILES_COMMAND; args: FindInFilesArgs; warnings: string[] }
    | { command: typeof OPEN_SEARCH_EDITOR_COMMAND; args: SearchEditorArgs; warnings: string[] };

export interface IConfigProvider {
    /**
     * ユーザーが明示的に設定した値を返す。設定されていなければ undefined。
     * package.json の既定値は返さないこと（未設定と区別できなくなるため）。
     */
    get(key: string): string | boolean | number | undefined;
}

export type ParamName =
    | "query"
    | "filesToInclude"
    | "filesToExclude"
    | "isCaseSensitive"
    | "matchWholeWord"
    | "isRegex"
    | "useExcludeSettingsAndIgnoreFiles"
    | "contextLines"
    | "triggerSearch";

export interface ParamDef {
    name: ParamName;
    configKey: string;
    type: "string" | "boolean" | "number";
    /**
     * URI にも設定にも指定がなかった場合に、それでもコマンドへ渡す値。
     * 省略した項目はコマンドに渡さない（＝検索パネルの現在の状態をそのまま残す）。
     */
    fallback?: string | boolean | number;
}

export const PARAM_DEFINITIONS: ParamDef[] = [
    { name: "query", configKey: "defaultQuery", type: "string" },
    { name: "filesToInclude", configKey: "defaultFilesToInclude", type: "string" },
    { name: "filesToExclude", configKey: "defaultFilesToExclude", type: "string" },
    { name: "isCaseSensitive", configKey: "defaultIsCaseSensitive", type: "boolean" },
    { name: "matchWholeWord", configKey: "defaultMatchWholeWord", type: "boolean" },
    { name: "isRegex", configKey: "defaultIsRegex", type: "boolean" },
    { name: "useExcludeSettingsAndIgnoreFiles", configKey: "defaultUseExcludeSettingsAndIgnoreFiles", type: "boolean" },
    { name: "contextLines", configKey: "defaultContextLines", type: "number" },
    // 検索の実行そのものを指示する項目なので、これだけは常に渡す。
    // 渡さないと VS Code 側は検索を開始しない（searchView.setSearchParameters を参照）。
    { name: "triggerSearch", configKey: "defaultTriggerSearch", type: "boolean", fallback: true },
];

/** 真として扱う値。値を持たないパラメータ（?isRegex）はフラグが立っているとみなす。 */
const TRUE_VALUES = new Set(["true", "1", "yes", "on", ""]);
const FALSE_VALUES = new Set(["false", "0", "no", "off"]);

/**
 * URI のクエリ文字列を解析する。
 *
 * `new URLSearchParams(...)` を直接使わないのは、application/x-www-form-urlencoded の規則により
 * "+" が空白へデコードされてしまい、`query=\d+` や `query=C++` のような検索語が壊れるため。
 * ここでは "+" をリテラルとして扱う。
 *
 * なお VS Code の Uri.parse は query を percent-decode 済みで渡してくるため、
 * 到達する時点で "%20" などは既に実体化している。ここでの decodeURIComponent は
 * "%2520" のように二重エンコードされた入力のためのもので、不正なシーケンスは素通しする。
 */
export function parseQueryString(rawQuery: string): URLSearchParams {
    const params = new URLSearchParams();
    if (!rawQuery) {
        return params;
    }

    for (const pair of rawQuery.replace(/^\?/, "").split("&")) {
        if (pair === "") {
            continue;
        }
        const separator = pair.indexOf("=");
        const rawKey = separator === -1 ? pair : pair.slice(0, separator);
        const rawValue = separator === -1 ? "" : pair.slice(separator + 1);
        params.append(decodeGraceful(rawKey), decodeGraceful(rawValue));
    }

    return params;
}

/** decodeURIComponent は不正な % シーケンスで例外を投げるため、その場合は原文を返す。 */
function decodeGraceful(value: string): string {
    try {
        return decodeURIComponent(value);
    } catch {
        return value;
    }
}

export class UriParser {
    public parse(queryParams: URLSearchParams, config: IConfigProvider): SearchRequest {
        const warnings: string[] = [];
        const values = new Map<ParamName, string | boolean | number>();

        for (const def of PARAM_DEFINITIONS) {
            const value = this.resolve(queryParams, config, def, warnings);
            // 決まらなかった項目は渡さない。VS Code 側は typeof で受け取る項目を選別しているため、
            // 渡さなければ検索パネルの現在の状態がそのまま残る。
            if (value !== undefined) {
                values.set(def.name, value);
            }
        }

        const str = (name: ParamName): string | undefined => values.get(name) as string | undefined;
        const bool = (name: ParamName): boolean | undefined => values.get(name) as boolean | undefined;
        const contextLines = values.get("contextLines") as number | undefined;

        // contextLines は workbench.action.findInFiles が受け付けない（IFindInFilesArgs に存在せず黙って捨てられる）。
        // そのため URI で明示的に要求され、かつ値が決まったときだけ、
        // contextLines を解釈できる Search Editor 側のコマンドへ切り替える。
        // 設定 urigrep.defaultContextLines だけでは切り替えない。
        if (queryParams.has("contextLines") && contextLines !== undefined) {
            return {
                command: OPEN_SEARCH_EDITOR_COMMAND,
                args: {
                    query: str("query"),
                    filesToInclude: str("filesToInclude"),
                    filesToExclude: str("filesToExclude"),
                    isRegexp: bool("isRegex"),
                    isCaseSensitive: bool("isCaseSensitive"),
                    matchWholeWord: bool("matchWholeWord"),
                    useExcludeSettingsAndIgnoreFiles: bool("useExcludeSettingsAndIgnoreFiles"),
                    triggerSearch: bool("triggerSearch"),
                    contextLines,
                },
                warnings,
            };
        }

        return {
            command: FIND_IN_FILES_COMMAND,
            args: {
                query: str("query"),
                filesToInclude: str("filesToInclude"),
                filesToExclude: str("filesToExclude"),
                isRegex: bool("isRegex"),
                isCaseSensitive: bool("isCaseSensitive"),
                matchWholeWord: bool("matchWholeWord"),
                useExcludeSettingsAndIgnoreFiles: bool("useExcludeSettingsAndIgnoreFiles"),
                triggerSearch: bool("triggerSearch"),
            },
            warnings,
        };
    }

    /** URI パラメータ > ユーザー設定 > fallback の順に値を決める。決まらなければ undefined。 */
    private resolve(
        queryParams: URLSearchParams,
        config: IConfigProvider,
        def: ParamDef,
        warnings: string[]
    ): string | boolean | number | undefined {
        if (queryParams.has(def.name)) {
            const raw = queryParams.get(def.name) ?? "";
            const parsed = parseValue(raw, def.type);
            if (parsed !== undefined) {
                return parsed;
            }
            warnings.push(`Ignored invalid value for '${def.name}': "${raw}" (expected ${def.type}).`);
        }

        const configured = config.get(def.configKey);
        if (typeof configured === def.type) {
            return configured;
        }

        return def.fallback;
    }
}

/** URI パラメータの文字列を型に応じて解釈する。解釈できなければ undefined を返す。 */
function parseValue(raw: string, type: ParamDef["type"]): string | boolean | number | undefined {
    if (type === "string") {
        return raw;
    }

    const normalized = raw.trim().toLowerCase();

    if (type === "boolean") {
        if (TRUE_VALUES.has(normalized)) {
            return true;
        }
        if (FALSE_VALUES.has(normalized)) {
            return false;
        }
        return undefined;
    }

    // 空文字は Number("") === 0 となってしまうため、数値として扱わない。
    if (normalized === "") {
        return undefined;
    }
    const num = Number(normalized);
    if (!Number.isFinite(num) || num < 0) {
        return undefined;
    }
    return Math.trunc(num);
}
