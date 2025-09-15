# Copilot Agent CLI

[![npm version](https://img.shields.io/npm/v/copilot-agent-cli.svg)](https://www.npmjs.com/package/copilot-agent-cli)
[![npm downloads](https://img.shields.io/npm/dm/copilot-agent-cli.svg)](https://www.npmjs.com/package/copilot-agent-cli)
[![npm total downloads](https://img.shields.io/npm/dt/copilot-agent-cli.svg)](https://www.npmjs.com/package/copilot-agent-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/copilot-agent-cli.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![GitHub stars](https://img.shields.io/github/stars/chenxizhang/copilot-agent-cli.svg?style=social&label=Star)](https://github.com/chenxizhang/copilot-agent-cli)

A comprehensive CLI tool to automate GitHub Copilot prompts as agents, featuring intelligent agent management, automatic updates, and user feedback capabilities.

## ✨ Features

- 🤖 **Agent Management**: Discover, list, and run GitHub Copilot agents with rich metadata
- 📊 **Enhanced List View**: Beautiful table display with agent descriptions, models, tools, and scope
- 🔄 **Automatic Updates**: Smart update checking and installation with multi-package manager support
- 💬 **Easy Feedback**: Simple feedback submission directly to GitHub issues
- 🎯 **Smart Context**: Intelligent context handling based on terminal environment
- 📁 **Flexible Organization**: Support for both global and project-level agents

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

## Quick Start

After installation, try the built-in helloworld agent to get started:

```bash
copilot agent run helloworld
```

This will automatically create your first agent and give you an overview of the CLI tool. The agent will appear in VS Code with a friendly greeting and introduction to help you get familiar with the system.

## Usage

### Agent Management

#### List Available Agents (Enhanced)

```bash
# Display agents in a beautiful table with metadata
copilot agent list
# or use the short alias
copilot agent ls

# Show full descriptions without truncation
copilot agent ls --full

# Filter by scope (global or project)
copilot agent ls --scope global
copilot agent ls --scope project

# Filter by model
copilot agent ls --model gpt-4

# Different output formats
copilot agent ls --format json
copilot agent ls --format csv

# Use simple list format (legacy)
copilot agent ls --simple
```

#### Create a New Agent

```bash
copilot agent new
```

This command provides guidance on creating new agent prompt files, including file locations, naming conventions, and links to official documentation.

#### Delete an Agent

```bash
copilot agent delete <agent-name>
```

Delete an agent by removing its prompt file. The command will:
- Locate the agent file (global or project scope)
- Show agent information before deletion
- Ask for confirmation before proceeding
- Remove the file from the filesystem

Examples:
```bash
# Delete with confirmation prompt
copilot agent delete old-agent

# Delete without confirmation (skip prompt)
copilot agent delete old-agent -y
copilot agent delete old-agent --yes
```

#### Run an Agent

```bash
copilot agent run <agent-name> [context]
```

Examples:
```bash
# Run agent without additional context
copilot agent run submitForms

# Run agent with additional context
copilot agent run submitForms "some additional context from me"

# Try the built-in helloworld agent (auto-creates on first run)
copilot agent run helloworld
```

#### Built-in Helloworld Agent

The CLI includes a special `helloworld` agent that automatically creates itself when first run:

```bash
copilot agent run helloworld
```

This agent:
- Auto-creates `helloworld.prompt.md` in your global prompts directory on first run
- Provides a friendly greeting and overview of the copilot agent CLI tool
- Uses GPT-5 model with fetch tool capability
- Appears in your agent list after creation

### Update Management

#### Check for Updates

```bash
# Check for available updates
copilot update --check-only

# Update with confirmation prompt
copilot update

# Update automatically without prompt
copilot update --yes
```

The tool automatically checks for updates on the first command execution per terminal session and notifies you if a newer version is available.

### Feedback

```bash
# Submit feedback, bug reports, or feature requests
copilot feedback
```

Opens the GitHub issues page in your browser for easy feedback submission.

## Prompt File Locations

The tool discovers prompt files from two locations:

1. **Global prompts**: `$HOME/AppData/Roaming/Code/User/prompts/*.prompt.md`
2. **Project prompts**: `.github/prompts/*.prompt.md`

When both global and project-level prompts have the same name, the project-level prompt takes precedence.

## Prompt File Format

Prompt files should be named with the pattern: `<agent-name>.prompt.md`

The agent name is always extracted from the filename, regardless of any metadata within the file.

### Basic Format

```markdown
# Agent Name

Your agent instructions go here...
```

### Enhanced Format with Metadata

You can include YAML front matter to provide rich metadata for better organization:

```markdown
---
description: "Performs comprehensive code reviews with security analysis"
mode: "agent"
model: "gpt-4"
tools:
  - filesystem
  - git
  - eslint
---

# Code Review Agent

This agent performs detailed code reviews...
```

### Metadata Fields

- **description**: Brief description of what the agent does
- **mode**: Agent execution mode (e.g., `agent`, `chat`, `completion`)
- **model**: AI model used (e.g., `gpt-4`, `claude-3-sonnet`)
- **tools**: List of required tools/extensions

**Note**: The agent name is always derived from the filename (e.g., `code-review.prompt.md` → `code-review`), not from the metadata.

### Examples

- `submitForms.prompt.md` → Agent name: `submitForms`
- `code-review.prompt.md` → Agent name: `code-review`
- `data-analysis.prompt.md` → Agent name: `data-analysis`

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

## Share & Install Agents

Introduced in v1.5.0: Secure local sharing via `.agents` files. No cloud upload. Suitable for internal/private usage.

### Package (Share)

Create a package from one or more agents:

```bash
copilot agent share myAgentA myAgentB
```

Package all agents:

```bash
copilot agent share --all
```

Custom package name and output directory:

```bash
copilot agent share myAgent --name custom-pack --output-dir ./dist
```

The generated file uses the `.agents` extension and is stored by default in:

```
~/copilot-agent-packages
```

### Install

Install from a received `.agents` file:

```bash
copilot agent install path/to/file.agents
```

By default installs into the global prompts directory (`$HOME/AppData/Roaming/Code/User/prompts`). Use `--target project` to install into the current project's `.github/prompts/` folder.

Specify target location:

```bash
copilot agent install file.agents --target project
copilot agent install file.agents --target global
```

Overwrite existing files:

```bash
copilot agent install file.agents --force
```

### Package File Format

`.agents` file = gzip + JSON, containing:

- version / createdAt
- agents: [{ name, content }]
- No upload / no network access

### Example Workflow

1. Developer A packages:
   ```bash
   copilot agent share data-clean report-gen --name data-tools
   ```
2. Send the resulting `data-tools.agents` file to Developer B (any secure channel: internal drive/IM/etc.).
3. Developer B installs globally (default):
   ```bash
   copilot agent install ~/Downloads/data-tools.agents
   ```
4. (Optional) Install into project instead:
    ```bash
    copilot agent install ~/Downloads/data-tools.agents --target project
    ```
5. Verify:
   ```bash
   copilot agent list
   ```

### Design Principles

- No upload: 100% local filesystem operations
- Auditable: gzip + JSON, easily inspectable
- Controlled overwrite: never overwrites unless `--force`
- Portable: single-file distribution

Want enhancements (signatures, integrity hash, selective metadata filtering)? Open an issue or PR.