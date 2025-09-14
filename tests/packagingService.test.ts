import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { PackagingService } from '../src/services';
import { Agent } from '../src/types';

describe('PackagingService', () => {
    const tempDir = path.join(os.tmpdir(), 'copilot-agent-cli-test');
    const promptsDir = path.join(tempDir, 'prompts');
    const service = new PackagingService();

    beforeAll(() => {
        fs.mkdirSync(promptsDir, { recursive: true });
        fs.writeFileSync(path.join(promptsDir, 'a.prompt.md'), '---\nmode: agent\n---\nA', 'utf8');
        fs.writeFileSync(path.join(promptsDir, 'b.prompt.md'), '---\nmode: agent\n---\nB', 'utf8');
    });

    afterAll(() => {
        try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch { }
    });

    test('creates and extracts package', () => {
        const agents: Agent[] = [
            { name: 'a', filePath: path.join(promptsDir, 'a.prompt.md'), source: 'project' },
            { name: 'b', filePath: path.join(promptsDir, 'b.prompt.md'), source: 'project' }
        ];

        const outDir = path.join(tempDir, 'packages');
        const pkg = service.createPackage(agents, outDir, 'testpkg');
        expect(fs.existsSync(pkg)).toBe(true);

        const extracted = service.extractPackage(pkg);
        expect(extracted.agents.length).toBe(2);
        const names = extracted.agents.map(a => a.name).sort();
        expect(names).toEqual(['a', 'b']);
    });
});