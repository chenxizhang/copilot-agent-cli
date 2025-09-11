import * as https from 'https';
import { IUpdateCheckerService } from '../core/interfaces';

interface NpmRegistryResponse {
  'dist-tags': {
    latest: string;
  };
}

export class UpdateCheckerService implements IUpdateCheckerService {
  private readonly packageName = 'copilot-agent-cli';
  private readonly currentVersion: string;

  constructor() {
    // Get current version from package.json
    this.currentVersion = require('../../package.json').version;
  }

  async checkForUpdates(): Promise<{ hasUpdate: boolean; currentVersion: string; latestVersion: string } | null> {
    try {
      const latestVersion = await this.fetchLatestVersion();
      const hasUpdate = this.compareVersions(this.currentVersion, latestVersion) < 0;
      
      return {
        hasUpdate,
        currentVersion: this.currentVersion,
        latestVersion
      };
    } catch (error) {
      // Silent fail on network issues
      return null;
    }
  }

  displayUpdateNotification(currentVersion: string, latestVersion: string): void {
    console.log(`📦 A new version (v${latestVersion}) is available! You're currently on v${currentVersion}`);
    console.log(`   Run 'copilot update' or 'npm install -g copilot-agent-cli@latest' to update\n`);
  }

  private fetchLatestVersion(): Promise<string> {
    return new Promise((resolve, reject) => {
      const url = `https://registry.npmjs.org/${this.packageName}`;
      
      const request = https.get(url, { timeout: 5000 }, (response) => {
        let data = '';
        
        response.on('data', (chunk) => {
          data += chunk;
        });
        
        response.on('end', () => {
          try {
            const parsed: NpmRegistryResponse = JSON.parse(data);
            resolve(parsed['dist-tags'].latest);
          } catch (error) {
            reject(new Error('Failed to parse npm registry response'));
          }
        });
      });
      
      request.on('error', (error) => {
        reject(error);
      });
      
      request.on('timeout', () => {
        request.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }

  private compareVersions(version1: string, version2: string): number {
    const v1Parts = version1.replace(/^v/, '').split('.').map(Number);
    const v2Parts = version2.replace(/^v/, '').split('.').map(Number);
    
    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
      const v1Part = v1Parts[i] || 0;
      const v2Part = v2Parts[i] || 0;
      
      if (v1Part < v2Part) return -1;
      if (v1Part > v2Part) return 1;
    }
    
    return 0;
  }
}