#!/usr/bin/env node

import { Command } from 'commander';
import { createAgentCommand } from './commands/agent';

const program = new Command();

program
  .name('copilot')
  .description('CLI tool to automate GitHub Copilot prompts as agents')
  .version('1.0.0');

program.addCommand(createAgentCommand());

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
