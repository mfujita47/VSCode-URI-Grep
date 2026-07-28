import * as assert from 'assert';
import * as vscode from 'vscode';
import { PARAM_DEFINITIONS, FIND_IN_FILES_COMMAND, OPEN_SEARCH_EDITOR_COMMAND } from '../uriParser';

const EXTENSION_ID = 'mfujita47.uri-grep';
const CONFIG_PREFIX = 'urigrep';

interface ConfigurationProperty {
	type: string;
	default?: unknown;
}

suite('Extension Test Suite', () => {

	test('Extension can be activated', async () => {
		const extension = vscode.extensions.getExtension(EXTENSION_ID);
		assert.ok(extension, `Extension ${EXTENSION_ID} was not found`);

		await extension.activate();
		assert.strictEqual(extension.isActive, true);
	});

	test('Commands used by the URI handler exist in this VS Code build', async () => {
		// コマンド ID が VS Code 側で改名・削除されたことを検出する。
		const commands = await vscode.commands.getCommands(true);

		assert.ok(commands.includes(FIND_IN_FILES_COMMAND), `${FIND_IN_FILES_COMMAND} is missing`);
		assert.ok(commands.includes(OPEN_SEARCH_EDITOR_COMMAND), `${OPEN_SEARCH_EDITOR_COMMAND} is missing`);
	});

	test('Every parameter is contributed as a setting with a matching type', () => {
		const extension = vscode.extensions.getExtension(EXTENSION_ID);
		assert.ok(extension, `Extension ${EXTENSION_ID} was not found`);

		const properties: Record<string, ConfigurationProperty> =
			extension.packageJSON.contributes.configuration.properties;

		for (const def of PARAM_DEFINITIONS) {
			const key = `${CONFIG_PREFIX}.${def.configKey}`;
			const property = properties[key];

			assert.ok(property, `${key} is not contributed by package.json`);
			assert.strictEqual(property.type, def.type, `Type mismatch for ${key}`);

			// 既定値は fallback を持つ項目だけが持つ。
			// それ以外の項目に default があると「未設定」と区別できなくなり、
			// 指定していない項目まで検索パネルへ送ってしまう。
			assert.strictEqual(
				property.default,
				def.fallback,
				`Default value mismatch for ${key}`
			);
		}
	});
});
