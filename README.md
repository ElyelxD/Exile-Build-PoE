# BuildPilot PoE

Open-source overlay for Path of Exile build progression, powered by Path of Building imports.

## Overview

BuildPilot PoE is a Windows desktop overlay designed to help players follow a Path of Building setup without constantly alt-tabbing.

Instead of focusing on price checks, the app focuses on build execution:

- passive tree progression
- gem setup by stage
- leveling roadmap
- lab progression
- gear transition notes
- build checklists

The goal is simple:

**Play your build without getting stuck in PoB.**

## Features planned for MVP

- Import build data from Path of Building
- Transform build data into playable progression stages
- Show next passive milestones
- Show gem and link setup by phase
- Show lab order and ascendancy notes
- Show gear priorities and transition notes
- In-game overlay with compact and expanded modes
- Manual checklist and progress tracking

## Why this project exists

Path of Building is amazing for planning, but not ideal for step-by-step execution during gameplay.

This project aims to bridge that gap with a lightweight overlay experience inspired by the usability of desktop PoE tools.

## Status

This project is currently in active early development.

The first public goal is a usable MVP for Windows with:

- PoB import
- local progress tracking
- passive roadmap
- gem roadmap
- basic overlay

## Tech stack

Planned stack:

- Tauri or Electron
- React
- TypeScript

Final stack may evolve as the project grows.

## Roadmap

### MVP
- [ ] Desktop shell
- [ ] Build import flow
- [ ] Progression engine
- [ ] Overlay UI
- [ ] Local state persistence
- [ ] Hotkey support

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