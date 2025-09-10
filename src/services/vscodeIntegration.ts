import { spawn } from 'child_process';
import { Agent } from '../types';

export class VSCodeIntegrationService {
  private isRunningInVSCode(): boolean {
    // Check if running inside VS Code terminal
    return !!(
      process.env.VSCODE_INJECTION ||
      process.env.TERM_PROGRAM === 'vscode' ||
      process.env.VSCODE_PID ||
      process.env.VSCODE_GIT_ASKPASS_NODE ||
      process.env.VSCODE_GIT_IPC_HANDLE
    );
  }

  public getEnvironmentInfo(): { isVSCode: boolean; description: string; flags: string[] } {
    const isVSCode = this.isRunningInVSCode();
    return {
      isVSCode,
      description: isVSCode ? 'VS Code terminal' : 'External terminal',
      flags: isVSCode ? ['-r'] : ['-n', '--maximize']
    };
  }

  public async runAgent(agent: Agent, context?: string): Promise<void> {
    const args = ['chat', '-a', agent.filePath];

    // Add environment-specific parameters
    if (this.isRunningInVSCode()) {
      // Running inside VS Code terminal - use -r to reuse current window
      args.splice(1, 0, '-r');
    } else {
      // Running in external terminal - use -n and --maximize for new window
      args.splice(1, 0, '-n', '--maximize');
    }

    if (context && context.trim()) {
      args.push(context.trim());
    }

    return new Promise((resolve, reject) => {
      const process = spawn('code', args, {
        stdio: 'inherit',
        shell: true,
      });

      process.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`VS Code process exited with code ${code}`));
        }
      });

      process.on('error', (error) => {
        if (error.message.includes('ENOENT')) {
          reject(
            new Error(
              'VS Code is not installed or not available in PATH. Please install VS Code and ensure it is accessible via the "code" command.'
            )
          );
        } else {
          reject(error);
        }
      });
    });
  }

  public async checkVSCodeAvailability(): Promise<boolean> {
    return new Promise((resolve) => {
      const process = spawn('code', ['--version'], {
        stdio: 'pipe',
        shell: true,
      });

      process.on('close', (code) => {
        resolve(code === 0);
      });

      process.on('error', () => {
        resolve(false);
      });
    });
  }
}
