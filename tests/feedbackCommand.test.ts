import { FeedbackCommand } from '../src/commands/feedbackCommand';
import { ServiceContainer } from '../src/core/container';

// Mock child_process
jest.mock('child_process', () => ({
  exec: jest.fn()
}));

describe('FeedbackCommand', () => {
  let command: FeedbackCommand;
  let container: ServiceContainer;

  beforeEach(() => {
    container = new ServiceContainer();
    command = new FeedbackCommand(container);
  });

  test('should create command with correct configuration', () => {
    const cmd = command.createCommand();
    
    expect(cmd.name()).toBe('feedback');
    expect(cmd.description()).toBe('Submit feedback, bug reports, and feature requests');
  });

  test('should be an instance of FeedbackCommand', () => {
    expect(command).toBeInstanceOf(FeedbackCommand);
  });

  test('should have no command options (simplified version)', () => {
    const cmd = command.createCommand();
    const options = cmd.options;
    
    expect(options.length).toBe(0);
  });

  test('should open GitHub new issue page', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    // Mock exec to simulate successful browser opening
    const { exec } = require('child_process');
    exec.mockImplementation((cmd: string, callback: Function) => {
      callback(null, { stdout: '', stderr: '' });
    });

    await command.execute();

    expect(consoleSpy).toHaveBeenCalledWith('🚀 Thanks for wanting to provide feedback!');
    expect(consoleSpy).toHaveBeenCalledWith('🌐 Opening GitHub new issue page in your browser...\n');
    expect(consoleSpy).toHaveBeenCalledWith('✅ Browser opened successfully!');
    expect(consoleSpy).toHaveBeenCalledWith('📋 You can now submit your feedback directly.');

    consoleSpy.mockRestore();
  });

  test('should handle browser opening failure gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    // Mock exec to simulate browser opening failure
    const { exec } = require('child_process');
    exec.mockImplementation((cmd: string, callback: Function) => {
      callback(new Error('Browser not found'));
    });

    await command.execute();

    expect(consoleSpy).toHaveBeenCalledWith('⚠️  Could not open browser automatically.');
    expect(consoleSpy).toHaveBeenCalledWith('📋 Please visit: https://github.com/chenxizhang/copilot-agent-cli/issues/new');
    
    consoleSpy.mockRestore();
  });

  test('should use correct repository URL', () => {
    // Access private property for testing
    const repoUrl = (command as any).repoUrl;
    expect(repoUrl).toBe('https://github.com/chenxizhang/copilot-agent-cli');
  });
});