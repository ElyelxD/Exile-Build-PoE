# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.10] - 2026-03-25

### Fixed

- CodeQL: replaced insecure `/tmp` path with local cache in `convert-ggg-tree.mjs`
- CodeQL: added network data validation before writing to disk in dev scripts

## [1.0.9] - 2026-03-25

### Fixed

- Custom PoE cursor not showing in settings dropdown (portal rendering issue)

## [1.0.7] - 2026-03-25

### Fixed

- Auto-update URL typo: `appPackageUrl` pointed to wrong GitHub user (`Elyelx` → `ElyelxD`)
- Repository URL changed from SSH to HTTPS for public contributors
- Python asset miner error messages translated from Portuguese to English

### Changed

- `.gitignore` expanded: added `*.exe`, `*.msi`, `out/`, `.mcp.json`

## [1.0.6] - 2026-03-25

### Added

- PoE-style golden cursors (arrow and hand) throughout the app
- Current app version displayed in the update panel (all 10 locales)
- Popular build sources listed in README (Mobalytics, PoE Ninja, Maxroll)

### Fixed

- Gems and gear now correctly switch when changing tree specs via PoB `{N}` spec-index matching

## [1.0.5] - 2026-03-25

### Added

- Test suite with 81 tests covering tree decoder, cluster expansion, selectors
- CODE_OF_CONDUCT.md, SECURITY.md, CHANGELOG.md governance documents
- GitHub issue templates (bug report, feature request) and PR template
- Dependabot configuration for npm and GitHub Actions
- CodeQL security analysis workflow
- PR validation workflow (typecheck + tests + Windows build)

### Fixed

- Unhandled promise rejections in hotkey IPC calls

### Changed

- Improved package.json metadata (license, homepage, keywords, engines)

## [1.0.4] - 2026-03-25

### Fixed

- Overlay minibar click-through so the game remains interactive behind the minimized bar
- Missing desktop API types for updater events (onUpToDate, onUpdateError)
- Auto-updater now fires real electron-updater events instead of timeout fallback

## [1.0.3] - 2026-03-23

### Added

- Overlay minimize mode: collapse to a compact bar showing build name and active tree spec
- Dedicated "Check for Updates" button in main window header with dropdown lifecycle
- Overlay opacity moved to its own separate header button with slider dropdown
- i18n keys for minimize, expand, and update across all 10 locales

### Removed

- Settings UI (hotkeys, language, opacity) from overlay panel -- kept only in main window
- Cluster node text labels below nodes (tooltips already show names on hover)

## [1.0.2] - 2026-03-23

### Added

- Cluster jewel allocation tracking with PoB-compatible virtual node IDs
- Cluster notables database (308 passives with stat descriptions)

### Fixed

- Mastery effect selection display in passive tree tooltips
- Tree hit detection accuracy for small and notable nodes
- Dropdown z-index layering in overlay mode
- Bloodline ascendancy sprite sheet rendering

## [1.0.1] - 2026-03-23

### Fixed

- Tree hit detection for nodes near edges
- Dropdown z-index conflicts in overlay mode
- Bloodline sprite rendering for certain ascendancies

## [1.0.0] - 2026-03-14

### Added

- Initial stable release
- Path of Building import (URL, code, and file)
- In-game overlay with transparent always-on-top window
- Passive tree visualization with sprite rendering and zoom/pan
- Build progression tracking with stage-based checklist
- Gem setup display with socket color matching
- Item/gear requirements panel
- 10 language support (English, Portuguese BR, Spanish, French, German, Russian, Korean, Chinese, Japanese, Thai)
- Auto-update via GitHub Releases
- System tray with quick actions
- Customizable global hotkeys
- Overlay opacity control

[1.0.4]: https://github.com/ElyelxD/Exile-Build-PoE/compare/v1.0.3...v1.0.4
[1.0.3]: https://github.com/ElyelxD/Exile-Build-PoE/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/ElyelxD/Exile-Build-PoE/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/ElyelxD/Exile-Build-PoE/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/ElyelxD/Exile-Build-PoE/releases/tag/v1.0.0
