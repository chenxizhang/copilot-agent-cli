import { AgentCommandFactory } from '../src/commands';
import { ServiceContainer, SERVICE_TOKENS } from '../src/core';
import { PromptDiscoveryService, VSCodeIntegrationService } from '../src/services';

describe('Agent Commands', () => {
  let command: any;
  let container: ServiceContainer;

  beforeEach(() => {
    container = new ServiceContainer();
    container.register(SERVICE_TOKENS.PROMPT_DISCOVERY, new PromptDiscoveryService());
    container.register(SERVICE_TOKENS.VSCODE_INTEGRATION, new VSCodeIntegrationService());
    
    const factory = new AgentCommandFactory(container);
    command = factory.createAgentCommand();
  });

  test('should have correct command structure', () => {
    expect(command.name()).toBe('agent');
    expect(command.description()).toBe('Manage and run GitHub Copilot agents');
    
    const subcommands = command.commands.map((cmd: any) => cmd.name());
    expect(subcommands).toContain('list');
    expect(subcommands).toContain('run');
    expect(subcommands).toContain('new');
  });

  test('should have new command with correct description', () => {
    const newCommand = command.commands.find((cmd: any) => cmd.name() === 'new');
    expect(newCommand).toBeDefined();
    expect(newCommand.description()).toBe('Create a new agent prompt file');
  });
});