export const TOC_START = '<!-- toc -->';
export const TOC_END = '<!-- /toc -->';

/** Replaces an existing toc block in content, or prepends one. */
export function applyTocBlock(content: string, tocBlock: string): string {
	const pattern = new RegExp(`${TOC_START}[\\s\\S]*?${TOC_END}`, 'm');
	if (pattern.test(content)) {
		return content.replace(pattern, tocBlock);
	}
	const separator = content.length > 0 ? '\n\n' : '';
	return `${tocBlock}${separator}${content}`;
}

interface Heading {
	level: number;
	text: string;
}

/** Strips markdown formatting characters from heading text so the link label is clean. */
function cleanHeadingText(text: string): string {
	return text
		.replace(/\[\[([^\]|]+)(\|[^\]]+)?\]\]/g, '$1')
		.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
		.replace(/[*_`~]/g, '')
		.trim();
}

export function extractHeadings(content: string, maxDepth: number): Heading[] {
	const headings: Heading[] = [];
	let inCodeBlock = false;

	for (const line of content.split('\n')) {
		if (/^\s*(```|~~~)/.test(line)) {
			inCodeBlock = !inCodeBlock;
			continue;
		}
		if (inCodeBlock) continue;

		const match = /^(#{1,6})\s+(.+?)\s*#*$/.exec(line);
		if (!match) continue;

		const hashes = match[1] ?? '';
		const rawText = match[2] ?? '';
		const level = hashes.length;
		if (level > maxDepth) continue;

		const text = cleanHeadingText(rawText);
		if (text) headings.push({ level, text });
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
	if (headings.length === 0) {
		return `${TOC_START}\n${TOC_END}`;
	}

	// Alphabetical sort preserves hierarchy: each level is sorted independently.
	const sorted = sortOrder === 'alphabetical'
		? flattenHeadingTree(sortHeadingTree(buildHeadingTree(headings)))
		: headings;

	const minLevel = Math.min(...sorted.map((h) => h.level));
	const lines = sorted.map((h) => {
		const indent = '\t'.repeat(h.level - minLevel);
		return `${indent}- [[#${h.text}|${h.text}]]`;
	});

	return `${TOC_START}\n${lines.join('\n')}\n${TOC_END}`;
}

/**
 * Inserts or replaces a TOC block. If a TOC block already exists in the content
 * (delimited by TOC_START/TOC_END markers), it is replaced in place; otherwise
 * the new TOC is inserted at the very top of the note.
 */
export function insertOrUpdateToc(content: string, maxDepth: number, sortOrder: SortOrder = 'original'): string {
	// Headings are extracted from content with any existing TOC block removed,
	// so the TOC never includes its own entries.
	const withoutExisting = content.replace(
		new RegExp(`${TOC_START}[\\s\\S]*?${TOC_END}\\n?`, 'm'),
		'',
	);

	const headings = extractHeadings(withoutExisting, maxDepth);
	const toc = buildToc(headings, sortOrder);

	const tocBlockPattern = new RegExp(`${TOC_START}[\\s\\S]*?${TOC_END}`, 'm');
	if (tocBlockPattern.test(content)) {
		return content.replace(tocBlockPattern, toc);
	}

	const separator = content.length > 0 ? '\n\n' : '';
	return `${toc}${separator}${content}`;
}
