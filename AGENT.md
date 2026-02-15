# AGENT.md - VSCode-URI-Grep Extension

## Project Overview

**VSCode-URI-Grep** is a Visual Studio Code extension that enables triggering VS Code's built-in "Search in Files" (Global Search) feature via a custom URI scheme (`vscode://mfujita47.uri-grep/search`). This allows external tools, scripts, and automation to programmatically initiate searches within VS Code workspaces.

## Purpose and Use Case

The extension bridges external tools with VS Code's search functionality, enabling:
- Command-line scripts (batch files, PowerShell, bash) to trigger VS Code searches
- External applications to integrate with VS Code's search interface
- Automation tools to execute searches with specific parameters
- CI/CD pipelines or build tools to open search results in VS Code

## Technical Architecture

### Core Components

1. **extension.ts** - Main extension file
   - Exports `activate()` and `deactivate()` lifecycle functions
   - Registers a `UriHandler` class that implements `vscode.UriHandler`
   - Creates an output channel for logging
   - Handles URI scheme: `vscode://mfujita47.uri-grep/search?query=...`

2. **uriParser.ts** - URI parsing logic
   - `UriParser` class: Parses URI query parameters and resolves configuration
   - `IConfigProvider` interface: Abstracts VS Code configuration access
   - `ParamDef` interface: Defines parameter metadata (name, type, default value)
   - `PARAM_DEFINITIONS` array: Lists all supported parameters with their config keys

3. **Configuration System**
   - Uses `urigrep.*` settings namespace
   - Three-level priority: URI parameter > VS Code setting > extension default
   - All parameters are optional except `query` (search term)

### Supported Parameters

| Parameter | Type | Default | Config Key | Description |
|-----------|------|---------|------------|-------------|
| `query` | string | "" | `defaultQuery` | Search term or regex pattern |
| `filesToInclude` | string | "" | `defaultFilesToInclude` | Glob pattern for included files |
| `filesToExclude` | string | "" | `defaultFilesToExclude` | Glob pattern for excluded files |
| `isRegex` | boolean | false | `defaultIsRegex` | Treat query as regex |
| `isCaseSensitive` | boolean | false | `defaultIsCaseSensitive` | Case-sensitive search |
| `matchWholeWord` | boolean | false | `defaultMatchWholeWord` | Match whole words only |
| `contextLines` | number | 1 | `defaultContextLines` | Number of context lines in results |
| `useExcludeSettingsAndIgnoreFiles` | boolean | true | `defaultUseExcludeSettingsAndIgnoreFiles` | Respect .gitignore |
| `triggerSearch` | boolean | true | `defaultTriggerSearch` | Auto-execute search |

## Project Structure

```
VSCode-URI-Grep/
├── src/
│   ├── extension.ts          # Main extension entry point
│   ├── uriParser.ts           # URI parsing and config resolution
│   └── test/
│       ├── extension.test.ts  # Extension integration tests
│       └── uriParser.test.ts  # Parser unit tests
├── media/
│   └── icon.png               # Extension icon
├── package.json               # Extension manifest and config
├── tsconfig.json              # TypeScript configuration
├── README.md                  # User documentation
├── CHANGELOG.md               # Version history
└── LICENSE                    # MIT License
```

## Development Workflow

### Building and Testing

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch mode (auto-compile on changes)
npm run watch

# Run linting
npm run lint

# Run tests
npm test

# Package for publishing (includes compile)
npm run vscode:prepublish
```

### Testing the Extension

1. Open project in VS Code
2. Press F5 to launch Extension Development Host
3. Test URI from terminal:
   ```bash
   # Windows
   start "" "vscode://mfujita47.uri-grep/search?query=test"
   
   # macOS/Linux
   open "vscode://mfujita47.uri-grep/search?query=test"
   ```
4. Check "URI Grep" output channel for logs

## Key Implementation Details

### URI Handler Registration

The extension registers as a URI handler during activation:
```typescript
vscode.window.registerUriHandler(uriHandler)
```

### Parameter Resolution Flow

1. URI received via `handleUri(uri: vscode.Uri)`
2. Query parameters extracted with `URLSearchParams`
3. For each parameter in `PARAM_DEFINITIONS`:
   - Check if present in URI query params → use URI value
   - Else, check VS Code settings → use setting value
   - Else, use parameter's default value
4. Execute `workbench.action.findInFiles` with resolved args

### Type Safety

- Uses TypeScript strict mode
- Interface `FindInFilesArgs` matches VS Code's search command arguments
- `IConfigProvider` abstracts configuration access for testability
- Runtime type validation for boolean/number conversions

### Logging

- Dedicated "URI Grep" output channel
- Logs URI receipt, parameter parsing, command execution
- Includes timestamps
- Only logs to console in non-production environments

## Configuration Example

User's `settings.json`:
```json
{
  "urigrep.defaultIsRegex": true,
  "urigrep.defaultContextLines": 2,
  "urigrep.defaultFilesToInclude": "src/**/*.ts",
  "urigrep.defaultFilesToExclude": "**/node_modules/**"
}
```

## Common Issues and Solutions

### URI not triggering VS Code
- Ensure extension is installed and activated
- Check URI scheme format: `vscode://mfujita47.uri-grep/search?query=...`
- Verify URL encoding for special characters

### Search not executing
- Check `triggerSearch` parameter (default: true)
- Verify VS Code workspace is open
- Check Output Channel for error messages

### Regex not working
- Ensure `isRegex=true` is set in URI
- Escape special characters in query parameter
- Test regex pattern in VS Code's search UI first

## Extension Dependencies

### Runtime
- VS Code Engine: ^1.99.0
- No external runtime dependencies

### Development
- TypeScript 5.8.2
- ESLint with TypeScript support
- Mocha for testing
- @vscode/test-electron for integration tests

## Security Considerations

- Extension only accepts URI parameters; no code execution
- Uses VS Code's built-in search command (no custom file access)
- Configuration through VS Code's standard settings system
- No network requests or external API calls
- No sensitive data storage

## Publishing

- Published to VS Code Marketplace as `mfujita47.uri-grep`
- Uses vsce (VS Code Extension Manager) for packaging
- Follows semantic versioning
- Icon: 128x128 PNG in media/icon.png

## Version History Highlights

- **v1.4.0** (2026-02-14): Improved icon visibility
- **v1.3.0** (2026-02-13): Added contextLines, refactored with UriParser class, added tests
- **v1.2.0** (2026-01-25): Fixed query parameter fallback bug
- **v1.1.0** (2025-04-29): Renamed from "URI Search" to "URI Grep"
- **v1.0.0** (2025-04-20): Initial release

## For AI Agents: Quick Reference

### When modifying this extension:

1. **TypeScript Compilation Required**: Run `npm run compile` after changes
2. **Test Before Publishing**: Extension tests use VS Code's test infrastructure
3. **Parameter Changes**: Update both `PARAM_DEFINITIONS` in uriParser.ts and package.json `configuration` section
4. **URI Scheme is Fixed**: Cannot be changed without breaking existing integrations
5. **Logging**: Use the `log()` function in extension.ts (not console.log)
6. **VS Code API**: Use `vscode.*` namespace; check VS Code version compatibility (^1.99.0)

### File Modification Guide:

- **Add new parameter**: Update `PARAM_DEFINITIONS`, `FindInFilesArgs` interface, and package.json
- **Change default values**: Update in `PARAM_DEFINITIONS` array
- **Add feature**: Keep minimal changes to maintain stability
- **Fix bugs**: Add test cases in src/test/ directory first
- **Update docs**: Modify README.md for users, this file (AGENT.md) for AI agents

### Testing Commands:

```bash
npm run lint              # Check code style
npm run compile           # Build TypeScript
npm test                  # Run all tests
npm run watch             # Auto-compile on changes
```

### Code Style:

- Uses ESLint with TypeScript rules
- Strict type checking enabled
- Prefer explicit types over inference for interfaces
- Use descriptive variable names
- Comment in English (some legacy Japanese comments exist)

## License

MIT License - See LICENSE file for full text
