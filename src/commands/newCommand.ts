import { Command } from 'commander';
import { BaseCommand } from './base';

export class NewCommand extends BaseCommand {
  execute(): void {
    console.log('To create a new agent, you need to create a prompt file in VS Code.');
    console.log('');
    console.log('📍 Prompt file locations:');
    console.log('  • Global: $HOME/AppData/Roaming/Code/User/prompts/');
    console.log('  • Project: .github/prompts/ (in your project root)');
    console.log('');
    console.log('📝 File naming convention:');
    console.log('  • Use pattern: <agent-name>.prompt.md');
    console.log('  • Example: myAgent.prompt.md creates agent "myAgent"');
    console.log('');
    console.log('🔗 For detailed instructions on creating prompt files, visit:');
    console.log('   https://code.visualstudio.com/docs/copilot/customization/prompt-files');
    console.log('');
    console.log('💡 Tips:');
    console.log('  • Project-level prompts override global ones with same name');
    console.log('  • Use "copilot agent list" to see all available agents');
    console.log('  • Agent names are case-insensitive when running');
  }

  createCommand(): Command {
    return new Command('new')
      .description('Guide to create a new agent prompt file')
      .action(() => this.execute());
  }
}