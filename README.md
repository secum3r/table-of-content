# Table of Content

An [Obsidian](https://obsidian.md) plugin that inserts a clickable table of contents at the top of the current note, built from its headings.

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/secum3r)

## Features

- **Note TOC** — scans the active note for headings and inserts a clickable table of contents at the top.
- **Folder index** — generates `_index.md` in a folder listing all notes and subfolders as clickable links.
- **Vault index** — generates `_Main-Index.md` at the vault root listing all folders.
- Configurable depth for each feature independently.
- Re-running any command updates the existing block in place — no duplicates.
- Headings inside fenced code blocks (```` ``` ```` or `~~~`) are ignored.

---

## How to use

### 1. Note table of contents

1. Open the note you want a table of contents for.
2. Open the Command Palette (`Ctrl/Cmd + P`) and run **Table of Content: Insert at top of note**.
3. A TOC is inserted at the top of the note between `<!-- toc -->` and `<!-- /toc -->` markers. Click any entry to jump to that heading.
4. Re-run the command after editing headings to refresh it in place.

Configure the heading depth and sort order under **Settings → Table of Content**.

---

### 2. Folder index (`_index.md`)

Generates a `_index.md` file inside a folder listing all notes and subfolders as `[[WikiLinks]]`.

> **Important — Obsidian behaviour:** Opening the Command Palette shifts focus away from the file explorer, so any folder you had highlighted will be deselected. The plugin cannot detect which folder you clicked in the sidebar once the palette is open.
>
> **Workaround:** Open any note inside the folder you want to index first, then run the command. The plugin uses the parent folder of the currently open note as the target.

**Steps:**
1. Open any note that lives inside the folder you want to generate an index for.
2. Open the Command Palette (`Ctrl/Cmd + P`) and run **Table of Content: Insert folder index**.
3. `_index.md` is created (or updated) inside that folder with a nested list of all notes and subfolders.
4. Re-run the command from any note in the same folder to refresh.

Configure the subfolder scan depth under **Settings → Table of Content → Folder index**.

---

### 3. Vault index (`_Main-Index.md`)

Generates a `_Main-Index.md` at the vault root listing all top-level folders as clickable links to their `_index.md`.

1. Open the Command Palette (`Ctrl/Cmd + P`) and run **Table of Content: Insert vault index**.
2. `_Main-Index.md` is created (or updated) at the root of your vault.
3. Click any folder entry to open its `_index.md`. If `_index.md` does not exist yet for a folder, clicking the link will prompt Obsidian to create it.
4. Re-run the command at any time to refresh the listing.

Configure the folder depth (max 2) under **Settings → Table of Content → Vault index**.

---

### Configuring settings

Go to **Settings → Table of Content** to configure:

| Setting | Description |
|---|---|
| Maximum heading depth | Heading levels included in the note TOC (1–6) |
| Sort order | Document order or alphabetical (a–z) |
| Maximum subfolder depth | How deep to scan subfolders for the folder index |
| Maximum folder depth | How many folder levels to show in the vault index (1–2) |

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
