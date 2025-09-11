import { ServiceContainer, SERVICE_TOKENS } from '../core';
import { PromptDiscoveryService, VSCodeIntegrationService, SessionTrackingService, UpdateCheckerService } from '../services';

export function registerServices(): ServiceContainer {
  const container = new ServiceContainer();

  // Register core services
  container.register(SERVICE_TOKENS.PROMPT_DISCOVERY, new PromptDiscoveryService());
  container.register(SERVICE_TOKENS.VSCODE_INTEGRATION, new VSCodeIntegrationService());
  container.register(SERVICE_TOKENS.SESSION_TRACKING, new SessionTrackingService());
  container.register(SERVICE_TOKENS.UPDATE_CHECKER, new UpdateCheckerService());

  return container;
}