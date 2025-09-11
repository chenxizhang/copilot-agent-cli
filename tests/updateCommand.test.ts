import { UpdateCommand } from '../src/commands/updateCommand';
import { ServiceContainer } from '../src/core/container';

describe('UpdateCommand', () => {
  let command: UpdateCommand;
  let container: ServiceContainer;

  beforeEach(() => {
    container = new ServiceContainer();
    command = new UpdateCommand(container);
  });

  test('should create command with correct configuration', () => {
    const cmd = command.createCommand();
    
    expect(cmd.name()).toBe('update');
    expect(cmd.description()).toBe('Update copilot-agent-cli to the latest version');
  });

  test('should be an instance of UpdateCommand', () => {
    expect(command).toBeInstanceOf(UpdateCommand);
  });
});