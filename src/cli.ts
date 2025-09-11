#!/usr/bin/env node

import { Command } from 'commander';
import { registerServices } from './infrastructure';
import { AgentCommandFactory } from './commands';

const program = new Command();

program
  .name('copilot')
  .description('CLI tool to automate GitHub Copilot prompts as agents')
  .version('1.0.0');

// Initialize dependency injection container
const container = registerServices();

// Create and register commands
const agentCommandFactory = new AgentCommandFactory(container);
program.addCommand(agentCommandFactory.createAgentCommand());

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
