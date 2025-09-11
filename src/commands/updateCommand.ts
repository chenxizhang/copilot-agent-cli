import { Command } from 'commander';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as readline from 'readline';
import { BaseCommand } from './base';
import { IServiceContainer, IUpdateCheckerService } from '../core/interfaces';
import { SERVICE_TOKENS } from '../core';

const execAsync = promisify(exec);

export class UpdateCommand extends BaseCommand {
  private updateChecker: IUpdateCheckerService;

  constructor(container: IServiceContainer) {
    super(container);
    this.updateChecker = container.get<IUpdateCheckerService>(SERVICE_TOKENS.UPDATE_CHECKER);
  }

  createCommand(): Command {
    const updateCommand = new Command('update');
    updateCommand
      .description('Check for and install updates from npmjs.org')
      .option('-y, --yes', 'Skip confirmation prompt and update automatically')
      .option('--check-only', 'Only check for updates without installing')
      .action(async (options) => {
        await this.execute(options);
      });

    return updateCommand;
  }

  async execute(options: { yes?: boolean; checkOnly?: boolean } = {}): Promise<void> {
    try {
      console.log('🔍 Checking for updates...');
      
      const updateInfo = await this.updateChecker.checkForUpdates();
      
      if (!updateInfo) {
        console.log('❌ Unable to check for updates. Please check your internet connection.');
        return;
      }

      if (!updateInfo.hasUpdate) {
        console.log(`✅ You're already running the latest version (v${updateInfo.currentVersion})`);
        return;
      }

      // Display version comparison
      console.log(`📦 Update available!`);
      console.log(`   Current version: v${updateInfo.currentVersion}`);
      console.log(`   Latest version:  v${updateInfo.latestVersion}`);
      
      if (options.checkOnly) {
        console.log('\n💡 Run "copilot update" to install the latest version');
        return;
      }

      // Prompt user for confirmation unless --yes flag is used
      if (!options.yes) {
        const shouldUpdate = await this.promptForConfirmation();
        if (!shouldUpdate) {
          console.log('Update cancelled.');
          return;
        }
      }

      await this.performUpdate(updateInfo.latestVersion);
      
    } catch (error) {
      this.handleError(error);
    }
  }

  private async promptForConfirmation(): Promise<boolean> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      rl.question('\n❓ Would you like to update now? (y/N): ', (answer) => {
        rl.close();
        resolve(answer.toLowerCase().trim() === 'y' || answer.toLowerCase().trim() === 'yes');
      });
    });
  }

  private async performUpdate(latestVersion: string): Promise<void> {
    console.log('\n🔄 Installing update...');
    
    // Try different package managers in order of preference
    const packageManagers = [
      { name: 'npm', command: 'npm install -g copilot-agent-cli@latest' },
      { name: 'yarn', command: 'yarn global add copilot-agent-cli@latest' },
      { name: 'pnpm', command: 'pnpm add -g copilot-agent-cli@latest' }
    ];

    for (const pm of packageManagers) {
      try {
        // Check if package manager is available
        await execAsync(`${pm.name} --version`);
        
        console.log(`📦 Using ${pm.name} to install update...`);
        const { stdout, stderr } = await execAsync(pm.command);
        
        if (stderr && !stderr.includes('WARN') && !stderr.includes('deprecated')) {
          throw new Error(stderr);
        }
        
        console.log('✅ Update completed successfully!');
        console.log(`📦 You are now running version v${latestVersion}`);
        
        if (stdout.trim()) {
          console.log('\nInstallation details:');
          console.log(stdout);
        }
        
        return;
        
      } catch (error) {
        // Try next package manager
        continue;
      }
    }
    
    // If all package managers failed
    throw new Error('No suitable package manager found. Please install manually.');
  }

  private handleError(error: any): void {
    console.error('\n❌ Update failed.');
    
    if (error.message.includes('permission')) {
      console.error('🔒 Permission denied. Try running with administrator/sudo privileges:');
      console.error('   sudo npm install -g copilot-agent-cli@latest');
    } else if (error.message.includes('network') || error.message.includes('ENOTFOUND')) {
      console.error('🌐 Network error. Please check your internet connection and try again.');
    } else if (error.message.includes('No suitable package manager')) {
      console.error('📦 Please install the update manually using one of these commands:');
      console.error('   npm install -g copilot-agent-cli@latest');
      console.error('   yarn global add copilot-agent-cli@latest');
      console.error('   pnpm add -g copilot-agent-cli@latest');
    } else {
      console.error(`💥 ${error.message}`);
      console.error('\n🔧 You can try installing manually:');
      console.error('   npm install -g copilot-agent-cli@latest');
    }
    
    process.exit(1);
  }
}