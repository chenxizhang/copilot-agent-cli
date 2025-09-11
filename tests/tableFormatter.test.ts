import { TableFormatterService } from '../src/services/tableFormatter';
import { ParsedAgent } from '../src/services/metadataParser';

describe('TableFormatterService', () => {
  let service: TableFormatterService;

  beforeEach(() => {
    service = new TableFormatterService();
  });

  test('should format empty agent list', () => {
    const result = service.formatAgentsTable([]);
    expect(result).toBe('No agents found.');
  });

  test('should format single agent', () => {
    const agents: ParsedAgent[] = [{
      filename: 'test',
      filepath: '/path/test.prompt.md',
      scope: 'global',
      metadata: {
        name: 'Test Agent',
        description: 'A test agent',
        mode: 'agent',
        model: 'gpt-4',
        tools: ['filesystem']
      }
    }];

    const result = service.formatAgentsTable(agents);
    
    expect(result).toContain('Test Agent');
    expect(result).toContain('A test agent');
    expect(result).toContain('Global');
    expect(result).toContain('agent');
    expect(result).toContain('gpt-4');
    expect(result).toContain('filesystem');
    expect(result).toContain('Found 1 agents (1 global, 0 project-level)');
  });

  test('should format multiple agents with different scopes', () => {
    const agents: ParsedAgent[] = [
      {
        filename: 'global-agent',
        filepath: '/global/agent.prompt.md',
        scope: 'global',
        metadata: {
          name: 'Global Agent',
          description: 'A global agent',
          mode: 'agent',
          model: 'gpt-4',
          tools: ['filesystem']
        }
      },
      {
        filename: 'project-agent',
        filepath: '/project/agent.prompt.md',
        scope: 'project',
        metadata: {
          name: 'Project Agent',
          description: 'A project agent',
          mode: 'chat',
          model: 'claude-3',
          tools: ['git', 'eslint']
        }
      }
    ];

    const result = service.formatAgentsTable(agents);
    
    expect(result).toContain('Global Agent');
    expect(result).toContain('Project Agent');
    expect(result).toContain('Global');
    expect(result).toContain('Project');
    expect(result).toContain('Found 2 agents (1 global, 1 project-level)');
  });

  test('should handle agent with parsing error', () => {
    const agents: ParsedAgent[] = [{
      filename: 'broken',
      filepath: '/path/broken.prompt.md',
      scope: 'global',
      metadata: {
        name: 'broken',
        description: 'No description available',
        mode: 'Unknown',
        model: 'Not specified',
        tools: []
      },
      parseError: 'Invalid YAML'
    }];

    const result = service.formatAgentsTable(agents);
    
    expect(result).toContain('⚠️  Metadata parsing failed');
    expect(result).toContain('-'); // Should show dashes for missing data
  });

  test('should truncate long descriptions', () => {
    const agents: ParsedAgent[] = [{
      filename: 'verbose',
      filepath: '/path/verbose.prompt.md',
      scope: 'global',
      metadata: {
        name: 'Verbose Agent',
        description: 'This is a very long description that should be truncated because it exceeds the maximum length allowed in the table format',
        mode: 'agent',
        model: 'gpt-4',
        tools: []
      }
    }];

    const result = service.formatAgentsTable(agents);
    
    expect(result).toContain('...');
    expect(result).not.toContain('exceeds the maximum length');
  });

  test('should format tools list correctly', () => {
    const agents: ParsedAgent[] = [{
      filename: 'multi-tool',
      filepath: '/path/multi-tool.prompt.md',
      scope: 'global',
      metadata: {
        name: 'Multi Tool Agent',
        description: 'Agent with multiple tools',
        mode: 'agent',
        model: 'gpt-4',
        tools: ['filesystem', 'git', 'eslint', 'prettier', 'jest']
      }
    }];

    const result = service.formatAgentsTable(agents);
    
    expect(result).toContain('filesystem, git');
  });

  test('should handle agent with no tools', () => {
    const agents: ParsedAgent[] = [{
      filename: 'no-tools',
      filepath: '/path/no-tools.prompt.md',
      scope: 'global',
      metadata: {
        name: 'No Tools Agent',
        description: 'Agent without tools',
        mode: 'agent',
        model: 'gpt-4',
        tools: []
      }
    }];

    const result = service.formatAgentsTable(agents);
    
    expect(result).toContain('None');
  });

  test('should respect full content option', () => {
    const agents: ParsedAgent[] = [{
      filename: 'long-desc',
      filepath: '/path/long-desc.prompt.md',
      scope: 'global',
      metadata: {
        name: 'Long Description Agent',
        description: 'This is a moderately long description that might be truncated in normal mode',
        mode: 'agent',
        model: 'gpt-4',
        tools: []
      }
    }];

    const normalResult = service.formatAgentsTable(agents);
    const fullResult = service.formatAgentsTable(agents, { showFullContent: true });
    
    // Full content should be longer or equal
    expect(fullResult.length).toBeGreaterThanOrEqual(normalResult.length);
  });
});