# URI Grep README

This extension allows you to trigger VS Code's "Search in Files" feature (Ctrl+Shift+F) using a custom URI scheme. This is useful for launching searches from external scripts or tools like batch files.

## Usage

**URI Format:**

```
vscode://mfujita47.uri-grep/search?query=<search_term>&filesToInclude=<include_glob>&filesToExclude=<exclude_glob>&isRegex=<true|false>&isCaseSensitive=<true|false>&matchWholeWord=<true|false>&useExcludeSettingsAndIgnoreFiles=<true|false>
```

**Parameters:**

All parameters except `query` are optional. If an optional parameter is omitted from the URI, the extension will first check your VS Code settings (`settings.json`) for a corresponding default value (see Configuration below). If no setting is found, a hardcoded default value within the extension will be used.

The priority for parameter values is: **URI Parameter > VS Code Setting > Extension Default**.

- `query`: The string or regular expression to search for. (Required)
- `filesToInclude`: Glob pattern for files to include in the search (e.g., `src/**/*.ts`).
- `filesToExclude`: Glob pattern for files to exclude from the search (e.g., `**/node_modules/**,**/*.log`).
- `isRegex`: Treat `query` as a regular expression (`true` or `false`). (Default: `false`)
- `isCaseSensitive`: Perform a case-sensitive search (`true` or `false`). (Default: `false`)
- `matchWholeWord`: Match whole words only (`true` or `false`). (Default: `false`)

**Example URI:**

Search for the regular expression `console\.log` within TypeScript files in the `src` directory:

```uri
vscode://mfujita47.uri-grep/search?query=console\.log&filesToInclude=src/**/*.ts&isRegex=true
```

**Launching from External Tools:**

You can use the example URI above to launch the search from your preferred tool:

- **Command Prompt (cmd.exe):**

  ```batch
  start "" "vscode://mfujita47.uri-grep/search?query=console\.log&filesToInclude=src/**/*.ts&isRegex=true"
  ```

- **PowerShell:**
  ```powershell
  Start-Process "vscode://mfujita47.uri-grep/search?query=console\.log&filesToInclude=src/**/*.ts&isRegex=true"
  ```

## Configuration

You can configure the default behavior of this extension by modifying your VS Code settings (`settings.json`). These settings are used when the corresponding parameters are omitted from the URI:

- `urigrep.defaultFilesToInclude`: Default glob pattern for files to include.
- `urigrep.defaultFilesToExclude`: Default glob pattern for files to exclude.
- `urigrep.defaultIsRegex`: Default value for `isRegex`.
- `urigrep.defaultIsCaseSensitive`: Default value for `isCaseSensitive`.
- `urigrep.defaultMatchWholeWord`: Default value for `matchWholeWord`.

**Note:** This URI scheme works best when the extension is properly installed (not just running in development mode).
