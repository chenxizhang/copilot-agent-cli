import { Command } from 'commander';
import { ICommandHandler, IServiceContainer } from '../core';

export abstract class BaseCommand implements ICommandHandler {
  constructor(protected container: IServiceContainer) {}

  abstract execute(...args: any[]): Promise<void> | void;
  abstract createCommand(): Command;
}