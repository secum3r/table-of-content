export interface BlockMarkers {
	start: string;
	end: string;
}

export const NOTE_TOC_MARKERS: BlockMarkers = { start: '<!-- toc -->', end: '<!-- /toc -->' };
export const FOLDER_INDEX_MARKERS: BlockMarkers = { start: '<!-- folder-index -->', end: '<!-- /folder-index -->' };
export const VAULT_INDEX_MARKERS: BlockMarkers = { start: '<!-- vault-index -->', end: '<!-- /vault-index -->' };

/** A replacement of content[from, to) with text. */
export interface TextEdit {
	from: number;
	to: number;
	text: string;
}

export function wrapBlock(lines: string[], markers: BlockMarkers): string {
	return [markers.start, ...lines, markers.end].join('\n');
}

function findBlock(content: string, markers: BlockMarkers): { from: number; to: number } | null {
	const from = content.indexOf(markers.start);
	if (from === -1) return null;
	const endStart = content.indexOf(markers.end, from + markers.start.length);
	if (endStart === -1) return null;
	return { from, to: endStart + markers.end.length };
}

/** Offset just past a leading YAML frontmatter block, or 0 if there is none. */
function frontmatterEnd(content: string): number {
	const match = /^---[ \t]*\r?\n(?:[\s\S]*?\r?\n)?---[ \t]*(?:\r?\n|$)/.exec(content);
	return match ? match[0].length : 0;
}

/**
 * Edit that puts block into content: replaces the existing block (or one written
 * with legacyMarkers), otherwise inserts below any frontmatter. Null if unchanged.
 */
export function computeBlockEdit(
	content: string,
	block: string,
	markers: BlockMarkers,
	legacyMarkers?: BlockMarkers,
): TextEdit | null {
	const existing = findBlock(content, markers) ?? (legacyMarkers ? findBlock(content, legacyMarkers) : null);
	if (existing) {
		if (content.slice(existing.from, existing.to) === block) return null;
		return { ...existing, text: block };
	}

	const at = frontmatterEnd(content);
	const before = at > 0 && !content.slice(0, at).endsWith('\n') ? '\n' : '';
	const rest = content.slice(at);
	const after = rest.length === 0 ? '\n' : /^\r?\n/.test(rest) ? '\n' : '\n\n';
	return { from: at, to: at, text: `${before}${block}${after}` };
}

export function applyEdit(content: string, edit: TextEdit | null): string {
	if (!edit) return content;
	return content.slice(0, edit.from) + edit.text + content.slice(edit.to);
}

interface Heading {
	level: number;
	/** Text used after the # in the link; kept as close to the source heading as link syntax allows. */
	target: string;
	/** Display text with Markdown formatting removed. */
	text: string;
}

function cleanHeadingText(text: string): string {
	return text
		.replace(/\[\[([^\]|]+)(\|[^\]]+)?\]\]/g, '$1')
		.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
		.replace(/\*\*|__|~~|`/g, '')
		// Single * or _ only counts as emphasis at a word edge, so snake_case and 2 * 3 survive.
		.replace(/(^|\s)[*_](?=\S)/g, '$1')
		.replace(/(\S)[*_](?=\s|$)/g, '$1')
		.trim();
}

/** Removes only the sequences that would break a [[#target|alias]] link. */
function headingLinkTarget(rawText: string): string {
	return rawText
		.replace(/\[\[|\]\]|%%|[#|^]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

export function extractHeadings(content: string, maxDepth: number): Heading[] {
	const headings: Heading[] = [];
	let inCodeBlock = false;

	for (const line of content.slice(frontmatterEnd(content)).split('\n')) {
		if (/^\s*(```|~~~)/.test(line)) {
			inCodeBlock = !inCodeBlock;
			continue;
		}
		if (inCodeBlock) continue;

		const match = /^(#{1,6})[ \t]+(.+?)(?:[ \t]+#+)?[ \t]*$/.exec(line);
		if (!match) continue;

		const hashes = match[1] ?? '';
		const rawText = match[2] ?? '';
		const level = hashes.length;
		if (level > maxDepth) continue;

		const target = headingLinkTarget(rawText);
		const text = cleanHeadingText(rawText);
		if (target && text) headings.push({ level, target, text });
	}

	return headings;
}

export type SortOrder = 'original' | 'alphabetical';

// --- Tree helpers for hierarchy-aware sorting ---

interface HeadingNode {
	heading: Heading;
	children: HeadingNode[];
}

/** Converts a flat heading list into a tree, preserving parent-child relationships. */
function buildHeadingTree(headings: Heading[]): HeadingNode[] {
	const roots: HeadingNode[] = [];
	const stack: HeadingNode[] = [];

	for (const heading of headings) {
		const node: HeadingNode = { heading, children: [] };
		while (stack.length > 0 && (stack[stack.length - 1]?.heading.level ?? 0) >= heading.level) {
			stack.pop();
		}
		if (stack.length === 0) {
			roots.push(node);
		} else {
			stack[stack.length - 1]?.children.push(node);
		}
		stack.push(node);
	}

	return roots;
}

/** Sorts each level of the tree alphabetically while keeping children under their parent. */
function sortHeadingTree(nodes: HeadingNode[]): HeadingNode[] {
	return [...nodes]
		.sort((a, b) => a.heading.text.localeCompare(b.heading.text))
		.map((node) => ({ ...node, children: sortHeadingTree(node.children) }));
}

/** Flattens the tree back to a heading list via depth-first traversal. */
function flattenHeadingTree(nodes: HeadingNode[]): Heading[] {
	const result: Heading[] = [];
	for (const node of nodes) {
		result.push(node.heading);
		result.push(...flattenHeadingTree(node.children));
	}
	return result;
}

export function buildToc(headings: Heading[], sortOrder: SortOrder = 'original'): string {
	if (headings.length === 0) return wrapBlock([], NOTE_TOC_MARKERS);

	// Alphabetical sort preserves hierarchy: each level is sorted independently.
	const sorted = sortOrder === 'alphabetical'
		? flattenHeadingTree(sortHeadingTree(buildHeadingTree(headings)))
		: headings;

	const minLevel = Math.min(...sorted.map((h) => h.level));
	const lines = sorted.map((h) => {
		const indent = '\t'.repeat(h.level - minLevel);
		return `${indent}- [[#${h.target}|${h.text}]]`;
	});

	return wrapBlock(lines, NOTE_TOC_MARKERS);
}

/** Edit that inserts or refreshes the note's heading TOC; null if it is already up to date. */
export function computeNoteTocEdit(content: string, maxDepth: number, sortOrder: SortOrder = 'original'): TextEdit | null {
	// Headings are read with the existing block removed so the TOC never lists itself.
	const existing = findBlock(content, NOTE_TOC_MARKERS);
	const body = existing ? content.slice(0, existing.from) + content.slice(existing.to) : content;
	const block = buildToc(extractHeadings(body, maxDepth), sortOrder);
	return computeBlockEdit(content, block, NOTE_TOC_MARKERS);
}
