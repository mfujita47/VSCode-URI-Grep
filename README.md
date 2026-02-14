# 🔍 URI Grep: Trigger Global Search via URI (v1.4.0)

**URI Grep** is a lightweight VS Code extension that allows you to trigger the built-in "Search in Files" feature (Global Search) using a custom URI scheme. It's designed for seamless integration with external scripts, batch files, or automation tools.

## ✨ Key Features

- **🚀 External Integration**: Launch complex searches directly from your terminal, scripts, or other applications.
- **⚙️ Deep Customization**: Control every aspect of the search, including regex, case sensitivity, file inclusion/exclusion, and context lines.
- **🔄 Smart Fallbacks**: Intelligent priority system: **URI Parameter > VS Code Setting > Extension Default**.
- **📋 Context-Aware**: Support for showing surrounding lines (context) in search results.

## 🚀 Usage

### URI Format
```uri
vscode://mfujita47.uri-grep/search?query=<search_term>&[parameters]
```

### Supported Parameters

| Parameter | Description | Default (Setting) |
| :--- | :--- | :--- |
| `query` | **(Required)** The string or regex to search for. | - |
| `filesToInclude` | Glob pattern for files to search in (e.g., `src/**/*.ts`). | `urigrep.defaultFilesToInclude` |
| `filesToExclude` | Glob pattern for files to skip (e.g., `**/node_modules/**`). | `urigrep.defaultFilesToExclude` |
| `isRegex` | Treat query as a regular expression (`true`/`false`). | `urigrep.defaultIsRegex` |
| `isCaseSensitive` | Perform case-sensitive search (`true`/`false`). | `urigrep.defaultIsCaseSensitive` |
| `matchWholeWord` | Match whole words only (`true`/`false`). | `urigrep.defaultMatchWholeWord` |
| `contextLines` | Number of surrounding lines to show. | `urigrep.defaultContextLines` |
| `useExcludeSettingsAndIgnoreFiles` | Respect `.gitignore` and exclude settings. | `urigrep.defaultUseExcludeSettingsAndIgnoreFiles` |
| `triggerSearch` | Execute search immediately (`true`) or just fill panel (`false`). | `urigrep.defaultTriggerSearch` |

### Examples

**Search for `console.log` in TypeScript files:**
```uri
vscode://mfujita47.uri-grep/search?query=console\.log&filesToInclude=src/**/*.ts&isRegex=true
```

**Launch from Command Line:**

- **Command Prompt (cmd.exe):**
  ```batch
  start "" "vscode://mfujita47.uri-grep/search?query=TODO&isCaseSensitive=true"
  ```
- **PowerShell:**
  ```powershell
  Start-Process "vscode://mfujita47.uri-grep/search?query=FIXME&contextLines=3"
  ```

## ⚙️ Configuration

Customize default values via VS Code Settings or `settings.json`:

- `urigrep.defaultQuery`: Default search term.
- `urigrep.defaultFilesToInclude`: Default inclusion pattern.
- `urigrep.defaultFilesToExclude`: Default exclusion pattern.
- `urigrep.defaultIsRegex`: Default regex setting.
- `urigrep.defaultIsCaseSensitive`: Default case sensitivity.
- `urigrep.defaultMatchWholeWord`: Default whole word setting.
- `urigrep.defaultContextLines`: Default number of context lines (Default: `1`).
- `urigrep.defaultUseExcludeSettingsAndIgnoreFiles`: Default for ignoring files (Default: `true`).
- `urigrep.defaultTriggerSearch`: Default for executing search immediately (Default: `true`).

## 📄 License

[MIT License](LICENSE)
