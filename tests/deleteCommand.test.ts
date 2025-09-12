import { DeleteCommand } from '../src/commands/deleteCommand';
import { IPromptDiscoveryService } from '../src/core';
import * as fs from 'fs';
import * as readline from 'readline';

// Mock dependencies
jest.mock('fs');
jest.mock('readline');

const mockFs = fs as jest.Mocked<typeof fs>;

describe('DeleteCommand', () => {
  let command: DeleteCommand;
  let mockContainer: any;
  let mockPromptService: jest.Mocked<IPromptDiscoveryService>;
  let mockRl: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock prompt service
    mockPromptService = {
      discoverAgents: jest.fn(),
      findAgent: jest.fn()
    };

    // Mock container
    mockContainer = {
      get: jest.fn().mockReturnValue(mockPromptService)
    };

    // Mock readline interface
    mockRl = {
      question: jest.fn(),
      close: jest.fn()
    };

    jest.spyOn(readline, 'createInterface').mockReturnValue(mockRl);

    command = new DeleteCommand(mockContainer);

    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit');
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should delete agent with confirmation', async () => {
    const mockAgent = {
      name: 'test-agent',
      filePath: '/path/to/test-agent.prompt.md',
      source: 'global' as const
    };

    mockPromptService.findAgent.mockReturnValue(mockAgent);
    mockFs.existsSync.mockReturnValue(true);
    mockFs.unlinkSync.mockImplementation();

    // Mock user confirmation
    mockRl.question.mockImplementation((question: string, callback: (answer: string) => void) => {
      callback('y');
    });

    await command.execute('test-agent');

    expect(mockPromptService.findAgent).toHaveBeenCalledWith('test-agent');
    expect(mockFs.existsSync).toHaveBeenCalledWith('/path/to/test-agent.prompt.md');
    expect(mockFs.unlinkSync).toHaveBeenCalledWith('/path/to/test-agent.prompt.md');
    expect(console.log).toHaveBeenCalledWith('✅ Agent \'test-agent\' has been deleted successfully.');
  });

  test('should delete agent without confirmation when -y flag is provided', async () => {
    const mockAgent = {
      name: 'test-agent',
      filePath: '/path/to/test-agent.prompt.md',
      source: 'global' as const
    };

    mockPromptService.findAgent.mockReturnValue(mockAgent);
    mockFs.existsSync.mockReturnValue(true);
    mockFs.unlinkSync.mockImplementation();

    await command.execute('test-agent', { yes: true });

    expect(mockPromptService.findAgent).toHaveBeenCalledWith('test-agent');
    expect(mockFs.existsSync).toHaveBeenCalledWith('/path/to/test-agent.prompt.md');
    expect(mockFs.unlinkSync).toHaveBeenCalledWith('/path/to/test-agent.prompt.md');
    expect(console.log).toHaveBeenCalledWith('✅ Agent \'test-agent\' has been deleted successfully.');
    expect(mockRl.question).not.toHaveBeenCalled();
  });

  test('should cancel deletion when user declines confirmation', async () => {
    const mockAgent = {
      name: 'test-agent',
      filePath: '/path/to/test-agent.prompt.md',
      source: 'global' as const
    };

    mockPromptService.findAgent.mockReturnValue(mockAgent);
    mockFs.existsSync.mockReturnValue(true);

    // Mock user declining
    mockRl.question.mockImplementation((question: string, callback: (answer: string) => void) => {
      callback('n');
    });

    await command.execute('test-agent');

    expect(mockPromptService.findAgent).toHaveBeenCalledWith('test-agent');
    expect(mockFs.existsSync).toHaveBeenCalledWith('/path/to/test-agent.prompt.md');
    expect(mockFs.unlinkSync).not.toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith('Deletion cancelled.');
  });

  test('should exit with error when agent not found', async () => {
    mockPromptService.findAgent.mockReturnValue(null);

    await expect(command.execute('nonexistent-agent')).rejects.toThrow('process.exit');

    expect(mockPromptService.findAgent).toHaveBeenCalledWith('nonexistent-agent');
    expect(console.error).toHaveBeenCalledWith('Error: Agent \'nonexistent-agent\' not found.');
    expect(console.log).toHaveBeenCalledWith('Use "copilot agent list" to see available agents.');
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  test('should exit with error when file does not exist', async () => {
    const mockAgent = {
      name: 'test-agent',
      filePath: '/path/to/test-agent.prompt.md',
      source: 'global' as const
    };

    mockPromptService.findAgent.mockReturnValue(mockAgent);
    mockFs.existsSync.mockReturnValue(false);

    await expect(command.execute('test-agent')).rejects.toThrow('process.exit');

    expect(mockPromptService.findAgent).toHaveBeenCalledWith('test-agent');
    expect(mockFs.existsSync).toHaveBeenCalledWith('/path/to/test-agent.prompt.md');
    expect(console.error).toHaveBeenCalledWith('Error: Agent file \'/path/to/test-agent.prompt.md\' does not exist.');
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  test('should handle file deletion error', async () => {
    const mockAgent = {
      name: 'test-agent',
      filePath: '/path/to/test-agent.prompt.md',
      source: 'global' as const
    };

    mockPromptService.findAgent.mockReturnValue(mockAgent);
    mockFs.existsSync.mockReturnValue(true);
    mockFs.unlinkSync.mockImplementation(() => {
      throw new Error('Permission denied');
    });

    await expect(command.execute('test-agent', { yes: true })).rejects.toThrow('process.exit');

    expect(mockPromptService.findAgent).toHaveBeenCalledWith('test-agent');
    expect(mockFs.existsSync).toHaveBeenCalledWith('/path/to/test-agent.prompt.md');
    expect(mockFs.unlinkSync).toHaveBeenCalledWith('/path/to/test-agent.prompt.md');
    expect(console.error).toHaveBeenCalledWith('Error deleting file: Permission denied');
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  test('should create correct command structure', () => {
    const cmd = command.createCommand();
    
    expect(cmd.name()).toBe('delete');
    expect(cmd.description()).toBe('Delete an agent');
    // Commander.js args structure may vary, just check basic properties
    expect(cmd.name()).toBeDefined();
    expect(cmd.description()).toBeDefined();
  });
});