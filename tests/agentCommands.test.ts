import { createAgentCommand } from '../src/commands/agent';

describe('Agent Commands', () => {
  let command: any;

  beforeEach(() => {
    command = createAgentCommand();
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
    expect(newCommand.description()).toBe('Guide to create a new agent prompt file');
  });
});