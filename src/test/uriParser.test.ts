import * as assert from 'assert';
import { UriParser, IConfigProvider } from '../uriParser';

class MockConfigProvider implements IConfigProvider {
    constructor(private config: Record<string, string | boolean | number> = {}) {}

    get<T>(key: string, defaultValue: T): T {
        const val = this.config[key];
        return (val !== undefined ? val : defaultValue) as T;
    }
}

suite('UriParser Test Suite', () => {
    let parser: UriParser;

    setup(() => {
        parser = new UriParser();
    });

    test('Should parse query string correctly', () => {
        const queryParams = new URLSearchParams('query=test&isRegex=true');
        const config = new MockConfigProvider();
        const args = parser.parse(queryParams, config);

        assert.strictEqual(args.query, 'test');
        assert.strictEqual(args.isRegex, true);
        assert.strictEqual(args.isCaseSensitive, false); // Default value from definition
    });

    test('Should use config defaults when param is missing', () => {
        const queryParams = new URLSearchParams('');
        const config = new MockConfigProvider({
            'defaultIsCaseSensitive': true
        });
        const args = parser.parse(queryParams, config);

        assert.strictEqual(args.isCaseSensitive, true);
    });

    test('URI param should override config default', () => {
        const queryParams = new URLSearchParams('isCaseSensitive=false');
        const config = new MockConfigProvider({
            'defaultIsCaseSensitive': true
        });
        const args = parser.parse(queryParams, config);

        assert.strictEqual(args.isCaseSensitive, false);
    });

    test('Should parse numbers correctly', () => {
         const queryParams = new URLSearchParams('contextLines=5');
         const config = new MockConfigProvider();
         const args = parser.parse(queryParams, config);

         assert.strictEqual(args.contextLines, 5);
    });
    
    test('Should handle triggerSearch param', () => {
        const queryParams = new URLSearchParams('triggerSearch=false');
        const config = new MockConfigProvider();
        const args = parser.parse(queryParams, config);

        assert.strictEqual(args.triggerSearch, false);
    });

    test('Should fall back to default if number is invalid', () => {
        const queryParams = new URLSearchParams('contextLines=abc');
        const config = new MockConfigProvider();
        const args = parser.parse(queryParams, config);

        // Default is 1
        assert.strictEqual(args.contextLines, 1);
   });
});
