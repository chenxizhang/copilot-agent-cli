import { Command } from 'commander';
import { IServiceContainer } from '../core';
import { ListCommand } from './listCommand';
import { RunCommand } from './runCommand';
import { NewCommand } from './newCommand';

export class AgentCommandFactory {
  constructor(private container: IServiceContainer) {}

  createAgentCommand(): Command {
    const command = new Command('agent');
    command.description('Manage and run GitHub Copilot agents');

    const listCommand = new ListCommand(this.container);
    const runCommand = new RunCommand(this.container);
    const newCommand = new NewCommand(this.container);

    command.addCommand(listCommand.createCommand());
    command.addCommand(runCommand.createCommand());
    command.addCommand(newCommand.createCommand());

    return command;
  }
}