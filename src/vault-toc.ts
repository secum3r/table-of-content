import { App, Notice, TFile, TFolder } from 'obsidian';
import { applyTocBlock, TOC_END, TOC_START } from './toc';

const MAIN_INDEX_FILE = '_Main-Index.md';

type VaultFolderNode = { folder: TFolder; children: VaultFolderNode[] };

function scanVaultFolders(folder: TFolder, maxDepth: number, currentDepth: number): VaultFolderNode[] {
	const nodes: VaultFolderNode[] = [];

	for (const child of folder.children) {
		if (!(child instanceof TFolder)) continue;
		const children = currentDepth < maxDepth
			? scanVaultFolders(child, maxDepth, currentDepth + 1)
			: [];
		nodes.push({ folder: child, children });
	}

	nodes.sort((a, b) => a.folder.name.localeCompare(b.folder.name));
	return nodes;
}

function renderVaultNodes(nodes: VaultFolderNode[], indent: number): string[] {
	const lines: string[] = [];
	const prefix = '\t'.repeat(indent);

	for (const { folder, children } of nodes) {
		const linkPath = `${folder.path}/_index`;
		lines.push(`${prefix}- [[${linkPath}|${folder.name}]]`);
		lines.push(...renderVaultNodes(children, indent + 1));
	}

	return lines;
}

function buildVaultTocBlock(app: App, maxDepth: number): string {
	const root = app.vault.getRoot();
	const nodes = scanVaultFolders(root, maxDepth, 1);

	if (nodes.length === 0) {
		return `${TOC_START}\n${TOC_END}`;
	}

	const lines = renderVaultNodes(nodes, 0);
	return `${TOC_START}\n${lines.join('\n')}\n${TOC_END}`;
}

export async function insertVaultToc(app: App, maxDepth: number): Promise<void> {
	const mainIndexPath = MAIN_INDEX_FILE;
	const tocBlock = buildVaultTocBlock(app, maxDepth);

	const existing = app.vault.getAbstractFileByPath(mainIndexPath);
	if (existing instanceof TFile) {
		const content = await app.vault.read(existing);
		await app.vault.modify(existing, applyTocBlock(content, tocBlock));
	} else {
		await app.vault.create(mainIndexPath, `${tocBlock}\n`);
	}

	new Notice(`Vault table of contents written to ${mainIndexPath}`);
}
