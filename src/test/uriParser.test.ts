import * as assert from 'assert';
import {
    UriParser,
    IConfigProvider,
    SearchRequest,
    FindInFilesArgs,
    SearchEditorArgs,
    FIND_IN_FILES_COMMAND,
    OPEN_SEARCH_EDITOR_COMMAND,
    parseQueryString,
} from '../uriParser';

class MockConfigProvider implements IConfigProvider {
    constructor(private config: Record<string, string | boolean | number> = {}) {}

    get(key: string): string | boolean | number | undefined {
        return this.config[key];
    }
}

/** 検索パネル向けのリクエストであることを確認しつつ引数を取り出す。 */
function findInFilesArgs(request: SearchRequest): FindInFilesArgs {
    assert.strictEqual(request.command, FIND_IN_FILES_COMMAND);
    return request.args as FindInFilesArgs;
}

/** Search Editor 向けのリクエストであることを確認しつつ引数を取り出す。 */
function searchEditorArgs(request: SearchRequest): SearchEditorArgs {
    assert.strictEqual(request.command, OPEN_SEARCH_EDITOR_COMMAND);
    return request.args as SearchEditorArgs;
}

suite('UriParser Test Suite', () => {
    let parser: UriParser;

    setup(() => {
        parser = new UriParser();
    });

    test('Should parse query string correctly', () => {
        const queryParams = parseQueryString('query=test&isRegex=true');
        const config = new MockConfigProvider();
        const args = findInFilesArgs(parser.parse(queryParams, config));

        assert.strictEqual(args.query, 'test');
        assert.strictEqual(args.isRegex, true);
    });

    test('Should use config defaults when param is missing', () => {
        const queryParams = parseQueryString('');
        const config = new MockConfigProvider({
            'defaultIsCaseSensitive': true
        });
        const args = findInFilesArgs(parser.parse(queryParams, config));

        assert.strictEqual(args.isCaseSensitive, true);
    });

    test('URI param should override config default', () => {
        const queryParams = parseQueryString('isCaseSensitive=false');
        const config = new MockConfigProvider({
            'defaultIsCaseSensitive': true
        });
        const args = findInFilesArgs(parser.parse(queryParams, config));

        assert.strictEqual(args.isCaseSensitive, false);
    });

    test('Unspecified params should not be sent at all', () => {
        // 送らなければ検索パネルの現在の状態が保たれる。
        const queryParams = parseQueryString('query=test');
        const config = new MockConfigProvider();
        const args = findInFilesArgs(parser.parse(queryParams, config));

        assert.strictEqual(args.isRegex, undefined);
        assert.strictEqual(args.isCaseSensitive, undefined);
        assert.strictEqual(args.matchWholeWord, undefined);
        assert.strictEqual(args.filesToInclude, undefined);
        assert.strictEqual(args.filesToExclude, undefined);
        assert.strictEqual(args.useExcludeSettingsAndIgnoreFiles, undefined);
    });

    test('triggerSearch should always be sent', () => {
        // 渡さないと VS Code は検索を開始しないため、この項目だけは既定値を持つ。
        const queryParams = parseQueryString('query=test');
        const config = new MockConfigProvider();
        const args = findInFilesArgs(parser.parse(queryParams, config));

        assert.strictEqual(args.triggerSearch, true);
    });

    test('Should handle triggerSearch param', () => {
        const queryParams = parseQueryString('triggerSearch=false');
        const config = new MockConfigProvider();
        const args = findInFilesArgs(parser.parse(queryParams, config));

        assert.strictEqual(args.triggerSearch, false);
    });

    test('Should accept common boolean spellings', () => {
        const config = new MockConfigProvider();

        for (const raw of ['true', 'TRUE', ' 1 ', 'yes', 'on']) {
            const args = findInFilesArgs(parser.parse(parseQueryString(`isRegex=${raw}`), config));
            assert.strictEqual(args.isRegex, true, `"${raw}" should be true`);
        }
        for (const raw of ['false', 'FALSE', '0', 'no', 'off']) {
            const args = findInFilesArgs(parser.parse(parseQueryString(`isRegex=${raw}`), config));
            assert.strictEqual(args.isRegex, false, `"${raw}" should be false`);
        }
    });

    test('A valueless boolean param should mean true', () => {
        const queryParams = parseQueryString('query=test&isRegex');
        const config = new MockConfigProvider();
        const args = findInFilesArgs(parser.parse(queryParams, config));

        assert.strictEqual(args.isRegex, true);
    });

    test('An invalid boolean should warn and fall back to the config value', () => {
        const queryParams = parseQueryString('isRegex=Ture');
        const config = new MockConfigProvider({ 'defaultIsRegex': true });
        const request = parser.parse(queryParams, config);

        assert.strictEqual(findInFilesArgs(request).isRegex, true);
        assert.strictEqual(request.warnings.length, 1);
        assert.ok(request.warnings[0].includes('isRegex'));
    });

    test('An invalid boolean without a config value should not be sent', () => {
        const queryParams = parseQueryString('isRegex=Ture');
        const config = new MockConfigProvider();
        const request = parser.parse(queryParams, config);

        assert.strictEqual(findInFilesArgs(request).isRegex, undefined);
        assert.strictEqual(request.warnings.length, 1);
    });

    test('Should not send contextLines to the search panel command', () => {
        const queryParams = parseQueryString('query=test');
        const config = new MockConfigProvider();
        const args = findInFilesArgs(parser.parse(queryParams, config));

        // findInFiles は contextLines を受け付けないため、キー自体を渡さない。
        assert.ok(!('contextLines' in args));
    });

    test('Explicit contextLines should route to the search editor', () => {
        const queryParams = parseQueryString('query=test&contextLines=5&isRegex=true');
        const config = new MockConfigProvider();
        const args = searchEditorArgs(parser.parse(queryParams, config));

        assert.strictEqual(args.contextLines, 5);
        assert.strictEqual(args.query, 'test');
        // Search Editor 側のフラグ名は isRegexp。
        assert.strictEqual(args.isRegexp, true);
        assert.ok(!('isRegex' in args));
    });

    test('Config default alone should not route to the search editor', () => {
        const queryParams = parseQueryString('query=test');
        const config = new MockConfigProvider({
            'defaultContextLines': 3
        });
        const request = parser.parse(queryParams, config);

        assert.strictEqual(request.command, FIND_IN_FILES_COMMAND);
    });

    test('Should fall back to the config value if the number is invalid', () => {
        const queryParams = parseQueryString('contextLines=abc');
        const config = new MockConfigProvider({ 'defaultContextLines': 5 });
        const request = parser.parse(queryParams, config);

        assert.strictEqual(searchEditorArgs(request).contextLines, 5);
        assert.strictEqual(request.warnings.length, 1);
    });

    test('An invalid contextLines without a config value should stay in the search panel', () => {
        for (const raw of ['abc', '', '-1', 'Infinity']) {
            const request = parser.parse(parseQueryString(`contextLines=${raw}`), new MockConfigProvider());

            assert.strictEqual(request.command, FIND_IN_FILES_COMMAND, `"${raw}" should not route`);
            assert.strictEqual(request.warnings.length, 1, `"${raw}" should warn`);
        }
    });

    test('Should truncate a fractional contextLines', () => {
        const request = parser.parse(parseQueryString('contextLines=3.7'), new MockConfigProvider());

        assert.strictEqual(searchEditorArgs(request).contextLines, 3);
        assert.strictEqual(request.warnings.length, 0);
    });
});

suite('parseQueryString Test Suite', () => {
    test('Should keep "+" as a literal character', () => {
        assert.strictEqual(parseQueryString('query=\\d+').get('query'), '\\d+');
        assert.strictEqual(parseQueryString('query=C++').get('query'), 'C++');
    });

    test('Should split on the first "=" only', () => {
        assert.strictEqual(parseQueryString('query=a=b').get('query'), 'a=b');
    });

    test('Should decode double-encoded sequences', () => {
        assert.strictEqual(parseQueryString('query=a%20b').get('query'), 'a b');
        assert.strictEqual(parseQueryString('query=a%26b').get('query'), 'a&b');
    });

    test('Should pass through malformed percent sequences', () => {
        assert.strictEqual(parseQueryString('query=50%off').get('query'), '50%off');
    });

    test('Should handle keys without a value and empty segments', () => {
        const params = parseQueryString('?isRegex&&query=a');
        assert.strictEqual(params.get('isRegex'), '');
        assert.strictEqual(params.get('query'), 'a');
    });

    test('Should return empty params for an empty query', () => {
        assert.strictEqual([...parseQueryString('')].length, 0);
    });
});
