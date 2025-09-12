# GitHub Copilot Instructions

This file provides guidance to GitHub Copilot when working with code in this repository.

## Project Overview

**copilot-agent-cli** is a TypeScript-based CLI tool that automates GitHub Copilot prompt execution through VS Code integration.

### Package Details
- **Name**: copilot-agent-cli
- **Author**: Ares Chen
- **Repository**: https://github.com/chenxizhang/copilot-agent-cli
- **NPM Package**: https://www.npmjs.com/package/copilot-agent-cli

## Development Workflow

### Build & Test Commands
```bash
npm run build     # Compile TypeScript to dist/
npm run dev       # Watch mode for development
npm run lint      # ESLint validation
npm run format    # Prettier formatting
npm run test      # Jest unit tests
npm start         # Run CLI locally
npm install -g .  # Global installation for testing
```

### Code Style Guidelines
- Follow existing TypeScript patterns and interfaces
- Use dependency injection for service management
- Maintain modular architecture for parallel development
- Follow established naming conventions
- Ensure cross-platform compatibility (Windows/Unix paths)

## Architecture Principles

### Modular Design
The codebase supports multi-agent parallel development through clear module separation:

**Core Modules:**
- `src/core/` - Interfaces and dependency injection
- `src/commands/` - CLI command implementations
- `src/services/` - Business logic services
- `src/infrastructure/` - Service registration
- `src/types/` - Shared type definitions
- `src/utils/` - Common utilities

### Key Design Patterns
- **Dependency Injection**: Services are injected via container
- **Command Pattern**: Each CLI command is a separate class
- **Interface Segregation**: Clear contracts for all services
- **Single Responsibility**: Each module has focused purpose

## CLI Tool Functionality

### Agent Management
The tool manages prompt files from two locations:
1. **Global**: `$HOME/AppData/Roaming/Code/User/prompts/*.prompt.md`
2. **Project**: `.github/prompts/*.prompt.md`

### Command Structure
```bash
# Core commands
copilot agent list [options]                # List available agents
copilot agent run <name> [context]          # Execute agent
copilot agent new                            # Create new agent
copilot agent delete <name> [options]       # Remove agent

# Utility commands
copilot update [options]                     # Update CLI tool
copilot feedback                             # Submit feedback
```

### Environment Detection
- **VS Code Terminal**: Uses `-r` flag (reuse window)
- **External Terminal**: Uses `-n --maximize` flags (new window)
- **Git Bash**: Prefers `nano` editor
- **PowerShell/CMD**: Uses VS Code editor

## Implementation Guidelines

### When Adding New Features
1. Create interfaces in `src/core/interfaces.ts`
2. Implement services in `src/services/`
3. Register services in `src/infrastructure/serviceRegistration.ts`
4. Add commands in `src/commands/`
5. Update command factory in `src/commands/agentCommandFactory.ts`

### Code Quality Standards
- Use TypeScript strict mode
- Implement proper error handling
- Add unit tests in `tests/` directory
- Follow existing patterns for consistency
- Ensure Windows path compatibility using Node.js `path` module

### Testing Strategy
- Jest with ts-jest configuration
- Unit tests for core functionality
- Mock external dependencies
- Test cross-platform behavior

## Key Features to Maintain

### Agent System
- YAML front matter parsing for metadata
- Rich table display with ASCII formatting
- Multiple output formats (table, JSON, CSV)
- Scope filtering (global/project)
- Safe deletion with confirmation

### VS Code Integration
- Executes `code chat -a` commands
- Environment-specific flag handling
- Smart context passing
- Error handling for missing VS Code

### Update Management
- Session-based update checking
- Multi-package manager support (npm/yarn/pnpm)
- Version comparison and user confirmation

## Coding Conventions

### File Organization
- Use descriptive file names matching class names
- Group related functionality in modules
- Separate interfaces from implementations
- Keep utilities generic and reusable

### Error Handling
- Provide clear, actionable error messages
- Handle missing dependencies gracefully
- Support case-insensitive operations
- Validate user input thoroughly

### Cross-Platform Support
- Use `os.homedir()` for user directory resolution
- Handle Windows/Unix path differences
- Support various terminal environments
- Test on multiple platforms