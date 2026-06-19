import chalk from 'chalk';
import ora, { type Ora } from 'ora';

export class Logger {
  info(message: string): void {
    console.log(chalk.cyan(message));
  }

  success(message: string): void {
    console.log(chalk.green(message));
  }

  warn(message: string): void {
    console.log(chalk.yellow(message));
  }

  error(message: string): void {
    console.error(chalk.red(message));
  }

  spinner(message: string): Ora {
    return ora(message).start();
  }
}

export const logger = new Logger();
