import { IServiceContainer } from './interfaces';

export class ServiceContainer implements IServiceContainer {
  private services = new Map<string, any>();

  register<T>(token: string, implementation: T): void {
    this.services.set(token, implementation);
  }

  get<T>(token: string): T {
    const service = this.services.get(token);
    if (!service) {
      throw new Error(`Service not found: ${token}`);
    }
    return service;
  }

  has(token: string): boolean {
    return this.services.has(token);
  }
}

export const SERVICE_TOKENS = {
  PROMPT_DISCOVERY: 'PromptDiscoveryService',
  VSCODE_INTEGRATION: 'VSCodeIntegrationService',
} as const;