# Exile Build PoE

Open-source Windows desktop overlay for Path of Exile build progression, powered by Path of Building imports.

## Overview

Exile Build PoE is a Windows desktop application with an always-on-top overlay window designed to help players follow a Path of Building setup without constantly alt-tabbing.

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
- expected artifact name: `Exile Build PoE-Setup-0.1.0.exe`

Optional:

```bash
npm run dist:win:web
```

That command generates the web installer `.exe` for Windows. Use it only if the release assets are publicly reachable.

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

## GitHub release installer

The repository includes a Windows workflow that generates an offline Windows installer, uploads it as a GitHub Actions artifact, and publishes a stable installer asset to GitHub Releases.

Windows download:

- [Download Exile Build PoE for Windows](https://github.com/Elyelx/Overlay-PoE-Build/releases/latest/download/Exile-Build-PoE-Setup.exe)

Flow:

1. Push code to `main`
2. The `Windows Installer` workflow runs on GitHub Actions
3. It builds the Windows offline installer
4. It uploads `Exile-Build-PoE-Setup.exe` as a workflow artifact
5. It publishes a new GitHub Release for that build and marks it as latest
6. End users download `Exile-Build-PoE-Setup.exe` from the latest release and run it on Windows

Important:

- GitHub rejects files larger than 100 MB in the repository, so installer binaries must not be committed into git
- `release/` is still build output and should not be committed manually
- the stable public download is the release asset `Exile-Build-PoE-Setup.exe`
- the workflow artifact is useful for short-term validation; the GitHub Release is the better end-user download
- the default installer is offline, so it does not depend on extra GitHub downloads during installation
- if you explicitly need a small web installer for a public release flow, use `npm run dist:win:web`

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

## Legal & Attribution

This is a community-made tool and is not affiliated with or endorsed by Grinding Gear Games.

Path of Exile is a trademark of Grinding Gear Games.

Game images and item icons are © Grinding Gear Games and used in compliance with the [Path of Exile Fan Creation Policy](https://www.pathofexile.com/legal/fan-content-policy). Icon data sourced from the official Path of Exile CDN (`web.poecdn.com`).
