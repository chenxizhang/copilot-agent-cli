# AGENTS.md

This file provides context guidance to GitHub Copilot when working with code in this repository.

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

## New Features (v1.3.0)

### Enhanced Agent List Command
- **Rich Metadata Display**: Beautiful ASCII table showing agent name, description, scope, mode, model, and tools
- **YAML Front Matter Support**: Parse metadata from prompt files for enhanced organization
- **Multiple Output Formats**: Table (default), JSON, and CSV formats
- **Filtering Options**: Filter by scope (global/project) and model
- **Backward Compatibility**: `--simple` flag maintains legacy list format

### Agent Delete Command
- **Safe Deletion**: Delete agent prompt files with confirmation
- **File Location**: Automatically locates agent files in global or project scope
- **Confirmation Prompt**: Shows agent information and asks for confirmation before deletion
- **Skip Confirmation**: Use `-y` or `--yes` flag to skip confirmation prompt
- **Error Handling**: Clear error messages for missing agents or file system issues

### Update Management
- **Automatic Update Checking**: Smart session-based update notifications on first command execution
- **Manual Update Command**: `copilot update` with version comparison and user confirmation
- **Multi-Package Manager Support**: Automatic detection and use of npm, yarn, or pnpm
- **Comprehensive Error Handling**: Clear error messages and fallback instructions

### Feedback System
- **Simple Feedback Command**: `copilot feedback` opens GitHub issues page in browser
- **Cross-Platform Browser Support**: Improved Windows compatibility with proper `cmd.exe` usage
- **Graceful Degradation**: Fallback to manual URL when browser opening fails

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
- **List Command** (`listCommand.ts`): Enhanced agent listing with metadata table display
- **Run Command** (`runCommand.ts`): Handles agent execution
- **New Command** (`newCommand.ts`): Provides guidance for creating new agents
- **Update Command** (`updateCommand.ts`): Version checking and package updates
- **Feedback Command** (`feedbackCommand.ts`): Simple feedback submission via GitHub issues
- **Command Factory** (`agentCommandFactory.ts`): Creates and wires up all agent commands

#### Services Module (`src/services/`)
- **Prompt Discovery** (`promptDiscovery.ts`): File system scanning and agent resolution
- **VS Code Integration** (`vscodeIntegration.ts`): Executes `code chat -a` commands
- **Metadata Parser** (`metadataParser.ts`): YAML front matter parsing and agent metadata extraction
- **Table Formatter** (`tableFormatter.ts`): ASCII table generation for enhanced list display
- **Update Checker** (`updateChecker.ts`): NPM registry version checking and update notifications
- **Session Tracking** (`sessionTracking.ts`): Per-session state management for update checks

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
# Agent Management
copilot agent list [options]                # Enhanced agent listing with metadata
copilot agent ls [options]                  # Alias for list command
copilot agent run <agent-name> [context]    # Run agent with optional context
copilot agent new                            # Guide to create new agent prompt files
copilot agent delete <agent-name> [options] # Delete agent prompt files

# Update Management
copilot update [options]                     # Check for and install updates

# Feedback
copilot feedback                             # Submit feedback via GitHub issues
```

#### Enhanced List Command Options
```
copilot agent list --full                   # Show full descriptions
copilot agent list --scope global           # Filter by scope
copilot agent list --model gpt-4            # Filter by model
copilot agent list --format json            # Output as JSON
copilot agent list --simple                 # Legacy simple format
```

#### Delete Command Options
```
copilot agent delete <agent-name>           # Delete with confirmation prompt
copilot agent delete <agent-name> -y        # Delete without confirmation
copilot agent delete <agent-name> --yes     # Delete without confirmation
```

#### Update Command Options
```
copilot update --check-only                 # Only check for updates
copilot update --yes                        # Update without confirmation
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

- **Built-in Helloworld Agent**: Special `helloworld` agent that auto-creates on first run
  - Creates `helloworld.prompt.md` in global prompts directory if not exists
  - Contains YAML front matter: `mode: agent`, `model: GPT-5`, `tools: ['fetch']`
  - Provides greeting and CLI tool overview referencing https://www.npmjs.com/package/copilot-agent-cli
  - Appears in agent list after creation as normal global agent
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