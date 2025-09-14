import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { BaseCommand } from './base';
import { IPromptDiscoveryService, IPackagingService, SERVICE_TOKENS } from '../core';

interface ShareOptions {
    all?: boolean;
    name?: string;
    outputDir?: string;
}

export class ShareCommand extends BaseCommand {
    execute(agentNames: string[], options: ShareOptions = {}): void {
        const discovery = this.container.get<IPromptDiscoveryService>(SERVICE_TOKENS.PROMPT_DISCOVERY);
        const packager = this.container.get<IPackagingService>(SERVICE_TOKENS.PACKAGING);

        const discoveryResult = discovery.discoverAgents();
        let selectedAgents = discoveryResult.agents;

        if (!options.all) {
            if (!agentNames || agentNames.length === 0) {
                console.error('❌ Please provide agent names to share, or use --all to include every agent.');
                return;
            }
            const nameSet = new Set(agentNames.map(n => n.toLowerCase()));
            selectedAgents = selectedAgents.filter(a => nameSet.has(a.name.toLowerCase()));
            const missing = agentNames.filter(n => !selectedAgents.find(a => a.name.toLowerCase() === n.toLowerCase()));
            if (missing.length > 0) {
                console.error('❌ The following agents were not found: ' + missing.join(', '));
                return;
            }
        }

        if (selectedAgents.length === 0) {
            console.error('❌ No agents available to share.');
            return;
        }

        const outputDir = options.outputDir || path.join(os.homedir(), 'copilot-agent-packages');
        try {
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }
        } catch (e) {
            console.error('❌ Failed to create output directory: ' + outputDir);
            return;
        }

        let packageFile: string;
        try {
            packageFile = packager.createPackage(selectedAgents, outputDir, options.name);
        } catch (e) {
            console.error('❌ Packaging failed: ' + (e instanceof Error ? e.message : e));
            return;
        }

        console.log('✅ Package created successfully!');
        console.log('📦 File: ' + packageFile);
        console.log('👥 Contains ' + selectedAgents.length + ' agent(s):');
        selectedAgents.forEach(a => console.log('  - ' + a.name + ` (${a.source})`));
        console.log('');
        console.log('📤 You can now share this .agents file with others.');
        console.log('📥 They can install it using:');
        console.log('   copilot agent install ' + packageFile);
    }

    createCommand(): Command {
        return new Command('share')
            .description('Package one or multiple agents into a .agents file (local only, no upload)')
            .argument('[agent-names...]', 'Agent names to include (multiple allowed)')
            .option('--all', 'Include all available agents')
            .option('--name <packageName>', 'Custom package base name (without extension)')
            .option('--output-dir <dir>', 'Output directory (default: ~/copilot-agent-packages)')
            .action((agentNames: string[], options: ShareOptions) => this.execute(agentNames, options));
    }
}

export default ShareCommand;