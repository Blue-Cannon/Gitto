# Contributing Guide

Thank you for considering contributing! We love contributions from the community and want to make it as easy and transparent as possible.

This document is a guide to help you through the process of contributing.

## Table of Contents
- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Pull Request Process](#pull-request-process)
- [Coding Style](#coding-style)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Reporting Security Issues](#reporting-security-issues)

## Code of Conduct

This project adheres to a Code of Conduct. By participating, you are expected to uphold it. Please read [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) before contributing. If it doesn't exist yet, please be respectful, inclusive, and constructive.

Instances of abusive, harassing, or otherwise unacceptable behavior may be reported by contacting the project maintainers.

## How Can I Contribute?

### Reporting Bugs
- Use the GitHub Issues tab to report a bug.
- Before creating a new issue, please **search existing issues** to avoid duplicates.
- Use the bug report template if available.
- Include:
  - A clear and descriptive title
  - Steps to reproduce the behavior
  - Expected vs. actual behavior
  - Screenshots, logs, or error messages
  - Your environment (OS, version, browser, etc.)

### Suggesting Enhancements / Features
- Use the Feature Request issue template.
- Explain why this enhancement would be useful and provide examples or use cases.
- Be open to discussion and feedback.

### Your First Code Contribution
Look for issues labeled `good first issue` or `help wanted`. These are great entry points if you're new to the codebase.

## Getting Started

1. **Fork the repository** on GitHub.
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR-USERNAME/YOUR-REPO.git
   cd YOUR-REPO
   ```
3. **Add the upstream remote:**
   ```bash
   git remote add upstream https://github.com/ORIGINAL-OWNER/YOUR-REPO.git
   ```
4. **Install dependencies:**
   ```bash
   # Example for Node.js
   npm install
   
   # Example for Python
   # python -m venv venv && source venv/bin/activate
   # pip install -r requirements.txt
   ```

5. **Create a new branch:**
   ```bash
   git checkout -b feat/your-feature-name
   # or fix/bug-description
   ```

## Development Workflow

1. Make your changes on your feature branch.
2. Test your changes thoroughly. Add tests if applicable.
   ```bash
   # Run tests
   npm test
   # or
   pytest
   ```
3. Make sure linting passes:
   ```bash
   npm run lint
   ```
4. Keep your branch up-to-date with upstream:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

### Project Structure
```
.
├── src/              # Source code
├── tests/            # Tests
├── docs/             # Documentation
├── .github/          # GitHub workflows & templates
├── CONTRIBUTING.md   # This file
└── README.md
```

## Pull Request Process

1. Ensure your code follows the style guidelines.
2. Update the README.md or documentation with details of changes if needed.
3. The PR should work for all supported environments and pass all CI checks.
4. Write a clear PR description:
   - Link to the related issue: `Closes #123`
   - Describe what changed and why
   - Add screenshots/GIFs for UI changes
5. Submit the PR against the `main` branch (or `develop` if that's our default).
6. A maintainer will review your PR. Be responsive to feedback — you may be asked to make changes.
7. Once approved, your PR will be squashed and merged.

**PR Title Convention:** We use Conventional Commits. Examples: `feat: add dark mode`, `fix: handle null user`, `docs: update install steps`.

## Coding Style

- Be consistent with the existing codebase.
- Write readable, self-documenting code.
- Add comments for complex logic, not for obvious code.
- Keep functions small and focused.
- For JavaScript/TypeScript: We use ESLint + Prettier.
- For Python: We follow PEP 8 and use Black/Ruff.

Before committing, run the formatter/linter.

## Commit Message Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only
- `style`: Formatting, missing semi-colons, etc.
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `test`: Adding missing tests
- `chore`: Changes to build process or auxiliary tools

Example: `feat(auth): add JWT refresh token logic`

## Reporting Security Issues

**Do not** report security vulnerabilities through public GitHub issues.

Instead, please email maintainers directly or use a private security advisory. You will receive a response within 48 hours. If the issue is confirmed, we will release a patch as soon as possible.

## Community & Support

- If you have questions, start a GitHub Discussion or join our community chat (link in README).
- Be kind and patient. This is a volunteer-driven project.

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (see [LICENSE](./LICENSE)).

---

Thank you again for contributing! Your efforts make this project better for everyone. ❤️
