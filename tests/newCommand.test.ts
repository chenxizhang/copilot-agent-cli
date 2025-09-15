import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { NewCommand } from '../src/commands/newCommand';
import { MetadataParserService } from '../src/services/metadataParser';

// Minimal fake container for BaseCommand requirement
class FakeContainer { }

describe('NewCommand', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'copilot-agent-newcmd-'));
    const projectPromptsDir = path.join(tempDir, '.github', 'prompts');
    const originalCwd = process.cwd();

    beforeAll(() => {
        fs.mkdirSync(projectPromptsDir, { recursive: true });
        process.chdir(tempDir);
    });

    afterAll(() => {
        process.chdir(originalCwd);
        try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch { }
    });

    test('creates file with YAML front matter at top', async () => {
        const cmd = new NewCommand(new FakeContainer() as any);
        // @ts-ignore access private for test stubbing
        cmd.openInEditor = async () => { /* no-op in test */ };
        const agentName = 'sampleagent';

        await cmd.execute(agentName, {});

        const filePath = path.join(projectPromptsDir, `${agentName}.prompt.md`);
        expect(fs.existsSync(filePath)).toBe(true);
        const content = fs.readFileSync(filePath, 'utf8');

        // Should start with --- newline
        expect(content.startsWith('---\n')).toBe(true);

        // Metadata parser should pick up model and mode
        const parser = new MetadataParserService();
        const parsed = parser.parseAgentFile(filePath, 'project');
        expect(parsed.metadata.mode).toBe('agent');
        expect(parsed.metadata.model).toBe('GPT-5 (copilot)');
    });
});
