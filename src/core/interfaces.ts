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

export interface ISessionTrackingService {
  isFirstCommandInSession(): boolean;
  markSessionStarted(): void;
}

export interface IUpdateCheckerService {
  checkForUpdates(): Promise<{ hasUpdate: boolean; currentVersion: string; latestVersion: string } | null>;
  displayUpdateNotification(currentVersion: string, latestVersion: string): void;
}

// Packaging service for sharing/installing agents without uploading to cloud
export interface IPackagingService {
  /**
   * Create a .agents package file containing the specified agent prompt files.
   * @param agents Agents to include (filePath must exist)
   * @param outputDir Directory where package file will be written
   * @param packageName Optional base name (without extension). If omitted, generated automatically.
   * @returns Full path to created package file
   */
  createPackage(agents: Agent[], outputDir: string, packageName?: string): string;

  /**
   * Extract a .agents package file (gzip JSON format) and return agent contents.
   * Does not write files.
   */
  extractPackage(packageFilePath: string): {
    version: number;
    createdAt: string;
    agents: { name: string; content: string }[];
  };
}