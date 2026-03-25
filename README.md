# Exile Build PoE

Open-source Windows desktop overlay for Path of Exile build progression, powered by Path of Building imports.

## Quick Start

1. **Download** the latest installer from [GitHub Releases](https://github.com/ElyelxD/Exile-Build-PoE/releases/latest)
2. **Grab a build** from any of these sources:
   - [Path of Building](https://pathofbuilding.community/) — Copy → Share → Generate
   - [pobb.in](https://pobb.in) — Paste the share link directly
   - [Mobalytics](https://mobalytics.gg/poe) — Copy the PoB code from any build guide
   - [PoE Ninja](https://poe.ninja/builds) — Copy the PoB code from any character
   - [Maxroll](https://maxroll.gg/poe) — Copy the PoB code from any guide
   - [Pastebin](https://pastebin.com) — Paste the pastebin link
3. **Paste the code or link** into the import field and click Import
4. **Press `Ctrl+Shift+O`** to toggle the in-game overlay

The overlay shows your next objectives, current level, and gem/gear targets while you play. Any source that gives you a PoB code or link works.

> **Windows SmartScreen:** On first launch, Windows may show a "Windows protected your computer" warning because the installer is not code-signed. Click **"More info"** → **"Run anyway"**. This is normal for free open-source projects — the app is safe and the source code is fully available for inspection.

## What It Does

Exile Build PoE bridges the gap between planning a build in Path of Building and actually playing it. Instead of alt-tabbing to PoB every few minutes, the overlay keeps your roadmap visible while you play.

- **In-Game Overlay** — Always-on-top overlay with tabs, level tracking, progress checklist, and configurable opacity. Toggle with a hotkey.
- **Full PoB Import** — Paste a pobb.in link, pastebin URL, raw export code, or load a `.xml` file. Extracts passive tree, gems, gear, labs, masteries, jewels, and notes.
- **Passive Tree Canvas** — Interactive tree with zoom/pan, GGG sprite rendering, cluster jewel expansion, mastery selections, node tooltips, and jewel socket details.
- **Gear Display** — Item cards with mod tiers (T1/T2/T3), socket colors and links, rarity badges, influence badges, iLvl/quality/corrupted indicators.
- **Gem Board** — Skill groups with linked supports, levels, quality, gem icons, Vaal/Awakened/quality type badges.
- **Lab Progression** — Ascendancy path with lab order and choices.
- **Leveling Progress** — Stage-based checklist with hotkeys to mark objectives and adjust level.
- **Tree Spec Selector** — Switch between tree specs in Tree, Gems, and Gear tabs with automatic skill/item set matching.
- **Customizable Hotkeys** — Click-to-record keybindings for all 6 overlay actions.
- **Overlay Settings** — Hotkeys, language, and opacity configurable directly from the overlay without leaving the game.
- **Build Management** — Search, filter by league, re-import, copy source, and delete builds.
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

All hotkeys can be remapped in the settings panel (keyboard icon, top-right).

## Development

```bash
# Install dependencies
npm install

# Run in development mode (Vite + Electron)
npm run dev

# Build for production
npm run build

# Package Windows installer
npm run dist:win
```

### Tech Stack

- **Electron 41** — Desktop shell, global shortcuts, tray, auto-update
- **React 19** — UI components
- **Vite 8** — Build tool
- **TypeScript** — Strict mode throughout
- **Canvas API** — Passive tree rendering with GGG sprites

## Support the Project

If Exile Build PoE helps your mapping sessions, consider supporting development:

- [**GitHub Sponsors**](https://github.com/sponsors/ElyelxD) — 100% goes to the developer

Every contribution helps keep the project alive and motivates new features.

## Contributing

Contributions are welcome! Feel free to open issues, suggest features, or submit pull requests.

## License

[GNU General Public License v3.0](./LICENSE)

This means you can freely use, modify, and distribute this software, but any derivative work must also be open source under the same license.

## Legal & Attribution

This is a community-made tool and is not affiliated with or endorsed by Grinding Gear Games.

Path of Exile is a trademark of Grinding Gear Games.

Game images and item icons are © Grinding Gear Games and used in compliance with the [Path of Exile Fan Creation Policy](https://www.pathofexile.com/legal/fan-content-policy).
