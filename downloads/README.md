This repository does not store the Windows installer binary in git.

Why:
- GitHub rejects repository files larger than 100 MB, and the installer exceeds that limit.

Distribution path:
- the workflow uploads `BuildPilot-PoE-Installer.exe` and the web package as GitHub Actions artifacts
- the workflow also publishes `BuildPilot-PoE-Installer.exe` and `BuildPilot-PoE-Web-Package-x64.nsis.7z` to the `windows-installer-latest` GitHub Release
- end users should download `BuildPilot-PoE-Installer.exe` from Releases and run it with internet access
