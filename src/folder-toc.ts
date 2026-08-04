import { App, Notice, TFile, TFolder } from 'obsidian';
import { applyTocBlock, TOC_END, TOC_START } from './toc';

const INDEX_FILE = '_index.md';

type FileEntry = { type: 'file'; file: TFile };
type FolderEntry = { type: 'folder'; folder: TFolder; children: Entry[] };
type Entry = FileEntry | FolderEntry;

function scanFolder(folder: TFolder, maxDepth: number, currentDepth: number): Entry[] {
	const files: FileEntry[] = [];
	const folders: FolderEntry[] = [];

	for (const child of folder.children) {
		if (child instanceof TFile) {
			if (child.extension !== 'md') continue;
			if (child.name === INDEX_FILE) continue;
			files.push({ type: 'file', file: child });
		} else if (child instanceof TFolder) {
			const children = currentDepth < maxDepth
				? scanFolder(child, maxDepth, currentDepth + 1)
				: [];
			folders.push({ type: 'folder', folder: child, children });
		}
	}

	files.sort((a, b) => a.file.basename.localeCompare(b.file.basename));
	folders.sort((a, b) => a.folder.name.localeCompare(b.folder.name));

	return [...files, ...folders];
}

function renderEntries(entries: Entry[], indent: number): string[] {
	const lines: string[] = [];
	const prefix = '\t'.repeat(indent);

	for (const entry of entries) {
		if (entry.type === 'file') {
			const path = entry.file.path.replace(/\.md$/, '');
			lines.push(`${prefix}- [[${path}|${entry.file.basename}]]`);
		} else {
			lines.push(`${prefix}- **${entry.folder.name}/**`);
			lines.push(...renderEntries(entry.children, indent + 1));
		}
	}

	return lines;
}

function buildFolderTocBlock(folder: TFolder, maxDepth: number): string {
	const entries = scanFolder(folder, maxDepth, 1);
	if (entries.length === 0) {
		return `${TOC_START}\n${TOC_END}`;
	}
	const lines = renderEntries(entries, 0);
	return `${TOC_START}\n${lines.join('\n')}\n${TOC_END}`;
}

export async function insertFolderToc(app: App, maxDepth: number): Promise<void> {
	const activeFile = app.workspace.getActiveFile();
	if (!activeFile) {
		new Notice('Open a Markdown note first.');
		return;
	}

	const folder = activeFile.parent;
	if (!folder) {
		new Notice('Could not determine the folder for the active note.');
		return;
	}

	const indexPath = `${folder.path}/${INDEX_FILE}`;
	const tocBlock = buildFolderTocBlock(folder, maxDepth);

	const existing = app.vault.getAbstractFileByPath(indexPath);
	if (existing instanceof TFile) {
		const content = await app.vault.read(existing);
		await app.vault.modify(existing, applyTocBlock(content, tocBlock));
	} else {
		await app.vault.create(indexPath, `${tocBlock}\n`);
	}

	new Notice(`Folder table of contents written to ${indexPath}`);
}
