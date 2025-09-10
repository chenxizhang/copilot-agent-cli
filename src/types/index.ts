export interface Agent {
  name: string;
  filePath: string;
  source: 'global' | 'project';
}

export interface AgentDiscoveryResult {
  agents: Agent[];
  globalPath: string;
  projectPath?: string;
}
