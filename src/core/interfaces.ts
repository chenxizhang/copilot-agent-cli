import { Agent, AgentDiscoveryResult } from '../types';

export interface IPromptDiscoveryService {
  discoverAgents(): AgentDiscoveryResult;
  findAgent(name: string): Agent | null;
}

export interface IVSCodeIntegrationService {
  checkVSCodeAvailability(): Promise<boolean>;
  runAgent(agent: Agent, context?: string): Promise<void>;
  getEnvironmentInfo(): { isVSCode: boolean; description: string; flags: string[] };
}

export interface ICommandHandler {
  execute(...args: any[]): Promise<void> | void;
}

export interface IServiceContainer {
  get<T>(token: string): T;
  register<T>(token: string, implementation: T): void;
}