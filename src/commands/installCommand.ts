import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { BaseCommand } from './base';
import { IPackagingService, SERVICE_TOKENS } from '../core';

interface InstallOptions {
    target?: 'global' | 'project';
    force?: boolean;
}

export class InstallCommand extends BaseCommand {
    execute(packageFile: string, options: InstallOptions = {}): void {
        const packager = this.container.get<IPackagingService>(SERVICE_TOKENS.PACKAGING);
        if (!packageFile) {
            console.error('❌ Please provide a .agents package file path.');
            return;
        }
        if (!fs.existsSync(packageFile)) {
            console.error('❌ File not found: ' + packageFile);
            return;
        }

        let extracted;
        try {
            extracted = packager.extractPackage(packageFile);
        } catch (e) {
            console.error('❌ Failed to parse package: ' + (e instanceof Error ? e.message : e));
            return;
        }

        const targetDir = this.resolveTargetDir(options.target);
        try {
            if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true });
            }
        } catch (e) {
            console.error('❌ Failed to create target directory: ' + targetDir);
            return;
        }

        console.log(`📦 Package: ${packageFile}`);
        console.log(`🗂️  Target directory: ${targetDir}`);
        console.log(`📝 Contains ${extracted.agents.length} agent(s)`);

        let installed = 0;
        const skipped: string[] = [];

        for (const agent of extracted.agents) {
            const filePath = path.join(targetDir, `${agent.name}.prompt.md`);
            if (fs.existsSync(filePath) && !options.force) {
                skipped.push(agent.name);
                continue;
            }
            try {
                fs.writeFileSync(filePath, agent.content, 'utf8');
                installed++;
            } catch (e) {
                console.error(`❌ Failed to write: ${agent.name} - ${(e as Error).message}`);
            }
        }

        console.log('');
        console.log(`✅ Installed: ${installed}`);
        if (skipped.length) {
            console.log(`⚠️  Skipped (already exists, use --force to overwrite): ${skipped.join(', ')}`);
        }
        console.log('');
        console.log('💡 Run "copilot agent list" to view installed agents.');
    }

    private resolveTargetDir(target?: 'global' | 'project'): string {
        const globalDir = path.join(os.homedir(), 'AppData', 'Roaming', 'Code', 'User', 'prompts');
        const projectDir = path.join(process.cwd(), '.github', 'prompts');

        if (target === 'global') return globalDir;
        if (target === 'project') return projectDir;

        // Default: prefer global first unless user explicitly chooses project
        return globalDir;
    }

    createCommand(): Command {
        return new Command('install')
            .description('Install agents from a .agents package file')
            .argument('<package-file>', 'Path to the .agents file')
            .option('--target <target>', 'Install target: global or project')
            .option('--force', 'Overwrite existing agent files with same name')
            .action((packageFile: string, options: InstallOptions) => this.execute(packageFile, options));
    }
}

export default InstallCommand;