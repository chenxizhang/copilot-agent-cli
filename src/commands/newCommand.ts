import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { spawn } from 'child_process';
import { BaseCommand } from './base';

export class NewCommand extends BaseCommand {
  constructor(container: any) {
    super(container);
  }

  private validateAgentName(name: string): boolean {
    // Allow alphanumeric, hyphens, and underscores
    return /^[a-zA-Z0-9_-]+$/.test(name) && name.length > 0;
  }

  private getGlobalPromptsPath(): string {
    return path.join(
      os.homedir(),
      'AppData',
      'Roaming',
      'Code',
      'User',
      'prompts'
    );
  }

  private getProjectPromptsPath(): string {
    return path.join(process.cwd(), '.github', 'prompts');
  }

  private checkForConflicts(agentName: string): { hasConflict: boolean; conflictPath?: string; location?: string } {
    const globalPath = path.join(this.getGlobalPromptsPath(), `${agentName}.prompt.md`);
    const projectPath = path.join(this.getProjectPromptsPath(), `${agentName}.prompt.md`);

    if (fs.existsSync(globalPath)) {
      return { hasConflict: true, conflictPath: globalPath, location: 'global' };
    }

    if (fs.existsSync(projectPath)) {
      return { hasConflict: true, conflictPath: projectPath, location: 'project' };
    }

    return { hasConflict: false };
  }

  private ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  private generateTemplate(agentName: string): string {
    return `---
mode: agent
model: GPT-5 (copilot)
tools: []
description: ${agentName} agent description (edit this)
---

# ${agentName} Agent

Write your instructions here. Please reference https://code.visualstudio.com/docs/copilot/customization/prompt-files for details.

## Purpose
Describe what this agent does and when to use it.

## Usage
Provide examples of how to use this agent.

## Notes
You can add more metadata fields later; front matter must remain at the very top of the file.
`;
  }

  private detectEnvironment(): { type: string; command: string; args: string[] } {
    // Check for VS Code terminal first
    if (process.env.TERM_PROGRAM === 'vscode' ||
      process.env.VSCODE_INJECTION === '1' ||
      process.env.VSCODE_PID ||
      process.env.VSCODE_GIT_ASKPASS_NODE ||
      process.env.VSCODE_GIT_IPC_HANDLE) {
      return { type: 'vscode', command: 'code', args: ['-r'] };
    }

    // Git Bash on Windows - use nano
    if (process.env.SHELL?.includes('bash') && process.env.OS === 'Windows_NT') {
      return { type: 'gitbash', command: 'nano', args: [] };
    }

    // WSL environment - use nano
    if (process.env.WSL_DISTRO_NAME) {
      return { type: 'wsl', command: 'nano', args: [] };
    }

    // Linux environments - use nano
    if (process.platform === 'linux') {
      return { type: 'linux', command: 'nano', args: [] };
    }

    // macOS environments - use nano (most common in Terminal)
    if (process.platform === 'darwin') {
      return { type: 'macos', command: 'nano', args: [] };
    }

    // Windows PowerShell/CMD - use VS Code
    if (process.platform === 'win32') {
      return { type: 'windows', command: 'code', args: ['-n', '--wait'] };
    }

    // Default fallback - use nano first, fallback to code
    return { type: 'unknown', command: 'nano', args: [] };
  }

  private async openInEditor(filePath: string): Promise<void> {
    const env = this.detectEnvironment();

    // Try primary editor first
    const success = await this.tryOpenEditor(env.command, [...env.args, filePath], env.type);

    // If nano failed and we're not already using VS Code, try VS Code as fallback
    if (!success && env.command !== 'code') {
      console.log('📝 Trying VS Code as fallback...');
      await this.tryOpenEditor('code', ['-n', '--wait', filePath], 'fallback');
    }
  }

  private async tryOpenEditor(command: string, args: string[], type: string): Promise<boolean> {
    try {
      // Check if we're in an interactive terminal for terminal editors
      const isInteractive = process.stdin.isTTY && process.stdout.isTTY;
      const isTerminalEditor = command === 'nano' || command === 'vi' || command === 'vim';

      // If it's a terminal editor but not interactive, skip it
      if (isTerminalEditor && !isInteractive) {
        if (type !== 'fallback') {
          console.log(`📝 Non-interactive terminal detected, skipping ${command}`);
        }
        return false;
      }

      const spawnOptions = {
        stdio: isTerminalEditor ? 'inherit' : 'pipe',
        shell: true,
        detached: false
      } as const;

      const child = spawn(command, args, spawnOptions);

      return new Promise((resolve) => {
        child.on('error', (error: Error) => {
          console.warn(`⚠️  Could not open ${command}: ${error.message}`);
          if (type !== 'fallback') {
            console.log(`📝 Please manually open: ${args[args.length - 1]}`);
          }
          resolve(false);
        });

        child.on('exit', (code: number | null) => {
          if (code === 0) {
            resolve(true);
          } else if (code !== 0 && code !== null) {
            if (type !== 'fallback') {
              console.warn(`⚠️  ${command} exited with code ${code}`);
            }
            resolve(false);
          } else {
            resolve(true);
          }
        });

        // For VS Code, add timeout since it returns immediately
        if (command === 'code') {
          setTimeout(() => {
            resolve(true);
          }, 2000);
        }
      });
    } catch (error) {
      console.warn(`⚠️  Could not open ${command}: ${error}`);
      if (type !== 'fallback') {
        console.log(`📝 Please manually open: ${args[args.length - 1]}`);
      }
      return false;
    }
  }

  async execute(agentName: string, options: { global?: boolean } = {}): Promise<void> {
    // Show guidance if no agent name provided
    if (!agentName) {
      console.log('To create a new agent, you need to provide an agent name.');
      console.log('');
      console.log('Usage: copilot agent new <agent-name> [options]');
      console.log('');
      console.log('📍 Prompt file locations:');
      console.log('  • Global: $HOME/AppData/Roaming/Code/User/prompts/');
      console.log('  • Project: .github/prompts/ (in your project root)');
      console.log('');
      console.log('Options:');
      console.log('  --global    Create in global location instead of project');
      console.log('');
      console.log('🔗 For detailed instructions on creating prompt files, visit:');
      console.log('   https://code.visualstudio.com/docs/copilot/customization/prompt-files');
      return;
    }

    // Validate agent name
    if (!this.validateAgentName(agentName)) {
      console.error('❌ Invalid agent name. Use only alphanumeric characters, hyphens, and underscores.');
      return;
    }

    // Check for conflicts
    const conflict = this.checkForConflicts(agentName);
    if (conflict.hasConflict) {
      console.error(`❌ Agent '${agentName}' already exists in ${conflict.location} location:`);
      console.error(`   ${conflict.conflictPath}`);
      console.error('');
      console.error('💡 Suggestions:');
      console.error('  • Use a different name');
      console.error('  • Remove the existing agent first');
      console.error('  • Use --force flag to overwrite (not implemented yet)');
      return;
    }

    // Determine target directory
    let targetDir: string;
    let location: string;

    if (options.global) {
      targetDir = this.getGlobalPromptsPath();
      location = 'global';
    } else {
      // Try project first, fallback to global
      const projectDir = this.getProjectPromptsPath();
      try {
        this.ensureDirectoryExists(projectDir);
        targetDir = projectDir;
        location = 'project';
      } catch (error) {
        console.warn('⚠️  Could not create project directory, using global location');
        targetDir = this.getGlobalPromptsPath();
        location = 'global';
      }
    }

    // Ensure target directory exists
    try {
      this.ensureDirectoryExists(targetDir);
    } catch (error) {
      console.error(`❌ Could not create directory: ${targetDir}`);
      console.error(`   Error: ${error}`);
      return;
    }

    // Create the file
    const fileName = `${agentName}.prompt.md`;
    const filePath = path.join(targetDir, fileName);
    const template = this.generateTemplate(agentName);

    try {
      fs.writeFileSync(filePath, template, 'utf8');

      console.log(`✅ Agent '${agentName}' created successfully!`);
      console.log(`📁 Location: ${filePath}`);
      console.log(`🏷️  Scope: ${location}`);
      console.log('📝 Opening in editor...');

      // Open in editor
      await this.openInEditor(filePath);

      console.log('');
      console.log(`💡 Use 'copilot agent run ${agentName}' to test your new agent`);

    } catch (error) {
      console.error(`❌ Could not create file: ${filePath}`);
      console.error(`   Error: ${error}`);
    }
  }

  createCommand(): Command {
    return new Command('new')
      .description('Create a new agent prompt file')
      .usage('[agent-name] [options]')
      .argument('[agent-name]', 'Name of the agent to create')
      .option('--global', 'Create in global location instead of project')
      .action((agentName, options) => this.execute(agentName, options));
  }
}