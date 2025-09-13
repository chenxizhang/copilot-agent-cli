import { Command } from 'commander';
import { exec } from 'child_process';
import { promisify } from 'util';
import { BaseCommand } from './base';
import { IServiceContainer } from '../core/interfaces';

const execAsync = promisify(exec);

export class FeedbackCommand extends BaseCommand {
  private readonly repoUrl = 'https://github.com/chenxizhang/copilot-agent-cli';

  constructor(container: IServiceContainer) {
    super(container);
  }

  createCommand(): Command {
    const feedbackCommand = new Command('feedback');
    feedbackCommand
      .description('Submit feedback, bug reports, and feature requests')
      .action(async () => {
        await this.execute();
      });

    return feedbackCommand;
  }

  async execute(): Promise<void> {
    try {
      console.log('🚀 Thanks for wanting to provide feedback!');
      console.log('🌐 Opening GitHub new issue page in your browser...\n');

      const newIssueUrl = `${this.repoUrl}/issues/new`;
      await this.openInBrowser(newIssueUrl);

    } catch (error) {
      this.handleError(error);
    }
  }

  private async openInBrowser(url: string): Promise<void> {
    try {
      let command: string;
      
      if (process.platform === 'win32') {
        // On Windows, use cmd.exe to execute start command properly
        command = `cmd.exe /c start "" "${url}"`;
      } else if (process.platform === 'darwin') {
        command = `open "${url}"`;
      } else {
        command = `xdg-open "${url}"`;
      }
      
      await execAsync(command);
      console.log('✅ Browser opened successfully!');
      console.log('📋 You can now submit your feedback directly.');
    } catch (error) {
      console.log('⚠️  Could not open browser automatically.');
      console.log(`📋 Please visit: ${url}`);
    }
  }

  private handleError(error: any): void {
    console.error('\n❌ Failed to open feedback page.');
    console.error(`💥 ${error.message}`);
    console.log('\n🔧 You can submit feedback manually at:');
    console.log(`   ${this.repoUrl}/issues/new`);
  }
}