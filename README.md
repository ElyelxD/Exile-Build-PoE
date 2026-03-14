# Exile Build PoE

Open-source Windows desktop overlay for Path of Exile build progression, powered by Path of Building imports.

## Quick Start

1. **Download** the latest installer from [GitHub Releases](https://github.com/Elyelx/Exile-Build-PoE/releases/latest/download/Exile-Build-PoE-Setup.exe)
2. **Export your build** from [Path of Building](https://pathofbuilding.community/) — Copy → Share → Generate
3. **Paste the code or link** into the import field and click Import
4. **Press `Ctrl+Shift+O`** to toggle the in-game overlay

The overlay shows your next objectives, current level, and gem/gear targets while you play.

## What It Does

Exile Build PoE bridges the gap between planning a build in Path of Building and actually playing it. Instead of alt-tabbing to PoB every few minutes, the overlay keeps your roadmap visible while you play.

- **In-Game Overlay** — Always-on-top compact overlay with your next objectives, level tracking, and progress checklist. Toggle with a hotkey.
- **Full PoB Import** — Paste a pobb.in link, pastebin URL, raw export code, or load a `.xml` file. Extracts passive tree, gems, gear, labs, masteries, jewels, and notes.
- **Passive Tree Canvas** — Interactive tree with zoom/pan, GGG sprite rendering, cluster jewel expansion, mastery selections, and jewel socket details.
- **Gear Display** — Item cards with mod tiers (T1/T2/T3), socket colors and links, rarity badges, and crafted/corrupted indicators.
- **Gem Board** — Skill groups with linked supports, levels, quality, and gem icons.
- **Lab Progression** — Ascendancy path with lab order and choices.
- **Leveling Progress** — Stage-based checklist with hotkeys to mark objectives and adjust level.
- **Customizable Hotkeys** — Click-to-record keybindings for all 6 overlay actions.
- **Build Search** — Filter your imported builds by name, class, ascendancy, or league.
- **Copy & Share** — Copy the original PoB code or link to share with friends.
- **10 Languages** — English, Portuguese (BR), Spanish, French, German, Russian, Korean, Chinese, Japanese, Thai.
- **Auto-Update** — Checks GitHub Releases for new versions automatically.

## Supported Import Formats

| Format | Example |
|--------|---------|
| pobb.in link | `https://pobb.in/abc123` |
| Pastebin link | `https://pastebin.com/abc123` |
| Raw PoB code | Base64 export string from PoB |
| XML file | Exported `.xml` from Path of Building |

## Default Hotkeys

| Action | Default | Customizable |
|--------|---------|:---:|
| Toggle overlay | `Ctrl+Shift+O` | Yes |
| Mark next objective | `Ctrl+Shift+M` | Yes |
| Adjust level | `Ctrl+Shift+L` | Yes |
| Next tab | `Ctrl+Shift+]` | Yes |
| Previous tab | `Ctrl+Shift+[` | Yes |
| Toggle pin | `Ctrl+Shift+P` | Yes |

All hotkeys can be remapped in Settings (gear icon, top-right).

## Development

```bash
# Install dependencies
npm install

# Run in development mode (Vite + Electron)
npm run dev

# Build for production
npm run build

# Package Windows installer
npm run dist
```

### Tech Stack

- **Electron 30** — Desktop shell, global shortcuts, tray, auto-update
- **React 18** — UI components
- **Vite 5** — Build tool
- **TypeScript** — Strict mode throughout
- **Canvas API** — Passive tree rendering with GGG sprites

## Windows Installer

To generate the official Windows installer:

```bash
npm install
npm run dist:win
```

Output: `Exile-Build-PoE-Setup.exe` in `release/`.

The repository includes a GitHub Actions workflow that builds the installer on every push to `main` and publishes it as a GitHub Release.

Download: [Exile Build PoE for Windows](https://github.com/Elyelx/Exile-Build-PoE/releases/latest/download/Exile-Build-PoE-Setup.exe)

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](./CONTRIBUTING.md) before opening pull requests.

## Support

If this project helps you, consider supporting it through GitHub Sponsors.

## License

[Apache License 2.0](./LICENSE)

## Legal & Attribution

This is a community-made tool and is not affiliated with or endorsed by Grinding Gear Games.

Path of Exile is a trademark of Grinding Gear Games.

Game images and item icons are © Grinding Gear Games and used in compliance with the [Path of Exile Fan Creation Policy](https://www.pathofexile.com/legal/fan-content-policy).
