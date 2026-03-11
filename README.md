# BuildPilot PoE

Open-source Windows desktop overlay for Path of Exile build progression, powered by Path of Building imports.

## Overview

BuildPilot PoE is a Windows desktop application with an always-on-top overlay window designed to help players follow a Path of Building setup without constantly alt-tabbing.

Instead of focusing on price checks, the app focuses on build execution:

- passive tree progression
- gem setup by stage
- leveling roadmap
- lab progression
- gear transition notes
- build checklists

The goal is simple:

**Play your build without getting stuck in PoB.**

## Current scaffold

- Electron + React + TypeScript desktop structure
- main desktop window plus transparent overlay window
- always-on-top overlay shell
- global hotkeys wired through the desktop runtime
- local-only persistence for MVP
- local PoB import flow from link, code, or file

## Features planned for MVP

- Import build data from Path of Building only
- Transform build data into playable progression stages
- Show next passive milestones
- Show gem and link setup by phase
- Show lab order and ascendancy notes
- Show gear priorities and transition notes
- In-game overlay with compact and expanded modes
- Manual checklist and progress tracking

## Why this project exists

Path of Building is amazing for planning, but not ideal for step-by-step execution during gameplay.

This project aims to bridge that gap with a lightweight desktop overlay experience inspired by the usability of PoE tools for Windows.

## Status

This project is currently in active early development.

The first public goal is a usable MVP for Windows with:

- PoB import
- local progress tracking
- passive roadmap
- gem roadmap
- basic overlay

## Tech stack

Current stack:

- Electron
- React
- TypeScript
- local storage for MVP state

## Roadmap

### MVP
- [ ] Desktop shell
- [ ] Build import flow
- [ ] Progression engine
- [ ] Overlay UI
- [ ] Local state persistence
- [ ] Hotkey support
- [ ] Real Path of Building parser

## Local development

```bash
npm install
npm run dev
```

Desktop-specific scripts:

```bash
npm run build
npm run typecheck
npm run pack:win
npm run dist:win
```

## Windows installer

To generate the official Windows installer executable on a Windows machine:

```bash
npm install
npm run dist:win
```

Output:

- installer `.exe` in `release/`
- expected artifact name: `BuildPilot PoE-Setup-0.1.0.exe`

Optional:

```bash
npm run dist:win:portable
```

That command generates a portable Windows executable instead of the NSIS installer.

Notes:

- the current packaging target is `x64`
- MVP packaging is local-only and does not require any backend
- if you want a custom app icon, add `build/icon.ico`
- if you try to generate the Windows installer from Linux, `wine` is required by Electron Builder

## GitHub repository installer

The repository now includes a Windows workflow that generates the installer `.exe`, uploads it as an artifact, and also commits a stable installer file back into the repository.

Flow:

1. Push code to `main`
2. The `Windows Installer` workflow runs on GitHub Actions
3. It builds the Windows installer
4. It commits `downloads/BuildPilot-PoE-Setup.exe` back into the repository
5. A user can click `Code` -> `Download ZIP`
6. After extracting the repository zip, the user runs `downloads/BuildPilot-PoE-Setup.exe`
7. The installer installs the app on Windows

Important:

- `release/` is still build output and should not be committed manually
- the committed file intended for end users is `downloads/BuildPilot-PoE-Setup.exe`
- the repository zip will only contain the installer after the workflow has completed and pushed the generated file back to `main`
- the installer installs the app; it does not need the `win-unpacked` folder for normal users

### Post-MVP
- [ ] Multiple saved builds
- [ ] Better build note support
- [ ] Improved overlay customization
- [ ] Optional cloud sync
- [ ] Creator-friendly build packs

## Contributing

Contributions are welcome.

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) before opening pull requests.

## Support

If this project helps you, consider supporting it for **$1/month**.

Your support helps cover:

- maintenance
- bug fixing
- testing
- new features
- long-term development

You can support through GitHub Sponsors if enabled for this repository.

## License

This project is licensed under the Apache License 2.0.
See the [LICENSE](./LICENSE) file for details.

## Disclaimer

This is a community-made tool and is not affiliated with or endorsed by Grinding Gear Games.

Path of Exile is a trademark of Grinding Gear Games.
