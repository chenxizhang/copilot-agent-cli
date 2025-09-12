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
    return `<!-- Welcome to use copilot agent cli, you are creating a new agent, send us feedback by run the \`copilot feedback\` command if you have any questions. -->
---
mode: agent
model: GPT-4
tools: []
scope: project
---

# ${agentName} Agent

Write your instructions here. Please reference https://code.visualstudio.com/docs/copilot/customization/prompt-files to get more details.

## Purpose
Describe what this agent does and when to use it.

## Usage
Provide examples of how to use this agent.
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

    // Windows environments - always use VS Code
    if (process.platform === 'win32') {
      return { type: 'windows', command: 'code', args: ['-n', '--wait'] };
    }

    // WSL environment
    if (process.env.WSL_DISTRO_NAME) {
      return { type: 'wsl', command: 'code', args: ['-n', '--wait'] };
    }

    // Git Bash on Windows
    if (process.env.SHELL?.includes('bash') && process.env.OS === 'Windows_NT') {
      return { type: 'gitbash', command: 'code', args: ['-n', '--wait'] };
    }

    // Linux/Unix environments
    if (process.platform === 'linux' || process.platform === 'darwin') {
      return { type: 'unix', command: 'code', args: ['-n', '--wait'] };
    }

    // Default fallback - use VS Code
    return { type: 'unknown', command: 'code', args: ['-n', '--wait'] };
  }

  private async openInEditor(filePath: string): Promise<void> {
    const env = this.detectEnvironment();
    
    try {
      const args = [...env.args, filePath];
      
      // Use shell: true for Windows to properly handle the code command
      const child = spawn(env.command, args, { 
        stdio: 'pipe',
        shell: true,
        detached: false
      });

      return new Promise((resolve) => {
        child.on('error', (error: Error) => {
          console.warn(`⚠️  Could not open editor: ${error.message}`);
          console.log(`📝 Please manually open: ${filePath}`);
          resolve();
        });

        child.on('exit', (code: number | null) => {
          if (code === 0 || env.type === 'vscode' || env.type === 'windows') {
            // VS Code returns immediately on Windows, so we don't wait
            resolve();
          } else if (code !== 0 && code !== null) {
            console.warn(`⚠️  Editor exited with code ${code}`);
            console.log(`📝 Please manually open: ${filePath}`);
            resolve();
          } else {
            resolve();
          }
        });

        // Add a timeout to avoid hanging
        setTimeout(() => {
          resolve();
        }, 3000);
      });
    } catch (error) {
      console.warn(`⚠️  Could not open editor: ${error}`);
      console.log(`📝 Please manually open: ${filePath}`);
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
      .argument('[agent-name]', 'Name of the agent to create')
      .option('--global', 'Create in global location instead of project')
      .action((agentName, options) => this.execute(agentName, options));
  }
}