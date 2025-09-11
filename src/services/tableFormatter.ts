import { ParsedAgent } from './metadataParser';

interface TableColumn {
  header: string;
  width: number;
  align: 'left' | 'center' | 'right';
}

interface TableOptions {
  maxDescriptionLength?: number;
  maxToolsLength?: number;
  showFullContent?: boolean;
}

export class TableFormatterService {
  private readonly defaultOptions: Required<TableOptions> = {
    maxDescriptionLength: 35,
    maxToolsLength: 20,
    showFullContent: false
  };

  formatAgentsTable(agents: ParsedAgent[], options: TableOptions = {}): string {
    const opts = { ...this.defaultOptions, ...options };
    
    if (agents.length === 0) {
      return 'No agents found.';
    }

    const columns: TableColumn[] = [
      { header: 'Name', width: 0, align: 'left' },
      { header: 'Description', width: 0, align: 'left' },
      { header: 'Scope', width: 7, align: 'center' },
      { header: 'Mode', width: 6, align: 'center' },
      { header: 'Model', width: 0, align: 'left' },
      { header: 'Tools', width: 0, align: 'left' }
    ];

    // Calculate dynamic column widths
    this.calculateColumnWidths(columns, agents, opts);

    // Generate table
    let table = '';
    table += this.generateTableBorder(columns, 'top');
    table += this.generateTableRow(columns, columns.map(c => c.header));
    table += this.generateTableBorder(columns, 'middle');

    for (const agent of agents) {
      const row = this.formatAgentRow(agent, columns);
      table += this.generateTableRow(columns, row);
    }

    table += this.generateTableBorder(columns, 'bottom');

    // Add summary
    const globalCount = agents.filter(a => a.scope === 'global').length;
    const projectCount = agents.filter(a => a.scope === 'project').length;
    table += `\nFound ${agents.length} agents (${globalCount} global, ${projectCount} project-level)`;

    return table;
  }

  private calculateColumnWidths(columns: TableColumn[], agents: ParsedAgent[], options: Required<TableOptions>): void {
    // Name column
    const maxNameLength = Math.max(
      columns[0].header.length,
      ...agents.map(a => a.metadata.name?.length || 0)
    );
    columns[0].width = Math.min(maxNameLength, 15);

    // Description column
    const maxDescLength = options.showFullContent ? 50 : options.maxDescriptionLength;
    columns[1].width = maxDescLength;

    // Model column
    const maxModelLength = Math.max(
      columns[4].header.length,
      ...agents.map(a => a.metadata.model?.length || 0)
    );
    columns[4].width = Math.min(maxModelLength, 15);

    // Tools column
    const maxToolsLength = options.showFullContent ? 30 : options.maxToolsLength;
    columns[5].width = maxToolsLength;
  }

  private formatAgentRow(agent: ParsedAgent, columns: TableColumn[]): string[] {
    const name = this.truncateText(agent.metadata.name || '', columns[0].width);
    const description = agent.parseError 
      ? '⚠️  Metadata parsing failed'
      : this.truncateText(agent.metadata.description || '', columns[1].width);
    const scope = agent.scope === 'global' ? 'Global' : 'Project';
    const mode = agent.parseError ? '-' : (agent.metadata.mode || '-');
    const model = agent.parseError ? '-' : this.truncateText(agent.metadata.model || '', columns[4].width);
    const tools = agent.parseError ? '-' : this.formatTools(agent.metadata.tools || [], columns[5].width);

    return [name, description, scope, mode, model, tools];
  }

  private formatTools(tools: string[], maxLength: number): string {
    if (tools.length === 0) {
      return 'None';
    }

    const toolsText = tools.join(', ');
    return this.truncateText(toolsText, maxLength);
  }

  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength - 3) + '...';
  }

  private generateTableBorder(columns: TableColumn[], position: 'top' | 'middle' | 'bottom'): string {
    const chars = {
      top: { left: '┌', right: '┐', middle: '┬', horizontal: '─' },
      middle: { left: '├', right: '┤', middle: '┼', horizontal: '─' },
      bottom: { left: '└', right: '┘', middle: '┴', horizontal: '─' }
    };

    const char = chars[position];
    let border = char.left;

    for (let i = 0; i < columns.length; i++) {
      border += char.horizontal.repeat(columns[i].width + 2); // +2 for padding
      if (i < columns.length - 1) {
        border += char.middle;
      }
    }

    border += char.right + '\n';
    return border;
  }

  private generateTableRow(columns: TableColumn[], values: string[]): string {
    let row = '│';

    for (let i = 0; i < columns.length; i++) {
      const value = values[i] || '';
      const width = columns[i].width;
      const align = columns[i].align;
      
      const paddedValue = this.padText(value, width, align);
      
      row += ` ${paddedValue} │`;
    }

    row += '\n';
    return row;
  }

  private padText(text: string, width: number, align: 'left' | 'center' | 'right'): string {
    if (text.length >= width) {
      return text.substring(0, width);
    }

    const padding = width - text.length;

    switch (align) {
      case 'center': {
        const leftPad = Math.floor(padding / 2);
        const rightPad = padding - leftPad;
        return ' '.repeat(leftPad) + text + ' '.repeat(rightPad);
      }
      case 'right':
        return ' '.repeat(padding) + text;
      case 'left':
      default:
        return text + ' '.repeat(padding);
    }
  }
}