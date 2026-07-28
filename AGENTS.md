# AGENTS.md — URI Grep

A VS Code extension that turns a URI into a "Search in Files" invocation:

```
vscode://mfujita47.uri-grep/search?query=TODO&filesToInclude=src/**/*.ts&isRegex
```

The URI scheme is a public contract. Do not rename the publisher, the extension id or the
`/search` path — existing scripts and batch files depend on them.

## Layout

```
src/extension.ts               URI handler registration, output channel, command execution
src/uriParser.ts               query-string parsing, parameter resolution, command selection
src/test/                      unit tests (uriParser) and integration tests (extension)
media/icon.png                 marketplace icon (128x128)
.github/workflows/ci.yml       lint, compile, test on Linux + Windows, build the .vsix
.github/workflows/release.yml  tag-triggered release: GitHub Release + Marketplace + Open VSX
```

## Behaviour that is easy to break

- **Unspecified parameters are not sent.** A parameter reaches VS Code only when the URI
  specifies it, or when the user has *explicitly* set the matching `urigrep.default*` setting.
  Everything else is omitted so the Search panel keeps its current state. `VSCodeConfigProvider`
  therefore uses `config.inspect()`, not `config.get()` — `get()` would return the `package.json`
  default and make "never configured" indistinguishable from "configured to the default".
  For the same reason the settings in `package.json` carry no `default` values, except
  `urigrep.defaultTriggerSearch`.
- **`triggerSearch` is the one exception** and is always sent (`fallback: true` in
  `PARAM_DEFINITIONS`); without it VS Code fills the panel but never starts the search.
- **`contextLines` switches commands.** `workbench.action.findInFiles` silently drops it, so a URI
  that carries a valid `contextLines` is routed to `search.action.openEditor` (Search Editor)
  instead, where the regex flag is named `isRegexp`, not `isRegex`. The
  `urigrep.defaultContextLines` setting alone must never trigger that switch.
- **The query string is parsed by hand** (`parseQueryString`). `URLSearchParams` would decode `+`
  as a space and break `query=\d+` and `query=C++`. VS Code percent-decodes the URI before the
  handler sees it, so `&` and `#` inside a value have to be double-encoded by the caller.
- **Invalid values are never applied silently.** They are collected in the `warnings` array,
  reported in the "URI Grep" output channel, and fall back to the setting or stay unspecified.
- Log through `log()` in `extension.ts`. Console output is gated on `ExtensionMode.Development` —
  `process.env.NODE_ENV` is unset in the extension host.

## Adding or changing a parameter

Four places must stay in sync, or `extension.test.ts` will fail:

1. `PARAM_DEFINITIONS` and `ParamName` in `src/uriParser.ts`
2. `FindInFilesArgs` / `SearchEditorArgs` and the argument objects in `UriParser.parse`
3. `contributes.configuration.properties` in `package.json` (same type, no `default`)
4. the parameter table in `README.md`

## Commands

```bash
npm install
npm run compile        # tsc
npm run lint           # eslint
npm test               # pretest (compile + lint), then vscode-test
npm run package        # build a .vsix locally
```

`npm test` launches a real editor. By default it uses a locally installed Antigravity IDE; set
`URIGREP_TEST_TARGET=vscode` to download a stable VS Code build instead (this is what CI does), or
point the variable at any other fork's executable. See `.vscode-test.mjs`.

## Releasing

1. Add the new section to `CHANGELOG.md` — the release notes are generated from it, so the heading
   must be `## [<version>] - <date>`.
2. `npm version <version>` (writes `package.json` and `package-lock.json`, and creates the
   `v<version>` tag).
3. `git push --follow-tags`.

`release.yml` then verifies the tag against `package.json`, runs the tests, builds and attests the
`.vsix`, creates the GitHub Release with the `.vsix` attached, and publishes to the VS Code
Marketplace (`VSCE_PAT`) and Open VSX (`OVSX_PAT`). Do not publish by hand unless the workflow is
broken — the Release and the two registries are meant to stay in lockstep.
