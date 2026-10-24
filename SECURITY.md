# Security Policy

## Supported Versions

We actively maintain security updates for the following versions:

| Version | Supported |
| :--- | :---: |
| 1.x (latest) | ✅ |

> If you are using an unsupported version, please upgrade before reporting a vulnerability — it may have already been fixed.

## Reporting a Vulnerability

We take security seriously. Thank you for helping us keep our project and users safe.

**Please do NOT report security vulnerabilities via public 【entity-GitHub¦canonical_name=GitHub】 issues, discussions, or social media.**

### How to Report

1. **Email:** newssungoldentoday@gmail.com
2. **Subject:** `[SECURITY] Brief description`
3. **Include:**
   - Description of the vulnerability
   - Steps to reproduce (PoC if possible)
   - Impact assessment
   - Affected versions / components
   - Your contact info / preferred handle for credit

Alternatively, you can report privately via **GitHub Security Advisories**: Go to `Security > Report a vulnerability` in this repository.

### What to Expect

- **Acknowledgement:** Within 24-48 hours
- **Initial Assessment:** Within 5 business days
- **Status Updates:** Every 7 days until resolved
- **Fix & Disclosure Timeline:** We aim to release a fix within 90 days. We follow coordinated disclosure.

We will credit you in our security acknowledgments unless you prefer to remain anonymous.

## Disclosure Policy

- We use **Coordinated Vulnerability Disclosure (CVD)**.
- Once a fix is ready, we will publish a GitHub Security Advisory and release notes.
- Please give us reasonable time to fix before any public disclosure.
- We request a minimum 90-day embargo from initial report to public disclosure.

## Scope

### In Scope
- Code in this repository (`master` branch)
- Official releases and container images published by this organization
- Default configuration vulnerabilities

### Out of Scope
- Social engineering, physical attacks
- DoS that requires massive resources
- Vulnerabilities in third-party dependencies without a demonstrable exploit path in our code (please report upstream)
- Clickjacking on pages with no sensitive action

## Security Best Practices for Users

- Always use the latest stable release
- Enable 2FA where available
- Do not expose secrets in environment files or public repos
- Follow our hardening guide in `/docs/security-hardening.md`

## Security Updates

Security fixes are announced via:
- GitHub Security Advisories
- Release notes (`CHANGELOG.md`)
- Email: newssungoldentoday@gmail.com (subscribe)

## Safe Harbor

We support safe harbor for good-faith security research. We will not pursue legal action against researchers who follow this policy and act in good faith, without harming users, destroying data, or degrading services.

## Contact

- Security Team: newssungoldentoday@gmail.com

---

Thank you for helping make this project more secure.
