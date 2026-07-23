const TOC_START = '<!-- toc -->';
const TOC_END = '<!-- /toc -->';

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

export function buildToc(headings: Heading[], sortOrder: SortOrder = 'original'): string {
	if (headings.length === 0) {
		return `${TOC_START}\n${TOC_END}`;
	}

	const sorted = sortOrder === 'alphabetical'
		? [...headings].sort((a, b) => a.text.localeCompare(b.text))
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
