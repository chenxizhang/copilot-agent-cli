# Copilot Agent CLI

[![npm version](https://badge.fury.io/js/copilot-agent-cli.svg)](https://badge.fury.io/js/copilot-agent-cli)
[![npm downloads](https://img.shields.io/npm/dm/copilot-agent-cli.svg)](https://www.npmjs.com/package/copilot-agent-cli)
[![npm total downloads](https://img.shields.io/npm/dt/copilot-agent-cli.svg)](https://www.npmjs.com/package/copilot-agent-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/copilot-agent-cli.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![GitHub stars](https://img.shields.io/github/stars/chenxizhang/copilot-agent-cli.svg?style=social&label=Star)](https://github.com/chenxizhang/copilot-agent-cli)

A CLI tool to automate GitHub Copilot prompts as agents, allowing you to run predefined prompts with optional context through VS Code's chat interface.

## Installation

```bash
npm install -g copilot-agent-cli
```

Or install locally for development:

```bash
npm install
npm run build
npm install -g .
```

## Usage

The tool provides a `copilot` command with an `agent` subcommand:

### List Available Agents

```bash
copilot agent list
```

This will show all available agents from both global and project-level prompt directories.

### Create a New Agent

```bash
copilot agent new
```

This command provides guidance on creating new agent prompt files, including file locations, naming conventions, and links to official documentation.

### Run an Agent

```bash
copilot agent run <agent-name> [context]
```

Agent names are case-insensitive for convenience.

Examples:
```bash
# Run agent without additional context
# Context will be: "Follow the instructions from the file."
copilot agent run submitForms

# Run agent with additional context
# Context will be: "Follow the instructions from the file. 我的一些补充信息"
copilot agent run submitForms "我的一些补充信息"

# Case-insensitive agent names work too
copilot agent run SUBMITFORMS "uppercase works"
copilot agent run submitforms "lowercase works"
```

## Prompt File Locations

The tool discovers prompt files from two locations:

1. **Global prompts**: `$HOME/AppData/Roaming/Code/User/prompts/*.prompt.md`
2. **Project prompts**: `.github/prompts/*.prompt.md`

When both global and project-level prompts have the same name, the project-level prompt takes precedence.

## Prompt File Format

Prompt files should be named with the pattern: `<agent-name>.prompt.md`

For example:
- `submitForms.prompt.md` creates an agent named `submitForms`
- `codeReview.prompt.md` creates an agent named `codeReview`

## Requirements

- Node.js 16.0.0 or higher
- VS Code installed and accessible via the `code` command
- GitHub Copilot extension installed in VS Code

## Development

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run in development mode (watch)
npm run dev

# Run linting
npm run lint

# Format code
npm run format

# Run tests
npm run test
```

## How It Works

When you run an agent, the tool:

1. Searches for the prompt file in project and global directories
2. Checks if VS Code is available
3. Detects the terminal environment:
   - **External terminal**: Uses `-n --maximize` flags to open a new maximized VS Code window
   - **VS Code terminal**: Uses `-r` flag to reuse the current VS Code window
4. Prepares the context:
   - If no context provided: `"Follow the instructions from the file."`
   - If context provided: `"Follow the instructions from the file. {your-context}"`
5. Executes `code chat -a "<prompt-file-path>" "<context>"` with appropriate flags

This leverages VS Code's built-in chat functionality and your existing GitHub Copilot setup, with smart window management based on where you run the command.