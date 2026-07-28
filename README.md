# 🔍 URI Grep: Trigger Global Search via URI

[![Visual Studio Marketplace](https://img.shields.io/visual-studio-marketplace/v/mfujita47.uri-grep?logo=visualstudiocode&label=Marketplace)](https://marketplace.visualstudio.com/items?itemName=mfujita47.uri-grep)
[![Open VSX](https://img.shields.io/open-vsx/v/mfujita47/uri-grep?logo=eclipseide&label=Open%20VSX)](https://open-vsx.org/extension/mfujita47/uri-grep)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/mfujita47.uri-grep?label=installs)](https://marketplace.visualstudio.com/items?itemName=mfujita47.uri-grep)
[![CI](https://github.com/mfujita47/VSCode-URI-Grep/actions/workflows/ci.yml/badge.svg)](https://github.com/mfujita47/VSCode-URI-Grep/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**URI Grep** is a lightweight VS Code extension that allows you to trigger the built-in "Search in Files" feature (Global Search) using a custom URI scheme. It's designed for seamless integration with external scripts, batch files, or automation tools.

## 📦 Install

| Editor | How |
| :--- | :--- |
| VS Code | [Marketplace](https://marketplace.visualstudio.com/items?itemName=mfujita47.uri-grep) — or `code --install-extension mfujita47.uri-grep` |
| Forks (Antigravity IDE, VSCodium, Cursor, …) | [Open VSX](https://open-vsx.org/extension/mfujita47/uri-grep) — or `<editor> --install-extension mfujita47.uri-grep` |
| Any editor, offline | Download the `.vsix` from the [latest release](https://github.com/mfujita47/VSCode-URI-Grep/releases/latest), then `code --install-extension uri-grep-<version>.vsix` |

## ✨ Key Features

- **🚀 External Integration**: Launch complex searches directly from your terminal, scripts, or other applications.
- **⚙️ Deep Customization**: Control every aspect of the search, including regex, case sensitivity, file inclusion/exclusion, and context lines.
- **🔄 Smart Fallbacks**: Intelligent priority system: **URI Parameter > VS Code Setting > left untouched**.
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
| `contextLines` | Number of surrounding lines to show. **Opens the Search Editor** instead of the search panel (see note below). | `urigrep.defaultContextLines` |
| `useExcludeSettingsAndIgnoreFiles` | Respect `.gitignore` and exclude settings. | `urigrep.defaultUseExcludeSettingsAndIgnoreFiles` |
| `triggerSearch` | Execute search immediately (`true`) or just fill panel (`false`). | `urigrep.defaultTriggerSearch` (always applied, default `true`) |

Boolean parameters accept `true`/`1`/`yes`/`on` and `false`/`0`/`no`/`off` (case-insensitive).
A parameter written without a value — `&isRegex` — means `true`. Anything else is reported in the
**URI Grep** output channel and ignored.

The URI path must be `/search`; any other path is rejected with an error message.

### 🧩 Note: VS Code forks use a different scheme

Forks register their own URL protocol, so `vscode://` only reaches VS Code itself. Replace the
scheme with the fork's `urlProtocol` (found in its `resources/app/product.json`):

| Editor | URI |
| :--- | :--- |
| VS Code | `vscode://mfujita47.uri-grep/search?query=TODO` |
| VS Code Insiders | `vscode-insiders://mfujita47.uri-grep/search?query=TODO` |
| Antigravity IDE | `antigravity-ide://mfujita47.uri-grep/search?query=TODO` |

Forks usually pull extensions from Open VSX rather than the VS Code Marketplace, so install from
[Open VSX](https://open-vsx.org/extension/mfujita47/uri-grep) — e.g.
`antigravity-ide --install-extension mfujita47.uri-grep` — or from a downloaded `.vsix`.

### 🧭 Note: Unspecified parameters are left untouched

A parameter is only sent to VS Code when the URI specifies it, or when the corresponding
`urigrep.default*` setting has been set explicitly. Anything else is **not sent at all**, so the
Search panel keeps whatever it currently holds — a URI can change just the query without wiping
the "files to include" box you typed by hand.

The exception is `triggerSearch`, which is always sent (defaulting to `true`); without it VS Code
would only fill in the Search panel without running the search.

If you want a search to be fully reproducible regardless of the panel's current state, spell out
every relevant parameter in the URI, or pin them via the `urigrep.default*` settings.

### 📐 Note: `contextLines` opens the Search Editor

VS Code's search panel command (`workbench.action.findInFiles`) does not accept a `contextLines`
argument — only the **Search Editor** supports context lines. Therefore:

- If `contextLines` is present in the URI, the search is opened in a **Search Editor**
  (`search.action.openEditor`, reusing an existing Search Editor if there is one).
- Otherwise, the search is opened in the usual **search panel**.

The `urigrep.defaultContextLines` setting on its own does **not** switch to the Search Editor;
it only supplies a value when the URI specifies `contextLines` without a valid number.

### 🔤 Note: URI encoding

The query string is taken literally except for percent-encoding, so `+` is **kept as `+`**
(unlike `application/x-www-form-urlencoded`, where `+` means a space). This means regular
expressions such as `\d+` and searches such as `C++` work as typed.

Consequences:

- Use `%20` for a space. A literal `+` is *not* a space.
- `&` and `#` cannot appear directly in a value — VS Code decodes the URI before the extension
  sees it, so they would split the query. Encode them **twice** (`%2526` for `&`, `%2523` for `#`).
- On some shells, `&`, `^` and `%` also need shell-level quoting or escaping.

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

Values used when the URI does not specify a parameter. **Settings you never touch have no effect**:
the parameter is simply not sent, and the Search panel keeps its current value.

- `urigrep.defaultQuery`: Search term.
- `urigrep.defaultFilesToInclude`: Inclusion pattern.
- `urigrep.defaultFilesToExclude`: Exclusion pattern.
- `urigrep.defaultIsRegex`: Regex.
- `urigrep.defaultIsCaseSensitive`: Case sensitivity.
- `urigrep.defaultMatchWholeWord`: Whole word.
- `urigrep.defaultUseExcludeSettingsAndIgnoreFiles`: Respect `.gitignore` and exclude settings.
- `urigrep.defaultContextLines`: Fallback used when the URI specifies `contextLines` without a valid number. Does not by itself switch to the Search Editor.
- `urigrep.defaultTriggerSearch`: Whether to run the search immediately (Default: `true`). Unlike the others, this one always applies.

## 📜 Changelog

Every version is published as a [GitHub Release](https://github.com/mfujita47/VSCode-URI-Grep/releases)
with its notes and a downloadable `.vsix`. The full history lives in [CHANGELOG.md](CHANGELOG.md).

## 📄 License

[MIT License](LICENSE)
