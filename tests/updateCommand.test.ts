import { UpdateCommand } from '../src/commands/updateCommand';
import { ServiceContainer, SERVICE_TOKENS } from '../src/core/container';
import { IUpdateCheckerService } from '../src/core/interfaces';

describe('UpdateCommand', () => {
  let command: UpdateCommand;
  let container: ServiceContainer;
  let mockUpdateChecker: jest.Mocked<IUpdateCheckerService>;

  beforeEach(() => {
    container = new ServiceContainer();
    
    // Create mock update checker service
    mockUpdateChecker = {
      checkForUpdates: jest.fn(),
      displayUpdateNotification: jest.fn()
    };
    
    container.register(SERVICE_TOKENS.UPDATE_CHECKER, mockUpdateChecker);
    command = new UpdateCommand(container);
  });

  test('should create command with correct configuration', () => {
    const cmd = command.createCommand();
    
    expect(cmd.name()).toBe('update');
    expect(cmd.description()).toBe('Check for and install updates from npmjs.org');
  });

  test('should be an instance of UpdateCommand', () => {
    expect(command).toBeInstanceOf(UpdateCommand);
  });

  test('should have correct command options', () => {
    const cmd = command.createCommand();
    const options = cmd.options;
    
    expect(options).toHaveLength(2);
    expect(options[0].short).toBe('-y');
    expect(options[0].long).toBe('--yes');
    expect(options[1].long).toBe('--check-only');
  });

  test('should handle check-only option', async () => {
    mockUpdateChecker.checkForUpdates.mockResolvedValue({
      hasUpdate: false,
      currentVersion: '1.0.0',
      latestVersion: '1.0.0'
    });

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    await command.execute({ checkOnly: true });
    
    expect(mockUpdateChecker.checkForUpdates).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith('🔍 Checking for updates...');
    expect(consoleSpy).toHaveBeenCalledWith("✅ You're already running the latest version (v1.0.0)");
    
    consoleSpy.mockRestore();
  });

  test('should handle network error gracefully', async () => {
    mockUpdateChecker.checkForUpdates.mockResolvedValue(null);

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    await command.execute({ checkOnly: true });
    
    expect(consoleSpy).toHaveBeenCalledWith('❌ Unable to check for updates. Please check your internet connection.');
    
    consoleSpy.mockRestore();
  });
});