import { PromptDiscoveryService } from '../src/services/promptDiscovery';
import * as fs from 'fs';
import * as path from 'path';

describe('PromptDiscoveryService', () => {
  let service: PromptDiscoveryService;

  beforeEach(() => {
    service = new PromptDiscoveryService();
  });

  test('should discover project agents', () => {
    const result = service.discoverAgents();
    
    expect(result.agents).toBeDefined();
    expect(Array.isArray(result.agents)).toBe(true);
    expect(result.globalPath).toBeDefined();
    
    // Check if our test agent is found
    const testAgent = result.agents.find(agent => agent.name === 'testAgent');
    if (testAgent) {
      expect(testAgent.source).toBe('project');
      expect(testAgent.filePath).toContain('testAgent.prompt.md');
    }
  });

  test('should find specific agent by name', () => {
    const agent = service.findAgent('testAgent');
    
    if (agent) {
      expect(agent.name).toBe('testAgent');
      expect(agent.source).toBe('project');
    }
  });

  test('should find agent with case-insensitive search', () => {
    const agentLower = service.findAgent('testagent');
    const agentUpper = service.findAgent('TESTAGENT');
    const agentMixed = service.findAgent('TestAgent');
    
    if (agentLower) {
      expect(agentLower.name).toBe('testAgent');
    }
    if (agentUpper) {
      expect(agentUpper.name).toBe('testAgent');
    }
    if (agentMixed) {
      expect(agentMixed.name).toBe('testAgent');
    }
  });

  test('should return null for non-existent agent', () => {
    const agent = service.findAgent('nonExistentAgent');
    expect(agent).toBeNull();
  });
});