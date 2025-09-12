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

      // Special handling for helloworld - auto-create if not exists
      if (agentName.toLowerCase() === 'helloworld') {
        await this.ensureHelloworldExists();
      }

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

  private async ensureHelloworldExists(): Promise<void> {
    const fs = await import('fs');
    const path = await import('path');
    const os = await import('os');
    
    const globalPromptsPath = path.join(
      os.homedir(),
      'AppData',
      'Roaming',
      'Code',
      'User',
      'prompts'
    );
    
    const helloworldFilePath = path.join(globalPromptsPath, 'helloworld.prompt.md');
    
    // Check if file already exists
    if (fs.existsSync(helloworldFilePath)) {
      return;
    }
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(globalPromptsPath)) {
      fs.mkdirSync(globalPromptsPath, { recursive: true });
    }
    
    // Create the helloworld.prompt.md file
    const helloworldContent = `---
mode: agent
model: GPT-5
tools: ['fetch']
---

Greeting to user, and give a overview of the copilot agent cli tool, reference to https://www.npmjs.com/package/copilot-agent-cli`;
    
    fs.writeFileSync(helloworldFilePath, helloworldContent, 'utf8');
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