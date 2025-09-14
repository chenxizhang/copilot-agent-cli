import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as zlib from 'zlib';
import { Agent } from '../types';
import { IPackagingService } from '../core';

interface PackageFileSchema {
    version: number;
    createdAt: string;
    format: 'json-gzip-v1';
    agents: { name: string; filename: string; content: string }[];
    meta: {
        count: number;
        originalSources: { name: string; source: string }[];
    };
}

/**
 * Packaging service: creates and extracts local .agents files.
 * Format: gzip compressed JSON with magic prefix 'AGENTS\n' for quick detection.
 */
export class PackagingService implements IPackagingService {
    private readonly MAGIC = 'AGENTS\n';

    private getDefaultOutputDir(): string {
        return path.join(os.homedir(), 'copilot-agent-packages');
    }

    createPackage(agents: Agent[], outputDir?: string, packageName?: string): string {
        if (!agents || agents.length === 0) {
            throw new Error('No agents provided to package');
        }

        const resolvedOutputDir = outputDir || this.getDefaultOutputDir();
        if (!fs.existsSync(resolvedOutputDir)) {
            fs.mkdirSync(resolvedOutputDir, { recursive: true });
        }

        const timestamp = this.getTimestamp();
        if (!packageName) {
            if (agents.length === 1) {
                packageName = `${agents[0].name}-${timestamp}`;
            } else if (agents.length <= 3) {
                packageName = `${agents.map(a => a.name).join('_')}-${timestamp}`;
            } else {
                packageName = `agents-${agents.length}-${timestamp}`;
            }
        }

        const packageFilePath = path.join(resolvedOutputDir, `${packageName}.agents`);

        const schema: PackageFileSchema = {
            version: 1,
            createdAt: new Date().toISOString(),
            format: 'json-gzip-v1',
            agents: agents.map(agent => {
                const content = fs.readFileSync(agent.filePath, 'utf8');
                return {
                    name: agent.name,
                    filename: path.basename(agent.filePath),
                    content
                };
            }),
            meta: {
                count: agents.length,
                originalSources: agents.map(a => ({ name: a.name, source: a.source }))
            }
        };

        const json = JSON.stringify(schema, null, 2);
        const gz = zlib.gzipSync(Buffer.from(json, 'utf8'));
        const finalBuffer = Buffer.concat([Buffer.from(this.MAGIC, 'utf8'), gz]);
        fs.writeFileSync(packageFilePath, finalBuffer);

        return packageFilePath;
    }

    extractPackage(packageFilePath: string): { version: number; createdAt: string; agents: { name: string; content: string; }[] } {
        if (!fs.existsSync(packageFilePath)) {
            throw new Error(`Package file not found: ${packageFilePath}`);
        }

        const buf = fs.readFileSync(packageFilePath);
        let offset = 0;
        if (buf.slice(0, this.MAGIC.length).toString('utf8') === this.MAGIC) {
            offset = this.MAGIC.length;
        }

        let jsonStr: string;
        try {
            const inflated = zlib.gunzipSync(buf.slice(offset));
            jsonStr = inflated.toString('utf8');
        } catch (e) {
            throw new Error('Failed to decompress .agents file');
        }

        let parsed: PackageFileSchema;
        try {
            parsed = JSON.parse(jsonStr);
        } catch (e) {
            throw new Error('Invalid JSON inside .agents file');
        }

        if (parsed.version !== 1) {
            throw new Error(`Unsupported package version: ${parsed.version}`);
        }

        return {
            version: parsed.version,
            createdAt: parsed.createdAt,
            agents: parsed.agents.map(a => ({ name: a.name, content: a.content }))
        };
    }

    private getTimestamp(): string {
        const d = new Date();
        const pad = (n: number) => n.toString().padStart(2, '0');
        return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
    }
}

export default PackagingService;