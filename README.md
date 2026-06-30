# Table of Content

An [Obsidian](https://obsidian.md) plugin that inserts a clickable table of contents at the top of the current note, built from its headings.

## Features

- Scans the active note for headings (`#` through `######`).
- Inserts a nested, clickable table of contents at the top of the note. Each entry is an internal link that jumps to the corresponding heading when clicked.
- Configurable maximum heading depth — limit the TOC to, say, only `H1`/`H2` headings, or include all six levels.
- Re-running the command updates the existing table of contents in place instead of inserting a duplicate.
- Headings inside fenced code blocks (```` ``` ```` or `~~~`) are ignored.

## How to use

1. Open the note you want a table of contents for.
2. Open the Command Palette (`Ctrl/Cmd + P`) and run **Insert at top of note**.
3. A table of contents is inserted at the top of the note, between `<!-- toc -->` and `<!-- /toc -->` markers. Click any entry to jump to that heading.
4. To refresh the table of contents after editing headings, just run the command again — it replaces the existing TOC block rather than adding a new one.

### Configuring the maximum depth

Go to **Settings → Table of Content** and adjust the **Maximum heading depth** slider (1–6). For example, setting it to `2` will only include `H1` and `H2` headings in the generated table of contents.

## Installation

### Manually installing the plugin

Copy `main.js`, `manifest.json`, and `styles.css` (if present) into:

```
<YourVault>/.obsidian/plugins/table-of-content/
```

Then reload Obsidian and enable **Table of Content** under **Settings → Community plugins**.

### Building from source

```bash
npm install
npm run build
```

This produces `main.js` at the project root, alongside `manifest.json`.

## Development

```bash
npm install
npm run dev    # watch mode, recompiles on save
npm run lint   # run ESLint
```

## License

This project is licensed under the [MIT License](LICENSE).
