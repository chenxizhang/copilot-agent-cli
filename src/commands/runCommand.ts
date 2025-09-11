import { Command } from 'commander';
import { BaseCommand } from './base';
import { IPromptDiscoveryService, IVSCodeIntegrationService, SERVICE_TOKENS } from '../core';

export class RunCommand extends BaseCommand {
  async execute(agentName: string, context?: string): Promise<void> {
    try {
      const promptService = this.container.get<IPromptDiscoveryService>(
        SERVICE_TOKENS.PROMPT_DISCOVERY
      );
      const vscodeService = this.container.get<IVSCodeIntegrationService>(
        SERVICE_TOKENS.VSCODE_INTEGRATION
      );

      const agent = promptService.findAgent(agentName);

      if (!agent) {
        console.error(`Error: Agent '${agentName}' not found.`);
        console.log('Use "copilot agent list" to see available agents.');
        process.exit(1);
      }

      const isVSCodeAvailable = await vscodeService.checkVSCodeAvailability();
      if (!isVSCodeAvailable) {
        console.error('Error: VS Code is not available.');
        console.log(
          'Please install VS Code and ensure it is accessible via the "code" command.'
        );
        process.exit(1);
      }

      const finalContext = context 
        ? `Follow the instructions from the file. ${context}`
        : 'Follow the instructions from the file.';

      const envInfo = vscodeService.getEnvironmentInfo();

      console.log(`Running agent: ${agent.name} (${agent.source})`);
      console.log(`Prompt file: ${agent.filePath}`);
      console.log(`Context: ${finalContext}`);
      console.log(`Environment: ${envInfo.description} (flags: ${envInfo.flags.join(' ')})`);
      console.log('');

      await vscodeService.runAgent(agent, finalContext);
    } catch (error) {
      console.error(
        'Error running agent:',
        error instanceof Error ? error.message : error
      );
      process.exit(1);
    }
  }

  createCommand(): Command {
    return new Command('run')
      .description('Run a specific agent')
      .argument('<agent-name>', 'Name of the agent to run')
      .argument('[context]', 'Optional context to pass to the agent')
      .action(async (agentName: string, context?: string) => 
        this.execute(agentName, context)
      );
  }
}