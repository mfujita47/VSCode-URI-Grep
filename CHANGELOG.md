# Changelog

All notable changes to the "uri-grep" extension are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html). From 1.5.0 on, each entry is
also published as a [GitHub Release](https://github.com/mfujita47/VSCode-URI-Grep/releases) with the
packaged `.vsix` attached; the release notes are generated from the section below.

## [1.5.0] - 2026-07-28

### Fixed

- Fixed `contextLines` being silently ignored. `workbench.action.findInFiles` does not accept a `contextLines` argument, so a URI that specifies `contextLines` now opens a Search Editor (`search.action.openEditor`) instead, which does support context lines. The regex flag is translated to the Search Editor's `isRegexp` name. Searches without `contextLines` keep using the search panel as before.
- Fixed `+` in the query string being turned into a space. `query=\d+` and `query=C++` are now passed through literally. Use `%20` for a space.
- Boolean parameters now accept `true`/`1`/`yes`/`on` and `false`/`0`/`no`/`off` (case-insensitive), and a parameter written without a value (`&isRegex`) means `true`. Previously anything other than the exact string `true` was silently treated as `false`.
- Numeric parameters now reject empty, negative and non-finite values instead of silently becoming `0` or being passed through. Fractional values are truncated.
- Invalid parameter values are no longer applied silently: they are reported in the **URI Grep** output channel and the value falls back to the setting, or is left unspecified.
- A URI whose path is not `/search` is now rejected with an error message instead of running a search anyway.
- Debug output no longer goes to the developer console in normal use. The check used `process.env.NODE_ENV`, which is unset in the extension host, so it was always on; it now uses `ExtensionMode.Development`.

### Changed

- **Parameters that are not specified are no longer sent to VS Code.** Previously every parameter was sent on every invocation, so a URI that only set `query` also cleared the "files to include" box and reset the regex/case toggles. Now a parameter is sent only when the URI specifies it or when the corresponding `urigrep.default*` setting has been set explicitly; otherwise the Search panel keeps its current value. `triggerSearch` is the exception and is always sent, since VS Code will not start the search without it. If you relied on the old reset behaviour, spell the parameters out in the URI or set the `urigrep.default*` settings explicitly.
- The `urigrep.default*` settings no longer carry built-in default values (except `defaultTriggerSearch`), so that "never configured" can be distinguished from "configured to the default value".
- `urigrep.defaultContextLines` is now only a fallback for an invalid `contextLines` value in the URI; it no longer implies context lines for every search (which would have forced every search into a Search Editor).

### Removed

- Removed the `contributes.uriHandler` entry from `package.json`. It is not a real contribution point; the handler is registered at runtime with `window.registerUriHandler` and activated by `onUri`.
- Removed the unused `preserveCase` field from the command arguments.

### Internal

- Restored the test setup. `eslint.config.mjs` and `.vscode-test.mjs` were both missing (the latter was even listed in `.gitignore`), so `npm test` failed at the `pretest` step without running a single test.
- Bumped `@vscode/test-electron` to `^3.1.0`. Version 2.x spawns VS Code with `shell: true` on Windows without quoting its arguments, so `--extensionTestsPath` was cut at the first space when the repository path contains one.
- Reworked the extension tests to verify activation, the existence of the commands the URI handler dispatches to, and that every parameter is contributed as a setting with a matching type and no stray default value.
- Widened `.gitignore`'s backup-file patterns from `*.b*` / `.b*` (which also swallowed unrelated files) to `*.bak`, `*.backup` and `*.orig`.
- Version 1.4.1 was a local version bump that was never released or recorded here; 1.5.0 supersedes it.
- `.vscode-test.mjs` now runs the tests in Antigravity IDE when it is installed. Set `URIGREP_TEST_TARGET=vscode` to test against a downloaded VS Code build instead, or point it at any other fork's executable.

## [1.4.0] - 2026-02-14

### Changed

- Markedly improved icon visibility.

## [1.3.0] - 2026-02-13

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

[1.5.0]: https://github.com/mfujita47/VSCode-URI-Grep/releases/tag/v1.5.0
