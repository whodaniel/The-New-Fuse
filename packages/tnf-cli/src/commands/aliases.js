import { Command } from 'commander';
import chalk from 'chalk';
/**
 * Legacy command mappings for backward compatibility
 */
const LEGACY_COMMAND_MAPPINGS = {
    // Development commands
    'build': 'dev build',
    'test': 'dev test',
    'lint': 'dev lint',
    'clean': 'dev clean',
    'start': 'run start',
    'stop': 'run stop',
    'restart': 'run restart',
    // Agent commands
    'agents': 'agent',
    'ai-agent': 'agent run ai-agent',
    'agent-list': 'agent list',
    'agent-run': 'agent run',
    // Protocol commands (become aliases)
    'claude': 'agent run claude',
    'gemini': 'agent run gemini',
    'auggie': 'agent run auggie',
    'codex': 'agent run codex',
    'copilot': 'agent run copilot',
    'cursor': 'agent run cursor',
    'kilo': 'agent run kilo',
    'cline': 'agent run cline',
    // Infrastructure commands
    'node': 'run status',
    'connect': 'infra status',
    'terminal': 'run logs',
    'federation': 'agent federate',
    'plan': 'workflow create',
    'mcp': 'agent run mcp-server',
    // Workflow commands
    'workflow-list': 'workflow list',
    'workflow-run': 'workflow run',
    'workflow-create': 'workflow create',
    // Configuration commands
    'config': 'agent config',
    'workspace': 'agent workspace',
    'menu': 'dev menu',
    'chat': 'agent chat',
    'exec': 'agent exec'
};
/**
 * Deprecated commands with migration messages
 */
const DEPRECATED_COMMANDS = {
    'old-command': {
        newCommand: 'new-command',
        deprecationVersion: '2.0.0',
        removalVersion: '3.0.0',
        message: 'This command has been deprecated. Please use the new hierarchical structure.',
        /**
         * Create backward compatibility aliases
         */
        function: createBackwardCompatibilityAliases(program, Command), void: {
            console, : .log(chalk.blue('🔄 Setting up backward compatibility aliases...')),
            // Create aliases for legacy commands
            Object, : .entries(LEGACY_COMMAND_MAPPINGS).forEach(([legacyCommand, newCommand]) => {
                createAlias(program, legacyCommand, newCommand);
            }),
            // Create deprecated commands with warnings
            Object, : .entries(DEPRECATED_COMMANDS).forEach(([deprecatedCommand, config]) => {
                createDeprecatedCommand(program, deprecatedCommand, config);
            }),
            console, : .log(chalk.green('✅ Backward compatibility aliases configured'))
        }
        /**
         * Create a single alias command
         */
        ,
        /**
         * Create a single alias command
         */
        function: createAlias(program, Command, aliasName, string, targetCommand, string), void: {
            const: alias = program
                .command(aliasName)
                .description(`Alias for: tnf ${targetCommand})
    .allowUnknownOption(true)
    .action((options, command) => {
      // Show deprecation notice for some aliases
      if (shouldShowDeprecationNotice(aliasName)) {`, console.log(chalk.yellow(`⚠️  Command '${aliasName}`, ' is deprecated. Please use ', tnf, $, { targetCommand }, ' instead.));, console.log(chalk.gray('This alias will be removed in a future version.\n')))))
        }
        // Execute the target command with passed arguments
        ,
        // Execute the target command with passed arguments
        const: args = process.argv.slice(3), // Skip node, script, and alias`
        const: fullCommand = `tnf ${targetCommand}`, $
    }
}, { args, join };
(' ');
;
`
      console.log(chalk.blue(Executing: ${fullCommand}`;
;
// Re-execute with the new command structure
const { spawn } = require('child_process');
const child = spawn('tnf', [targetCommand, ...args], {
    stdio: 'inherit',
    shell: true
});
child.on('exit', (code) => {
    process.exit(code);
});
;
// Copy help from target command if possible
alias.helpOption('-h, --help', 'Show help for this alias');
/**
 * Create a deprecated command with warning
 */
function createDeprecatedCommand(program, commandName, config) {
    const deprecatedCmd = program
        .command(commandName)
        .description(chalk.red([DEPRECATED], $, { config, : .message } `))
    .action(() => {
      console.log(chalk.red.bold(\n❌ Command '${commandName}' is deprecated));`, console.log(chalk.yellow(Deprecated in version, $, { config, : .deprecationVersion } `));
      console.log(chalk.yellow(Will be removed in version: ${config.removalVersion}`))));
    console.log(chalk.blue(nPlease, use, instead, tnf, $, { config, : .newCommand }));
    console.log(chalk.gray('\nFor more information, run: tnf --help\n'));
    process.exit(1);
}
;
/**
 * Check if alias should show deprecation notice
 */
function shouldShowDeprecationNotice(aliasName) {
    // Show deprecation notice for protocol commands
    const protocolCommands = ['claude', 'gemini', 'auggie', 'codex', 'copilot', 'cursor', 'kilo', 'cline'];
    return protocolCommands.includes(aliasName);
}
/**
 * Get migration suggestions for legacy commands
 */
export function getMigrationSuggestions(command) {
    const suggestions = [];
    // Direct mapping
    if (LEGACY_COMMAND_MAPPINGS[command]) {
        `
    suggestions.push(tnf ${LEGACY_COMMAND_MAPPINGS[command]}`;
        ;
    }
    // Partial matches
    Object.entries(LEGACY_COMMAND_MAPPINGS).forEach(([legacy, newCmd]) => {
        if (legacy.includes(command) || command.includes(legacy)) {
            suggestions.push(`tnf ${newCmd});
    }
  });
  
  // Category suggestions
  const categorySuggestions = getCategorySuggestions(command);
  suggestions.push(...categorySuggestions);
  
  return [...new Set(suggestions)]; // Remove duplicates
}

/**
 * Get category-based suggestions
 */
function getCategorySuggestions(command: string): string[] {
  const suggestions = [];
  
  // Development category
  if (['build', 'test', 'lint', 'clean', 'compile'].includes(command)) {
    suggestions.push('tnf dev build', 'tnf dev test', 'tnf dev lint', 'tnf dev clean');
  }
  
  // Runtime category
  if (['start', 'stop', 'restart', 'status', 'logs'].includes(command)) {
    suggestions.push('tnf run start', 'tnf run stop', 'tnf run restart', 'tnf run status', 'tnf run logs');
  }
  
  // Agent category
  if (['agent', 'agents', 'ai', 'bot'].includes(command)) {
    suggestions.push('tnf agent list', 'tnf agent run', 'tnf agent create');
  }
  
  // Workflow category
  if (['workflow', 'pipeline', 'flow'].includes(command)) {
    suggestions.push('tnf workflow list', 'tnf workflow run', 'tnf workflow create');
  }
  
  return suggestions;
}

/**
 * Generate migration guide
 */
export function generateMigrationGuide(): string {
  const guide = [
    chalk.blue.bold('📚 TNF CLI Migration Guide'),
    '',
    chalk.white('The TNF CLI has been restructured with a new hierarchical command system.'),
    chalk.white('This guide helps you migrate from legacy commands to the new structure.'),
    '',
    chalk.blue.bold('🔄 Command Mappings:'),
    ''
  ];
  
  // Group mappings by category
  const categories = {
    'Development': ['build', 'test', 'lint', 'clean'],
    'Runtime': ['start', 'stop', 'restart', 'status', 'logs'],
    'Agents': ['agents', 'ai-agent', 'agent-list', 'agent-run'],
    'Protocols': ['claude', 'gemini', 'auggie', 'codex', 'copilot', 'cursor', 'kilo', 'cline'],
    'Infrastructure': ['node', 'connect', 'terminal', 'federation', 'plan', 'mcp'],
    'Configuration': ['config', 'workspace', 'menu', 'chat', 'exec']
  };
  
  Object.entries(categories).forEach(([category, commands]) => {`, guide.push(chalk.yellow.bold(`${category}`)));
            commands.forEach(cmd => {
                const newCmd = LEGACY_COMMAND_MAPPINGS[cmd];
                if (newCmd) {
                    guide.push($, { cmd }, tnf, $, { newCmd });
                }
            });
            guide.push('');
        }
    });
    guide.push(chalk.blue.bold('📖 New Command Structure:'));
    guide.push('');
    guide.push(chalk.white('tnf <category> <subcommand> [options]'));
    guide.push('');
    guide.push(chalk.yellow('Categories:'));
    guide.push('  dev        - Development operations');
    guide.push('  run        - Runtime operations');
    guide.push('  agent      - Agent management');
    guide.push('  workflow   - Workflow orchestration');
    guide.push('  infra      - Infrastructure management');
    guide.push('  deploy     - Deployment & packaging');
    guide.push('  monitor    - Monitoring & observability');
    guide.push('  security   - Security & access control');
    guide.push('  scale      - Scaling & load balancing');
    guide.push('  ops        - Operational management');
    guide.push('');
    guide.push(chalk.blue.bold('💡 Examples:'));
    guide.push('  tnf dev build --watch');
    guide.push('  tnf agent run claude');
    guide.push('  tnf run status --detailed');
    guide.push('  tnf security audit --report');
    guide.push('  tnf scale auto web-service --cpu 70');
    guide.push('');
    guide.push(chalk.green.bold('✨ All legacy commands will continue to work during the transition period.'));
    guide.push(chalk.gray('For more help, run: tnf --help'));
    return guide.join('\n');
}
/**
 * Check for command conflicts
 */
export function checkCommandConflicts(program) {
    const conflicts = [];
    // Check if any legacy commands conflict with new hierarchical commands
    const newCommands = ['dev', 'run', 'agent', 'workflow', 'infra', 'deploy', 'monitor', 'security', 'scale', 'ops'];
    Object.keys(LEGACY_COMMAND_MAPPINGS).forEach(legacy => {
        if (newCommands.includes(legacy)) {
            conflicts.push({
                legacy,
                type: 'direct_conflict',
            } `
        message: Legacy command '${legacy}`, ' conflicts with new category command);
        }
    });
}
;
if (conflicts.length > 0) {
    console.log(chalk.yellow('⚠️  Command conflicts detected:'));
    conflicts.forEach(conflict => {
        console.log(chalk.red(-$, { conflict, : .message } `));
    });
    console.log(chalk.gray('These will be handled gracefully during the transition.\n'));
  }
}

/**
 * Create interactive migration helper
 */
export function createMigrationHelper(program: Command): void {
  program
    .command('migrate')
    .description('Interactive migration helper for legacy commands')
    .option('--check', 'Check for legacy command usage in scripts')
    .option('--guide', 'Show detailed migration guide')
    .action(async (options) => {
      if (options.guide) {
        console.log(generateMigrationGuide());
        return;
      }
      
      if (options.check) {
        await checkLegacyUsage();
        return;
      }
      
      // Interactive migration helper
      const inquirer = await import('inquirer');
      
      console.log(chalk.blue.bold('🔄 TNF CLI Migration Helper\n'));
      
      const answers = await inquirer.default.prompt([
        {
          type: 'list',
          name: 'action',
          message: 'What would you like to do?',
          choices: [
            { name: 'Show migration guide', value: 'guide' },
            { name: 'Check scripts for legacy commands', value: 'check' },
            { name: 'Get help with specific command', value: 'help' },
            { name: 'Exit', value: 'exit' }
          ]
        }
      ]);
      
      switch (answers.action) {
        case 'guide':
          console.log(generateMigrationGuide());
          break;
        case 'check':
          await checkLegacyUsage();
          break;
        case 'help':
          await getCommandHelp();
          break;
        case 'exit':
          console.log(chalk.green('Happy migrating! 🚀'));
          break;
      }
    });
}

/**
 * Check for legacy command usage in project files
 */
async function checkLegacyUsage(): Promise<void> {
  console.log(chalk.blue('🔍 Checking for legacy command usage...\n'));
  
  const fs = require('fs');
  const path = require('path');
  
  const filesToCheck = [
    'package.json',
    'Makefile',
    'docker-compose.yml',
    '.github/workflows/*.yml',
    '*.sh',
    '*.md'
  ];
  
  let foundIssues = 0;
  
  filesToCheck.forEach(pattern => {
    try {
      const glob = require('glob');
      const files = glob.sync(pattern);
      
      files.forEach((file: string) => {
        try {
          const content = fs.readFileSync(file, 'utf8');
          
          Object.keys(LEGACY_COMMAND_MAPPINGS).forEach(legacyCmd => {
            if (content.includes(legacyCmd)) {
              console.log(chalk.yellow(⚠️  Found legacy command '${legacyCmd}' in ${file}));`, console.log(chalk.gray(Suggestion, Use, 'tnf ${LEGACY_COMMAND_MAPPINGS[legacyCmd]}`', instead, n))));
        foundIssues++;
    });
}
;
try { }
catch (error) {
    // Ignore file read errors
}
;
try { }
catch (error) {
    // Ignore glob errors
}
;
if (foundIssues === 0) {
    console.log(chalk.green('✅ No legacy command usage found in project files'));
}
else {
    console.log(chalk.yellow(Found, $, { foundIssues }, instance(s), of, legacy, command, usage));
    console.log(chalk.blue('Consider updating these to use the new hierarchical structure'));
}
/**
 * Interactive help for specific command migration
 */
async function getCommandHelp() {
    const inquirer = await import('inquirer');
    const answers = await inquirer.default.prompt([
        {
            type: 'input',
            name: 'command',
            message: 'Enter the legacy command you need help with:',
            validate: (input) => input.trim() !== '' || 'Please enter a command'
        }
    ]);
    const suggestions = getMigrationSuggestions(answers.command);
    `
  `;
    if (suggestions.length > 0) {
        console.log(chalk.blue.bold(n, Suggestions));
        for ('${answers.command}`'; ; )
            : ;
        n;
        ;
        suggestions.forEach((suggestion, index) => {
            console.log(chalk.white($, { index } + 1));
        }, $, { suggestion } `));
    });
  } else {
    console.log(chalk.yellow(\n❌ No direct migration found for '${answers.command}'`);
        ;
        console.log(chalk.blue('Try using one of the new categories:'));
        console.log(chalk.gray('  tnf dev, tnf run, tnf agent, tnf workflow, etc.'));
    }
    console.log();
}
//# sourceMappingURL=aliases.js.map