# Change Log

All notable changes to the "uri-grep" extension will be documented in this file.

## [0.0.2] - 2025-04-29

### Changed

- Renamed extension from "URI Search" to "URI Grep".
- Updated URI scheme from `vscode://mfujita47.uri-search/search?...` to `vscode://mfujita47.uri-grep/search?...`

## [0.0.1] - 2025-04-20

### Added

- Initial release of the URI Search extension.
- Allows triggering VS Code's "Search in Files" via a custom URI scheme (`vscode://mfujita47.uri-search/search?...`).
- Supports parameters: `query`, `filesToInclude`, `filesToExclude`, `isRegex`, `isCaseSensitive`, `matchWholeWord`, `useExcludeSettingsAndIgnoreFiles`.
- Configuration options available in `settings.json` to set default parameter values.
