# Change Log

All notable changes to the "uri-grep" extension will be documented in this file.

## [1.3.0] - 2026-02-14

### Added

- Added support for `contextLines`, `useExcludeSettingsAndIgnoreFiles`, and `triggerSearch` parameters.
- Added comprehensive unit tests for URI parsing logic.
- Added a dedicated "URI Grep" Output channel for improved logging.
- Renewed the extension icon.

### Changed

- Refactored internal architecture: extracted URI parsing into a standalone `UriParser` class for better testability.
- Achieved strict type safety across the codebase by eliminating `any` and improving null/undefined handling.
- Redesigned README with a modern style and detailed parameter documentation.

## [1.2.0] - 2026-01-25

### Fixed

- Fixed a bug where the `query` parameter would incorrectly fallback to `filesToInclude` settings if not provided.

### Changed

- Optimized internal code: implemented a robust parameter handling system and centralized configuration logic.

## [1.1.0] - 2025-04-29

### Changed

- Renamed extension from "URI Search" to "URI Grep".
- Updated URI scheme to `vscode://mfujita47.uri-grep/search?...`

## [1.0.0] - 2025-04-20

### Added

- Initial release of the URI Search extension.
