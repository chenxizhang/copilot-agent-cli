#!/usr/bin/env node

import { Command } from 'commander';
import { registerServices } from './infrastructure';
import { AgentCommandFactory, UpdateCommand, FeedbackCommand } from './commands';
import { SERVICE_TOKENS } from './core';
import { ISessionTrackingService, IUpdateCheckerService } from './core/interfaces';

const program = new Command();

program
  .name('copilot')
  .description('CLI tool to automate GitHub Copilot prompts as agents')
  .version('1.4.0');

// Initialize dependency injection container
const container = registerServices();

// Check for updates on first command execution in session
async function checkForUpdatesIfFirstCommand(): Promise<void> {
  try {
    const sessionTracker = container.get<ISessionTrackingService>(SERVICE_TOKENS.SESSION_TRACKING);
    const updateChecker = container.get<IUpdateCheckerService>(SERVICE_TOKENS.UPDATE_CHECKER);

    if (sessionTracker.isFirstCommandInSession()) {
      sessionTracker.markSessionStarted();

      const updateInfo = await updateChecker.checkForUpdates();
      if (updateInfo && updateInfo.hasUpdate) {
        updateChecker.displayUpdateNotification(updateInfo.currentVersion, updateInfo.latestVersion);
      }
    }
  } catch (error) {
    // Silent fail - update check should not interfere with normal operation
  }
}

// Create and register commands
const agentCommandFactory = new AgentCommandFactory(container);
program.addCommand(agentCommandFactory.createAgentCommand());

// Add update command
const updateCommand = new UpdateCommand(container);
program.addCommand(updateCommand.createCommand());

// Add feedback command
const feedbackCommand = new FeedbackCommand(container);
program.addCommand(feedbackCommand.createCommand());

// Hook into command execution to check for updates
program.hook('preAction', async () => {
  await checkForUpdatesIfFirstCommand();
});

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
