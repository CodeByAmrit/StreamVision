# Security Policy for StreamVision

StreamVision takes security seriously, especially given that it handles live RTSP camera feeds, potentially sensitive DVR configurations, and user authentication.

## Supported Versions

Currently, we provide security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| v2.0.x  | :white_check_mark: |
| < v2.0  | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability within StreamVision, please do **NOT** open a public issue. Providing detailed information publicly can put existing deployments at risk.

Instead, please report any security issues by contacting the repository maintainers directly via email or private channel (if provided). If no direct email is specified in the repository, please use GitHub's private vulnerability reporting feature for this repository.

### What kind of vulnerabilities are critical?

- **Authentication Bypasses:** Issues bypassing the JWT-based API authentication.
- **RCE (Remote Code Execution):** Any vulnerability allowing arbitrary command execution, particularly concerning the FFmpeg subprocess spawning (`child_process.spawn`).
- **Path Traversal / Directory Escalation:** Accessing files outside the permitted `/public`, `/streams`, or `/client/dist` directories.
- **Leaking sensitive camera data:** Exposing RTSP URLs, passwords, or IP addresses to unauthorized users.

We will acknowledge your report promptly and provide an estimated timeline for the fix. Thank you for helping keep StreamVision secure!
