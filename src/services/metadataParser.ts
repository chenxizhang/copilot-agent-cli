import * as fs from 'fs';
import * as yaml from 'js-yaml';

export interface AgentMetadata {
  name?: string;
  description?: string;
  mode?: string;
  model?: string;
  tools?: string[];
}

export interface ParsedAgent {
  filename: string;
  filepath: string;
  scope: 'global' | 'project';
  metadata: AgentMetadata;
  parseError?: string;
}

export class MetadataParserService {
  parseAgentFile(filePath: string, scope: 'global' | 'project'): ParsedAgent {
    const filename = this.extractFilename(filePath);
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const metadata = this.extractMetadata(content);
      
      return {
        filename,
        filepath: filePath,
        scope,
        metadata: this.fillDefaults(metadata, filename)
      };
    } catch (error) {
      return {
        filename,
        filepath: filePath,
        scope,
        metadata: this.getDefaultMetadata(filename),
        parseError: error instanceof Error ? error.message : 'Unknown parsing error'
      };
    }
  }

  private extractFilename(filePath: string): string {
    const parts = filePath.split(/[/\\]/);
    const filename = parts[parts.length - 1];
    return filename.replace('.prompt.md', '');
  }

  private extractMetadata(content: string): Partial<AgentMetadata> {
    // Look for YAML front matter
    const frontMatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
    
    if (!frontMatterMatch) {
      return {};
    }

    try {
      const yamlContent = frontMatterMatch[1];
      const parsed = yaml.load(yamlContent) as any;
      
      return {
        description: parsed.description,
        mode: parsed.mode,
        model: parsed.model,
        tools: Array.isArray(parsed.tools) ? parsed.tools : undefined
      };
    } catch (error) {
      throw new Error('Invalid YAML front matter');
    }
  }

  private fillDefaults(metadata: Partial<AgentMetadata>, filename: string): AgentMetadata {
    return {
      name: filename, // Always use filename, ignore metadata.name
      description: metadata.description || 'No description available',
      mode: metadata.mode || 'Unknown',
      model: metadata.model || 'Not specified',
      tools: metadata.tools || []
    };
  }

  private getDefaultMetadata(filename: string): AgentMetadata {
    return {
      name: filename,
      description: 'No description available',
      mode: 'Unknown',
      model: 'Not specified',
      tools: []
    };
  }
}