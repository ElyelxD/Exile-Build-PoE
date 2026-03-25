# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | Yes                |
| < 1.0   | No                 |

Only the latest release receives security updates. Please ensure you are running the most recent version before reporting.

## Reporting a Vulnerability

**Do not open a public issue for security vulnerabilities.**

Instead, please report vulnerabilities through [GitHub Security Advisories](https://github.com/ElyelxD/Exile-Build-PoE/security/advisories/new).

### What to include

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### Response timeline

- **48 hours** -- Initial acknowledgment of your report
- **7 days** -- Assessment and severity classification
- **30 days** -- Target for a fix in a new release (may vary based on complexity)

We will keep you informed of progress throughout the process. Once the issue is resolved, we will credit you in the release notes (unless you prefer to remain anonymous).

## Scope

This policy covers the Exile Build PoE desktop application, including:

- Electron main process and preload scripts
- IPC communication handlers
- Network requests (PoB import, auto-update)
- Local data storage

Third-party dependencies are managed via Dependabot. If you find a vulnerability in a dependency, please still report it here so we can assess the impact on our application.
