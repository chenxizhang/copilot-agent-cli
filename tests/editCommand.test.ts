import { EditCommand } from '../src/commands/editCommand';
import { IPromptDiscoveryService } from '../src/core';
import * as fs from 'fs';
import { spawn } from 'child_process';

jest.mock('fs');
jest.mock('child_process', () => ({
    spawn: jest.fn()
}));

const mockFs = fs as jest.Mocked<typeof fs>;
const mockSpawn = spawn as unknown as jest.MockedFunction<typeof spawn>;

describe('EditCommand', () => {
    let command: EditCommand;
    let mockContainer: any;
    let mockPromptService: jest.Mocked<IPromptDiscoveryService>;

    beforeEach(() => {
        jest.clearAllMocks();

        mockPromptService = {
            discoverAgents: jest.fn(),
            findAgent: jest.fn()
        };

        mockContainer = {
            get: jest.fn().mockReturnValue(mockPromptService)
        };

        command = new EditCommand(mockContainer);

        jest.spyOn(console, 'log').mockImplementation();
        jest.spyOn(console, 'error').mockImplementation();
        jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('process.exit'); });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    function mockSpawnSuccess() {
        const events: any = {};
        mockSpawn.mockReturnValue({
            on: (event: string, handler: any) => { events[event] = handler; if (event === 'exit') { setTimeout(() => handler(0), 10); } },
            stdout: { on: jest.fn() },
            stderr: { on: jest.fn() }
        } as any);
    }

    test('opens existing agent file', async () => {
        const agent = { name: 'demo', filePath: '/path/demo.prompt.md', source: 'global' as const };
        mockPromptService.findAgent.mockReturnValue(agent);
        mockFs.existsSync.mockReturnValue(true);
        mockSpawnSuccess();

        await command.execute('demo');

        expect(mockPromptService.findAgent).toHaveBeenCalledWith('demo');
        expect(mockFs.existsSync).toHaveBeenCalledWith('/path/demo.prompt.md');
    });

    test('exits when agent not found', async () => {
        mockPromptService.findAgent.mockReturnValue(null);
        await expect(command.execute('missing')).rejects.toThrow('process.exit');
        expect(console.error).toHaveBeenCalledWith("Error: Agent 'missing' not found.");
        expect(process.exit).toHaveBeenCalledWith(1);
    });

    test('exits when file missing', async () => {
        const agent = { name: 'demo', filePath: '/path/demo.prompt.md', source: 'project' as const };
        mockPromptService.findAgent.mockReturnValue(agent);
        mockFs.existsSync.mockReturnValue(false);
        await expect(command.execute('demo')).rejects.toThrow('process.exit');
        expect(console.error).toHaveBeenCalledWith("Error: Agent file '/path/demo.prompt.md' does not exist.");
        expect(process.exit).toHaveBeenCalledWith(1);
    });

    test('command metadata', () => {
        const cmd = command.createCommand();
        expect(cmd.name()).toBe('edit');
        expect(cmd.description()).toBe('Edit an existing agent prompt file');
    });
});
