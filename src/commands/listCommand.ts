import { Command } from 'commander';
import { BaseCommand } from './base';
import { IPromptDiscoveryService, SERVICE_TOKENS } from '../core';
import { MetadataParserService, TableFormatterService } from '../services';

interface ListOptions {
  full?: boolean;
  scope?: 'global' | 'project';
  model?: string;
  format?: 'table' | 'json' | 'csv';
  columns?: string;
  simple?: boolean;
}

export class ListCommand extends BaseCommand {
  private metadataParser: MetadataParserService;
  private tableFormatter: TableFormatterService;

  constructor(container: any) {
    super(container);
    this.metadataParser = new MetadataParserService();
    this.tableFormatter = new TableFormatterService();
  }

  execute(options: ListOptions = {}): void {
    const promptService = this.container.get<IPromptDiscoveryService>(
      SERVICE_TOKENS.PROMPT_DISCOVERY
    );
    
    const result = promptService.discoverAgents();

    if (result.agents.length === 0) {
      console.log('No agents found.');
      console.log(`Global path: ${result.globalPath}`);
      if (result.projectPath) {
        console.log(`Project path: ${result.projectPath}`);
      }
      return;
    }

    // Use simple format if requested
    if (options.simple) {
      this.displaySimpleList(result);
      return;
    }

    // Parse metadata for all agents
    const parsedAgents = result.agents.map(agent => 
      this.metadataParser.parseAgentFile(agent.filePath, agent.source)
    );

    // Apply filters
    let filteredAgents = parsedAgents;
    
    if (options.scope) {
      filteredAgents = filteredAgents.filter(agent => agent.scope === options.scope);
    }
    
    if (options.model) {
      filteredAgents = filteredAgents.filter(agent => 
        agent.metadata.model?.toLowerCase().includes(options.model!.toLowerCase())
      );
    }

    // Handle different output formats
    switch (options.format) {
      case 'json':
        console.log(JSON.stringify(filteredAgents, null, 2));
        break;
      case 'csv':
        this.displayCSV(filteredAgents);
        break;
      case 'table':
      default: {
        const tableOptions = {
          showFullContent: options.full || false
        };
        console.log(this.tableFormatter.formatAgentsTable(filteredAgents, tableOptions));
        break;
      }
    }

    // Show warnings for parsing errors
    const errorAgents = filteredAgents.filter(agent => agent.parseError);
    if (errorAgents.length > 0) {
      console.log('\nWarnings:');
      errorAgents.forEach(agent => {
        console.log(`⚠️  Could not parse metadata for '${agent.filename}.prompt.md'`);
      });
    }
  }

  private displaySimpleList(result: any): void {
    console.log('Available agents:');
    console.log('');

    const globalAgents = result.agents.filter((a: any) => a.source === 'global');
    const projectAgents = result.agents.filter((a: any) => a.source === 'project');

    if (globalAgents.length > 0) {
      console.log('Global agents:');
      globalAgents.forEach((agent: any) => {
        console.log(`  ${agent.name}`);
      });
      console.log('');
    }

    if (projectAgents.length > 0) {
      console.log('Project agents:');
      projectAgents.forEach((agent: any) => {
        console.log(`  ${agent.name}`);
      });
      console.log('');
    }

    console.log(`Total: ${result.agents.length} agent(s)`);
  }

  private displayCSV(agents: any[]): void {
    console.log('Name,Description,Scope,Mode,Model,Tools');
    agents.forEach(agent => {
      const tools = agent.metadata.tools?.join(';') || '';
      const description = agent.metadata.description?.replace(/,/g, ';') || '';
      console.log(`${agent.metadata.name},${description},${agent.scope},${agent.metadata.mode},${agent.metadata.model},${tools}`);
    });
  }

  createCommand(): Command {
    const listCommand = new Command('list');
    listCommand
      .alias('ls')
      .description('List all available agents with metadata')
      .option('--full', 'Show full descriptions (no truncation)')
      .option('--scope <scope>', 'Filter by scope: global or project')
      .option('--model <model>', 'Filter by model name')
      .option('--format <format>', 'Output format: table, json, csv', 'table')
      .option('--columns <columns>', 'Show only specific columns (comma-separated)')
      .option('--simple', 'Use simple list format (legacy)')
      .action((options) => this.execute(options));

    return listCommand;
  }
}