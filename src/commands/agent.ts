import { Command } from 'commander';
import { PromptDiscoveryService } from '../services/promptDiscovery';
import { VSCodeIntegrationService } from '../services/vscodeIntegration';

export function createAgentCommand(): Command {
  const command = new Command('agent');
  command.description('Manage and run GitHub Copilot agents');

  const promptService = new PromptDiscoveryService();
  const vscodeService = new VSCodeIntegrationService();

  command
    .command('list')
    .description('List all available agents')
    .action(() => {
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
    });

  command
    .command('run')
    .description('Run a specific agent')
    .argument('<agent-name>', 'Name of the agent to run')
    .argument('[context]', 'Optional context to pass to the agent')
    .action(async (agentName: string, context?: string) => {
      try {
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
    });

  command
    .command('new')
    .description('Guide to create a new agent prompt file')
    .action(() => {
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
    });

  return command;
}
