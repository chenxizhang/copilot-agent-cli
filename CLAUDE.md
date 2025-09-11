# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Package Information

- **Package Name**: copilot-agent-cli
- **Author**: Ares Chen
- **GitHub**: https://github.com/chenxizhang/copilot-agent-cli
- **NPM**: https://www.npmjs.com/package/copilot-agent-cli

## Development Commands

- `npm run build` - Compile TypeScript to JavaScript in dist/ directory
- `npm run dev` - Watch mode compilation during development
- `npm run lint` - Run ESLint on TypeScript source files
- `npm run format` - Format code with Prettier
- `npm run test` - Run Jest unit tests
- `npm start` - Run the compiled CLI tool locally
- `npm install -g .` - Install the CLI tool globally for testing

## Testing

The project uses Jest with ts-jest for testing. Tests are located in the `tests/` directory. Run `npm test` to execute all tests. The test suite includes unit tests for the core prompt discovery functionality.

## Project Architecture

This is a TypeScript-based CLI tool that automates GitHub Copilot prompt execution. The tool discovers prompt files from two locations with project-level overriding global-level when names match:

1. **Global prompts**: `$HOME/AppData/Roaming/Code/User/prompts/*.prompt.md`
2. **Project prompts**: `.github/prompts/*.prompt.md`

### Modular Architecture

The codebase is structured for multi-agent parallel development with clear separation of concerns:

#### Core Module (`src/core/`)
- **Interfaces** (`interfaces.ts`): Defines contracts for all services and components
- **Dependency Injection** (`container.ts`): Service container for managing dependencies
- **Service Tokens** (`container.ts`): Constants for service registration

#### Commands Module (`src/commands/`)
- **Base Command** (`base.ts`): Abstract base class for all commands
- **List Command** (`listCommand.ts`): Handles agent listing functionality
- **Run Command** (`runCommand.ts`): Handles agent execution
- **New Command** (`newCommand.ts`): Provides guidance for creating new agents
- **Command Factory** (`agentCommandFactory.ts`): Creates and wires up all agent commands

#### Services Module (`src/services/`)
- **Prompt Discovery** (`promptDiscovery.ts`): File system scanning and agent resolution
- **VS Code Integration** (`vscodeIntegration.ts`): Executes `code chat -a` commands

#### Infrastructure Module (`src/infrastructure/`)
- **Service Registration** (`serviceRegistration.ts`): Bootstraps dependency injection container

#### Types Module (`src/types/`)
- **Shared Types** (`index.ts`): Common interfaces and type definitions

#### Utils Module (`src/utils/`)
- **Shared Utilities** (`index.ts`): Common utility functions (extensible)

### Key Components

- **CLI Entry Point** (`src/cli.ts`): Main command handler with dependency injection setup
- **Modular Commands**: Each command is a separate class with single responsibility
- **Service Interfaces**: All services implement contracts for easy testing and extension
- **Dependency Injection**: Loose coupling enables parallel development and testing

### Command Structure

```
copilot agent list                           # List all available agents
copilot agent run <agent-name> [context]    # Run agent with optional context
copilot agent new                            # Guide to create new agent prompt files
```

The `run` command executes: `code chat -a "<prompt-file-path>" "<context>"` with environment-specific flags.

### Multi-Agent Development Benefits

The new modular architecture enables multiple agents to work on different parts of the codebase simultaneously:

- **Module Isolation**: Each module (`core`, `commands`, `services`, `infrastructure`) can be developed independently
- **Interface-Driven Development**: Clear contracts allow agents to work on implementations without conflicts
- **Dependency Injection**: Services can be easily mocked, replaced, or extended without affecting other modules
- **Command Extensibility**: New commands can be added by creating new command classes without modifying existing code
- **Service Extensibility**: New services can be registered in the container without changing core logic

### Key Features

- **Case-insensitive agent names**: Agent names can be typed in any case (e.g., `plan`, `PLAN`, `Plan`)
- **Smart context handling**: 
  - No context: `"Follow the instructions from the file."`
  - With context: `"Follow the instructions from the file. {user-context}"`
- **Environment detection**: 
  - External terminal: Uses `-n --maximize` flags for new maximized VS Code window
  - VS Code terminal: Uses `-r` flag to reuse current window
- **Project-level overrides**: Project prompts in `.github/prompts/` override global ones with same name

### Windows Path Handling

All file path operations use Node.js path module for cross-platform compatibility. The global prompt directory uses `os.homedir()` to resolve the user's home directory properly on Windows.

### Error Handling

- Missing agent files display clear error messages with suggestions
- VS Code availability is checked before execution
- Invalid command arguments are handled by Commander.js validation
- Case-insensitive agent name matching for better user experience