import chalk from 'chalk';
import ora from 'ora';
export class Logger {
    info(message) {
        console.log(chalk.cyan(message));
    }
    success(message) {
        console.log(chalk.green(message));
    }
    warn(message) {
        console.log(chalk.yellow(message));
    }
    error(message) {
        console.error(chalk.red(message));
    }
    spinner(message) {
        return ora(message).start();
    }
}
export const logger = new Logger();
//# sourceMappingURL=logger.js.map