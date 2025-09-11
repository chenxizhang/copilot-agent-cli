import { Command } from 'commander';
import { exec } from 'child_process';
import { promisify } from 'util';
import { BaseCommand } from './base';
import { IServiceContainer } from '../core/interfaces';

const execAsync = promisify(exec);

export class UpdateCommand extends BaseCommand {
  constructor(container: IServiceContainer) {
    super(container);
  }

  createCommand(): Command {
    const updateCommand = new Command('update');
    updateCommand
      .description('Update copilot-agent-cli to the latest version')
      .action(async () => {
        await this.execute();
      });

    return updateCommand;
  }

  async execute(): Promise<void> {
    try {
      console.log('🔄 Updating copilot-agent-cli to the latest version...');
      
      const { stdout, stderr } = await execAsync('npm install -g copilot-agent-cli@latest');
      
      if (stderr && !stderr.includes('npm WARN')) {
        console.error('❌ Update failed:', stderr);
        process.exit(1);
      }
      
      console.log('✅ Update completed successfully!');
      if (stdout.trim()) {
        console.log(stdout);
      }
      
      // Get the new version
      try {
        const { stdout: versionOutput } = await execAsync('npm list -g copilot-agent-cli --depth=0');
        const versionMatch = versionOutput.match(/copilot-agent-cli@(\d+\.\d+\.\d+)/);
        if (versionMatch) {
          console.log(`📦 You are now running version ${versionMatch[1]}`);
        }
      } catch (error) {
        // Silent fail - version check is not critical
      }
      
    } catch (error) {
      console.error('❌ Update failed. Please try running the command manually:');
      console.error('   npm install -g copilot-agent-cli@latest');
      process.exit(1);
    }
  }
}