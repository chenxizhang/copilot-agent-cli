import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
import { BaseCommand } from './base';
import { IPromptDiscoveryService, SERVICE_TOKENS } from '../core';

/**
 * EditCommand opens an existing agent prompt file in a suitable editor.
 * Behaviour mirrors the environment detection / fallbacks used in NewCommand
 * but only for an existing file. We intentionally re-implement minimal
 * editor detection here instead of coupling to NewCommand internals.
 */
export class EditCommand extends BaseCommand {
    async execute(agentName: string): Promise<void> {
        try {
            const promptService = this.container.get<IPromptDiscoveryService>(
                SERVICE_TOKENS.PROMPT_DISCOVERY
            );

            const agent = promptService.findAgent(agentName);
            if (!agent) {
                console.error(`Error: Agent '${agentName}' not found.`);
                console.log('Use "copilot agent list" to see available agents.');
                process.exit(1);
            }

            if (!fs.existsSync(agent.filePath)) {
                console.error(`Error: Agent file '${agent.filePath}' does not exist.`);
                process.exit(1);
            }

            console.log(`Editing agent: ${agent.name} (${agent.source})`);
            console.log(`File: ${agent.filePath}`);
            console.log('Opening in editor...');

            await this.openInEditor(agent.filePath);
        } catch (error) {
            console.error(
                'Error editing agent:',
                error instanceof Error ? error.message : error
            );
            process.exit(1);
        }
    }

    private detectEnvironment(): { command: string; args: string[]; isTerminalEditor: boolean } {
        // Reuse logic conceptually consistent with NewCommand but simplified
        const isVSCodeTerminal = !!(
            process.env.TERM_PROGRAM === 'vscode' ||
            process.env.VSCODE_INJECTION === '1' ||
            process.env.VSCODE_PID ||
            process.env.VSCODE_GIT_ASKPASS_NODE ||
            process.env.VSCODE_GIT_IPC_HANDLE
        );

        if (isVSCodeTerminal) {
            return { command: 'code', args: ['-r'], isTerminalEditor: false };
        }

        if (process.platform === 'win32') {
            // Prefer VS Code on Windows for consistency with run/new commands
            return { command: 'code', args: ['-n', '--wait'], isTerminalEditor: false };
        }

        // Default to nano for *nix like setups, fallback will switch to code if available
        return { command: 'nano', args: [], isTerminalEditor: true };
    }

    private async openInEditor(filePath: string): Promise<void> {
        const env = this.detectEnvironment();
        const primaryOk = await this.trySpawn(env.command, [...env.args, filePath], env.isTerminalEditor);
        if (!primaryOk && env.command !== 'code') {
            console.log('Trying VS Code as fallback...');
            await this.trySpawn('code', ['-n', '--wait', filePath], false);
        }
    }

    private async trySpawn(command: string, args: string[], isTerminalEditor: boolean): Promise<boolean> {
        const interactive = process.stdin.isTTY && process.stdout.isTTY;
        if (isTerminalEditor && !interactive) {
            return false;
        }
        try {
            const child = spawn(command, args, {
                stdio: isTerminalEditor ? 'inherit' : 'pipe',
                shell: true
            });
            return await new Promise<boolean>((resolve) => {
                child.on('error', () => resolve(false));
                child.on('exit', (code) => resolve(code === 0 || code === null));
                if (command === 'code') {
                    // VS Code returns immediately; assume success after short delay
                    setTimeout(() => resolve(true), 1500);
                }
            });
        } catch {
            return false;
        }
    }

    createCommand(): Command {
        return new Command('edit')
            .description('Edit an existing agent prompt file')
            .argument('<agent-name>', 'Name of the agent to edit')
            .action((agentName: string) => this.execute(agentName));
    }
}

export default EditCommand;