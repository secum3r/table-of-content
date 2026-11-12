import { App, Notice, TFile, TFolder } from 'obsidian';
import { applyEdit, computeBlockEdit, NOTE_TOC_MARKERS, VAULT_INDEX_MARKERS, wrapBlock } from './toc';

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
	return wrapBlock(renderVaultNodes(scanVaultFolders(root, maxDepth, 1), 0), VAULT_INDEX_MARKERS);
}

export async function insertVaultToc(app: App, maxDepth: number): Promise<void> {
	const mainIndexPath = MAIN_INDEX_FILE;
	const tocBlock = buildVaultTocBlock(app, maxDepth);

	const existing = app.vault.getAbstractFileByPath(mainIndexPath);
	if (existing instanceof TFile) {
		const content = await app.vault.read(existing);
		// Indexes written before 1.0.10 used the note TOC markers.
		const edit = computeBlockEdit(content, tocBlock, VAULT_INDEX_MARKERS, NOTE_TOC_MARKERS);
		if (edit) await app.vault.modify(existing, applyEdit(content, edit));
	} else {
		await app.vault.create(mainIndexPath, `${tocBlock}\n`);
	}

	new Notice(`Vault table of contents written to ${mainIndexPath}`);
}
