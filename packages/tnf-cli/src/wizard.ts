import chalk from 'chalk';
import readline from 'readline';

export class ActionWizard {
  private rl: readline.Interface;

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  public async start() {
    console.clear();
    this.showBanner();
    this.showMainMenu();
  }

  private showBanner() {
    console.log(
      chalk.cyan(`
    ╔══════════════════════════════════════════════════════════════╗
    ║                                                              ║
    ║   🤖  T H E   N E W   F U S E   -   A G E N T   C L I  🤖    ║
    ║                                                              ║
    ╚══════════════════════════════════════════════════════════════╝
    `)
    );
  }

  private showMainMenu() {
    console.log(chalk.bold('\nSelect an operation:'));
    console.log(chalk.green('  [1] ') + 'Register/Start Agent');
    console.log(chalk.green('  [2] ') + 'List Network Peers');
    console.log(chalk.green('  [3] ') + 'Send Broadcast Message');
    console.log(chalk.green('  [4] ') + 'System Health Check');
    console.log(chalk.green('  [5] ') + 'Task Management');
    console.log(chalk.gray('  [0] ') + 'Exit');

    this.rl.question(chalk.yellow('\n> '), (answer) => {
      this.handleMenuSelection(answer.trim());
    });
  }

  private async handleMenuSelection(selection: string) {
    switch (selection) {
      case '1':
        // Start Agent Wizard
        console.log(chalk.blue('\nLaunching Agent Registration...'));
        // In a real implementation, we'd call the register function directly
        // For now, we guide the user to the command
        console.log(chalk.dim('Tip: Use "tnf-agent register <name>" directly next time.'));
        this.rl.question('Enter agent name: ', (name) => {
          if (!name) name = 'wizard-agent';
          this.rl.close();
          console.log(
            chalk.green(`\nRun this command:\n  tnf-agent register ${name} participant vscode`)
          );
          process.exit(0);
        });
        break;
      case '2':
        this.rl.close();
        console.log(chalk.green(`\nRun this command:\n  tnf-agent list`));
        process.exit(0);
        break;
      case '3':
        this.rl.question('Enter message: ', (msg) => {
          this.rl.close();
          console.log(chalk.green(`\nRun this command:\n  tnf-agent send "${msg}"`));
          process.exit(0);
        });
        break;
      case '4':
        this.rl.close();
        console.log(chalk.green(`\nRun this command:\n  tnf-agent health`));
        process.exit(0);
        break;
      case '5':
        this.rl.close();
        console.log(chalk.green(`\nRun this command:\n  tnf-agent task list`));
        process.exit(0);
        break;
      case '0':
        console.log(chalk.yellow('Goodbye!'));
        process.exit(0);
        break;
      default:
        console.log(chalk.red('Invalid selection.'));
        this.showMainMenu();
        break;
    }
  }
}
