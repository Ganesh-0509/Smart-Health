# Security Policy

## Reporting a vulnerability

We take the security of Smart Health seriously. If you discover a vulnerability,
please **report it privately** rather than opening a public issue:

- Email the maintainers with a description of the issue, the affected component,
  and steps to reproduce.
- Please give us a reasonable window to investigate and ship a fix before any
  public disclosure.

We aim to acknowledge reports promptly and will keep you informed of remediation
progress. Responsible disclosure is appreciated and credited.

## Secrets and credentials

- **Firebase Admin service-account keys must never be committed.** They grant
  privileged server-side access to the project. These files (for example
  `*-firebase-adminsdk-*.json`) are covered by `.gitignore` and are also excluded
  from the Docker image via `backend/.dockerignore`.
- If a service-account key (or any other secret) is ever exposed — committed,
  pushed, or shared — **rotate it immediately** from the Google Cloud / Firebase
  console and purge it from history. Assume an exposed key is compromised.
- The Gemini API key and any database credentials are read from environment
  variables / a local `.env` file and must likewise stay out of version control.

## Supported scope

This is a hackathon / demonstration project. Runtime AI features degrade
gracefully to deterministic fallbacks when no API keys are configured, so the
application can be run and reviewed safely without provisioning any secrets.
