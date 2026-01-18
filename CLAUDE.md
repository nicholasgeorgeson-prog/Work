# CLAUDE.md - AI Assistant Guide for Work Repository

This document provides essential context for AI assistants working with this codebase.

## Project Overview

**Work** is a tools repository. This project is in its initial development phase.

### Repository Status

- **Current State**: Initial setup - minimal scaffolding in place
- **Primary Branch**: `main` (or default branch)
- **Purpose**: Tools development

## Project Structure

```
Work/
├── README.md          # Project overview and documentation
├── CLAUDE.md          # This file - AI assistant guidelines
└── .git/              # Git version control
```

As the project grows, expect the following structure to emerge:

```
Work/
├── src/               # Source code
├── tests/             # Test files
├── docs/              # Documentation
├── scripts/           # Build and utility scripts
├── config/            # Configuration files
└── ...
```

## Development Guidelines

### Code Style Conventions

When adding code to this repository, follow these conventions:

1. **Consistency**: Match the style of existing code in the file/module
2. **Clarity**: Write self-documenting code with clear variable and function names
3. **Simplicity**: Prefer simple, readable solutions over clever ones
4. **Documentation**: Add comments only where the logic isn't self-evident

### Git Workflow

1. **Commit Messages**: Use clear, descriptive commit messages
   - Start with a verb (Add, Fix, Update, Remove, Refactor)
   - Keep the subject line under 72 characters
   - Example: `Add user authentication module`

2. **Branches**: Use descriptive branch names
   - Feature branches: `feature/description`
   - Bug fixes: `fix/description`
   - Documentation: `docs/description`

3. **Pull Requests**: Include context about what changed and why

### Testing

When tests are implemented:

1. Write tests for new functionality
2. Ensure existing tests pass before committing
3. Follow the established test patterns in the codebase

## Working with This Repository

### For AI Assistants

When working on this codebase:

1. **Read Before Modifying**: Always read a file before proposing changes
2. **Understand Context**: Explore related files to understand the broader context
3. **Minimal Changes**: Make only the changes necessary to accomplish the task
4. **Avoid Over-Engineering**: Don't add features, abstractions, or "improvements" beyond what's requested
5. **Preserve Style**: Match existing code style and patterns
6. **Security First**: Never introduce security vulnerabilities (OWASP Top 10)

### Common Tasks

| Task | Command |
|------|---------|
| Check git status | `git status` |
| View recent commits | `git log --oneline -10` |
| Create a new branch | `git checkout -b branch-name` |

*Note: Build, test, and lint commands will be added as the project develops.*

## Architecture Notes

*This section will be populated as the project architecture is established.*

### Key Patterns

- Document architectural decisions here as they are made
- Note any design patterns in use
- Explain module organization and dependencies

### Dependencies

- List key dependencies and their purposes as they are added

## Configuration

### Environment Setup

*Environment setup instructions will be added as requirements are established.*

### Configuration Files

| File | Purpose |
|------|---------|
| `README.md` | Project overview |
| `CLAUDE.md` | AI assistant guidelines |

*Additional configuration files will be documented as they are added.*

## Important Notes

### What NOT to Do

1. **Don't create unnecessary files**: Only create files that are essential for the task
2. **Don't add documentation unless asked**: Avoid creating README, .md files, or comments unless explicitly requested
3. **Don't over-abstract**: Three similar lines of code are better than a premature abstraction
4. **Don't add unused code**: Remove dead code rather than commenting it out
5. **Don't guess**: If unclear about requirements, ask for clarification

### Security Considerations

- Never commit secrets, API keys, or credentials
- Validate user input at system boundaries
- Be cautious with file operations and command execution
- Review changes for common vulnerabilities before committing

## Maintenance

This CLAUDE.md should be updated when:

- New tools or frameworks are added
- Build processes change
- Testing conventions are established
- Architectural patterns are introduced
- Development workflows are modified

---

*Last updated: 2026-01-18*
*Repository version: Initial setup*
