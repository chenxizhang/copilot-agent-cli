import { Command } from 'commander';
import * as fs from 'fs';
import * as readline from 'readline';
import { BaseCommand } from './base';
import { IPromptDiscoveryService, SERVICE_TOKENS } from '../core';

interface DeleteOptions {
  yes?: boolean;
}

export class DeleteCommand extends BaseCommand {
  async execute(agentName: string, options: DeleteOptions = {}): Promise<void> {
    try {
      const promptService = this.container.get<IPromptDiscoveryService>(
        SERVICE_TOKENS.PROMPT_DISCOVERY
      );

      // Find the agent
      const agent = promptService.findAgent(agentName);

      if (!agent) {
        console.error(`Error: Agent '${agentName}' not found.`);
        console.log('Use "copilot agent list" to see available agents.');
        process.exit(1);
      }

      // Check if file exists
      if (!fs.existsSync(agent.filePath)) {
        console.error(`Error: Agent file '${agent.filePath}' does not exist.`);
        process.exit(1);
      }

      // Show agent information
      console.log(`Agent: ${agent.name} (${agent.source})`);
      console.log(`File: ${agent.filePath}`);
      console.log('');

      // Confirm deletion unless -y flag is provided
      if (!options.yes) {
        const confirmed = await this.confirmDeletion(agent.name);
        if (!confirmed) {
          console.log('Deletion cancelled.');
          return;
        }
      }

      // Delete the file
      try {
        fs.unlinkSync(agent.filePath);
        console.log(`✅ Agent '${agent.name}' has been deleted successfully.`);
      } catch (error) {
        console.error(`Error deleting file: ${error instanceof Error ? error.message : error}`);
        process.exit(1);
      }
    } catch (error) {
      console.error(
        'Error deleting agent:',
        error instanceof Error ? error.message : error
      );
      process.exit(1);
    }
  }

  private async confirmDeletion(agentName: string): Promise<boolean> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      rl.question(`Are you sure you want to delete agent '${agentName}'? (y/N): `, (answer) => {
        rl.close();
        const confirmed = answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes';
        resolve(confirmed);
      });
    });
  }

  createCommand(): Command {
    return new Command('delete')
      .description('Delete an agent')
      .argument('<agent-name>', 'Name of the agent to delete')
      .option('-y, --yes', 'Skip confirmation prompt')
      .action(async (agentName: string, options: DeleteOptions) => 
        this.execute(agentName, options)
      );
  }
}