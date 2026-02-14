export interface FindInFilesArgs {
    query?: string;
    filesToInclude?: string;
    filesToExclude?: string;
    isRegex?: boolean;
    isCaseSensitive?: boolean;
    matchWholeWord?: boolean;
    preserveCase?: boolean;
    useExcludeSettingsAndIgnoreFiles?: boolean;
    triggerSearch?: boolean;
    contextLines?: number;
}

export interface IConfigProvider {
    get<T>(key: string, defaultValue: T): T;
}

export interface ParamDef {
    name: keyof FindInFilesArgs;
    configKey: string;
    defaultValue: string | boolean | number;
    type: "string" | "boolean" | "number";
}

export const PARAM_DEFINITIONS: ParamDef[] = [
    { name: "query", configKey: "defaultQuery", defaultValue: "", type: "string" },
    { name: "filesToInclude", configKey: "defaultFilesToInclude", defaultValue: "", type: "string" },
    { name: "filesToExclude", configKey: "defaultFilesToExclude", defaultValue: "", type: "string" },
    { name: "isCaseSensitive", configKey: "defaultIsCaseSensitive", defaultValue: false, type: "boolean" },
    { name: "matchWholeWord", configKey: "defaultMatchWholeWord", defaultValue: false, type: "boolean" },
    { name: "isRegex", configKey: "defaultIsRegex", defaultValue: false, type: "boolean" },
    { name: "useExcludeSettingsAndIgnoreFiles", configKey: "defaultUseExcludeSettingsAndIgnoreFiles", defaultValue: true, type: "boolean" },
    { name: "contextLines", configKey: "defaultContextLines", defaultValue: 1, type: "number" },
    { name: "triggerSearch", configKey: "defaultTriggerSearch", defaultValue: true, type: "boolean" },
];

export class UriParser {
    public parse(queryParams: URLSearchParams, config: IConfigProvider): FindInFilesArgs {
        const commandArgs: FindInFilesArgs = {};

        for (const def of PARAM_DEFINITIONS) {
            const value = this.getParam(queryParams, def.name, config, def.configKey, def.defaultValue, def.type);
            
            // 明示的な型ガードを行い、FindInFilesArgs の型に合わせる
            if (def.type === "string" && typeof value === "string") {
                (commandArgs as any)[def.name] = value;
            } else if (def.type === "boolean" && typeof value === "boolean") {
                (commandArgs as any)[def.name] = value;
            } else if (def.type === "number" && typeof value === "number") {
                (commandArgs as any)[def.name] = value;
            }
        }

        return commandArgs;
    }

    private getParam(
        queryParams: URLSearchParams,
        uriParamName: string,
        config: IConfigProvider,
        configKeySuffix: string,
        fallbackValue: string | boolean | number,
        type: "string" | "boolean" | "number"
    ): string | boolean | number {
        if (queryParams.has(uriParamName)) {
            const value = queryParams.get(uriParamName);
            if (value !== null) {
                if (type === "boolean") {
                    return value.toLowerCase() === "true";
                }
                if (type === "number") {
                    const num = Number(value);
                    return isNaN(num) ? (fallbackValue as number) : num;
                }
                return value;
            }
        }

        return config.get(configKeySuffix, fallbackValue);
    }
}
