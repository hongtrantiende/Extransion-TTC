# Repository Architecture Map

A high-level map of the repository's semantic structure and components.

---

## 📂 Core Folder Structure

```
Extransion-TTC/
├── .agents/          # Customization rules and memory files
├── sources/          # Legado/Novela single book source JSON files (248 files)
├── zips/             # Packaged extension ZIP files (195 unique files)
├── icons/            # App icons for the extensions
├── plugin.json       # Catalog of extensions (index of zips)
├── sources.json      # Combined list of book sources
├── index.html        # Web page catalog containing hardcoded data
├── studio/           # Project studio tool for adb/wifi installation
└── ext-novela/       # Nested tools and other configurations
    ├── vbook-tool/   # CLI development tool for extensions
    └── plugin.json   # Catalog for raw third-party extensions
```

---

## 🔄 Interaction Context
- **Extension Packages**: Created using the `vbook-tool build` command from extension source folders. The zip files are stored in `zips/` and referenced in `plugin.json` for remote loading.
- **Novela Android App**: Reads `plugin.json` from the GitHub repository to load and download/install extensions.
