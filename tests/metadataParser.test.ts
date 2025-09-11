import { MetadataParserService } from '../src/services/metadataParser';
import * as fs from 'fs';
import * as path from 'path';

// Mock fs module
jest.mock('fs');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('MetadataParserService', () => {
  let service: MetadataParserService;

  beforeEach(() => {
    service = new MetadataParserService();
    jest.clearAllMocks();
  });

  test('should parse agent file with valid YAML front matter', () => {
    const content = `---
name: "Test Agent"
description: "A test agent"
mode: "agent"
model: "gpt-4"
tools:
  - filesystem
  - git
---

# Test Agent
This is a test agent.`;

    mockFs.readFileSync.mockReturnValue(content);

    const result = service.parseAgentFile('/path/to/test.prompt.md', 'global');

    expect(result.filename).toBe('test');
    expect(result.scope).toBe('global');
    expect(result.metadata.name).toBe('test'); // Name comes from filename, not YAML
    expect(result.metadata.description).toBe('A test agent');
    expect(result.metadata.mode).toBe('agent');
    expect(result.metadata.model).toBe('gpt-4');
    expect(result.metadata.tools).toEqual(['filesystem', 'git']);
    expect(result.parseError).toBeUndefined();
  });

  test('should handle file without YAML front matter', () => {
    const content = `# Test Agent
This is a test agent without front matter.`;

    mockFs.readFileSync.mockReturnValue(content);

    const result = service.parseAgentFile('/path/to/test.prompt.md', 'project');

    expect(result.filename).toBe('test');
    expect(result.scope).toBe('project');
    expect(result.metadata.name).toBe('test');
    expect(result.metadata.description).toBe('No description available');
    expect(result.metadata.mode).toBe('Unknown');
    expect(result.metadata.model).toBe('Not specified');
    expect(result.metadata.tools).toEqual([]);
    expect(result.parseError).toBeUndefined();
  });

  test('should handle invalid YAML front matter', () => {
    const content = `---
invalid: yaml: content: [
---

# Test Agent`;

    mockFs.readFileSync.mockReturnValue(content);

    const result = service.parseAgentFile('/path/to/test.prompt.md', 'global');

    expect(result.filename).toBe('test');
    expect(result.parseError).toBe('Invalid YAML front matter');
    expect(result.metadata.name).toBe('test');
    expect(result.metadata.description).toBe('No description available');
  });

  test('should handle file read error', () => {
    mockFs.readFileSync.mockImplementation(() => {
      throw new Error('File not found');
    });

    const result = service.parseAgentFile('/path/to/missing.prompt.md', 'global');

    expect(result.filename).toBe('missing');
    expect(result.parseError).toBe('File not found');
    expect(result.metadata.name).toBe('missing');
  });

  test('should extract filename correctly from different path formats', () => {
    const content = `# Test`;
    mockFs.readFileSync.mockReturnValue(content);

    // Windows path
    let result = service.parseAgentFile('C:\\path\\to\\agent.prompt.md', 'global');
    expect(result.filename).toBe('agent');

    // Unix path
    result = service.parseAgentFile('/path/to/agent.prompt.md', 'global');
    expect(result.filename).toBe('agent');
  });

  test('should handle partial metadata', () => {
    const content = `---
name: "Partial Agent"
mode: "agent"
---

# Partial Agent`;

    mockFs.readFileSync.mockReturnValue(content);

    const result = service.parseAgentFile('/path/to/partial.prompt.md', 'global');

    expect(result.metadata.name).toBe('partial'); // Name comes from filename, not YAML
    expect(result.metadata.description).toBe('No description available');
    expect(result.metadata.mode).toBe('agent');
    expect(result.metadata.model).toBe('Not specified');
    expect(result.metadata.tools).toEqual([]);
  });
});