import { Command } from 'commander';
import { BaseCommand } from './base';
import { IPromptDiscoveryService, SERVICE_TOKENS } from '../core';

export class ListCommand extends BaseCommand {
  execute(): void {
    const promptService = this.container.get<IPromptDiscoveryService>(
      SERVICE_TOKENS.PROMPT_DISCOVERY
    );
    
    const result = promptService.discoverAgents();

    if (result.agents.length === 0) {
      console.log('No agents found.');
      console.log(`Global path: ${result.globalPath}`);
      if (result.projectPath) {
        console.log(`Project path: ${result.projectPath}`);
      }
      return;
    }

    console.log('Available agents:');
    console.log('');

    const globalAgents = result.agents.filter((a) => a.source === 'global');
    const projectAgents = result.agents.filter((a) => a.source === 'project');

    if (globalAgents.length > 0) {
      console.log('Global agents:');
      globalAgents.forEach((agent) => {
        console.log(`  ${agent.name}`);
      });
      console.log('');
    }

    if (projectAgents.length > 0) {
      console.log('Project agents:');
      projectAgents.forEach((agent) => {
        console.log(`  ${agent.name}`);
      });
      console.log('');
    }

    console.log(`Total: ${result.agents.length} agent(s)`);
  }

  createCommand(): Command {
    return new Command('list')
      .description('List all available agents')
      .action(() => this.execute());
  }
}