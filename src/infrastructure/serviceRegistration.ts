import { ServiceContainer, SERVICE_TOKENS } from '../core';
import { PromptDiscoveryService, VSCodeIntegrationService } from '../services';

export function registerServices(): ServiceContainer {
  const container = new ServiceContainer();

  // Register core services
  container.register(SERVICE_TOKENS.PROMPT_DISCOVERY, new PromptDiscoveryService());
  container.register(SERVICE_TOKENS.VSCODE_INTEGRATION, new VSCodeIntegrationService());

  return container;
}