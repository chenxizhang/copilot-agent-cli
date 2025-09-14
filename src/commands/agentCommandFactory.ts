import { Command } from 'commander';
import { IServiceContainer } from '../core';
import { ListCommand } from './listCommand';
import { RunCommand } from './runCommand';
import { NewCommand } from './newCommand';
import { DeleteCommand } from './deleteCommand';
import { ShareCommand } from './shareCommand';
import { InstallCommand } from './installCommand';
import { EditCommand } from './editCommand';

export class AgentCommandFactory {
  constructor(private container: IServiceContainer) { }

  createAgentCommand(): Command {
    const command = new Command('agent');
    command.description('Manage and run GitHub Copilot agents');

    const listCommand = new ListCommand(this.container);
    const runCommand = new RunCommand(this.container);
    const newCommand = new NewCommand(this.container);
    const deleteCommand = new DeleteCommand(this.container);
    const shareCommand = new ShareCommand(this.container);
    const installCommand = new InstallCommand(this.container);
    const editCommand = new EditCommand(this.container);

    command.addCommand(listCommand.createCommand());
    command.addCommand(runCommand.createCommand());
    command.addCommand(newCommand.createCommand());
    command.addCommand(deleteCommand.createCommand());
    command.addCommand(shareCommand.createCommand());
    command.addCommand(installCommand.createCommand());
    command.addCommand(editCommand.createCommand());

    return command;
  }
}