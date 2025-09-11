import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Agent, AgentDiscoveryResult } from '../types';
import { IPromptDiscoveryService } from '../core';

export class PromptDiscoveryService implements IPromptDiscoveryService {
  private getGlobalPromptsPath(): string {
    return path.join(
      os.homedir(),
      'AppData',
      'Roaming',
      'Code',
      'User',
      'prompts'
    );
  }

  private getProjectPromptsPath(): string {
    return path.join(process.cwd(), '.github', 'prompts');
  }

  private scanPromptsDirectory(
    dirPath: string,
    source: 'global' | 'project'
  ): Agent[] {
    const agents: Agent[] = [];

    if (!fs.existsSync(dirPath)) {
      return agents;
    }

    try {
      const files = fs.readdirSync(dirPath);
      for (const file of files) {
        if (file.endsWith('.prompt.md')) {
          const name = file.replace('.prompt.md', '');
          const filePath = path.join(dirPath, file);
          agents.push({ name, filePath, source });
        }
      }
    } catch (error) {
      console.warn(`Warning: Could not read directory ${dirPath}`);
    }

    return agents;
  }

  public discoverAgents(): AgentDiscoveryResult {
    const globalPath = this.getGlobalPromptsPath();
    const projectPath = this.getProjectPromptsPath();

    const globalAgents = this.scanPromptsDirectory(globalPath, 'global');
    const projectAgents = this.scanPromptsDirectory(projectPath, 'project');

    const agentMap = new Map<string, Agent>();

    globalAgents.forEach((agent) => {
      agentMap.set(agent.name, agent);
    });

    projectAgents.forEach((agent) => {
      agentMap.set(agent.name, agent);
    });

    const agents = Array.from(agentMap.values());

    return {
      agents,
      globalPath,
      projectPath: fs.existsSync(projectPath) ? projectPath : undefined,
    };
  }

  public findAgent(name: string): Agent | null {
    const { agents } = this.discoverAgents();
    return agents.find((agent) => agent.name.toLowerCase() === name.toLowerCase()) || null;
  }
}
