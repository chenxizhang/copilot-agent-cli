import { AgentCommandFactory } from '../src/commands';
import { ServiceContainer, SERVICE_TOKENS } from '../src/core';
import { PromptDiscoveryService, VSCodeIntegrationService, SessionTrackingService, UpdateCheckerService, PackagingService } from '../src/services';

describe('Share & Install Commands', () => {
    let command: any;
    let container: ServiceContainer;

    beforeEach(() => {
        container = new ServiceContainer();
        container.register(SERVICE_TOKENS.PROMPT_DISCOVERY, new PromptDiscoveryService());
        container.register(SERVICE_TOKENS.VSCODE_INTEGRATION, new VSCodeIntegrationService());
        container.register(SERVICE_TOKENS.SESSION_TRACKING, new SessionTrackingService());
        container.register(SERVICE_TOKENS.UPDATE_CHECKER, new UpdateCheckerService());
        container.register(SERVICE_TOKENS.PACKAGING, new PackagingService());

        const factory = new AgentCommandFactory(container);
        command = factory.createAgentCommand();
    });

    test('should include share and install subcommands', () => {
        const subcommands = command.commands.map((cmd: any) => cmd.name());
        expect(subcommands).toContain('share');
        expect(subcommands).toContain('install');
    });
});