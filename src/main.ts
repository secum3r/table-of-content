import { Editor, MarkdownView, MarkdownFileInfo, Plugin } from 'obsidian';
import { DEFAULT_SETTINGS, TocGeneratorPluginSettings, TocSettingTab } from './settings';
import { insertOrUpdateToc } from './toc';

export default class TocGeneratorPlugin extends Plugin {
	settings!: TocGeneratorPluginSettings;

	async onload() {
		await this.loadSettings();

		this.addCommand({
			id: 'insert-toc',
			name: 'Insert table of contents',
			editorCallback: (editor: Editor, _ctx: MarkdownView | MarkdownFileInfo) => {
				const content = editor.getValue();
				const updated = insertOrUpdateToc(content, this.settings.tocMaxDepth);
				if (updated !== content) {
					editor.setValue(updated);
				}
			},
		});

		this.addSettingTab(new TocSettingTab(this.app, this));
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			(await this.loadData()) as Partial<TocGeneratorPluginSettings>,
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
