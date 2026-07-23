import { App, PluginSettingTab, Setting } from 'obsidian';
import TocGeneratorPlugin from './main';

export type TocSortOrder = 'original' | 'alphabetical';

export interface TocGeneratorPluginSettings {
	tocMaxDepth: number;
	tocSortOrder: TocSortOrder;
}

export const DEFAULT_SETTINGS: TocGeneratorPluginSettings = {
	tocMaxDepth: 3,
	tocSortOrder: 'original',
};

export class TocSettingTab extends PluginSettingTab {
	plugin: TocGeneratorPlugin;

	constructor(app: App, plugin: TocGeneratorPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Maximum heading depth')
			.setDesc('Only headings at or above this level are included in the table of contents (1 = h1 only, 6 = h1–h6).')
			.addSlider((slider) =>
				slider
					.setLimits(1, 6, 1)
					.setValue(this.plugin.settings.tocMaxDepth)
					.onChange(async (value) => {
						this.plugin.settings.tocMaxDepth = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName('Sort order')
			.setDesc('Controls the order of headings in the table of contents.')
			.addDropdown((dropdown) =>
				dropdown
					.addOption('original', 'Document order')
					.addOption('alphabetical', 'Alphabetical (a–z)')
					.setValue(this.plugin.settings.tocSortOrder)
					.onChange(async (value) => {
						this.plugin.settings.tocSortOrder = value as TocSortOrder;
						await this.plugin.saveSettings();
					}),
			);
	}
}
