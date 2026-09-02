import re

with open('packages/tnf-cli/src/cli.ts', 'r') as f:
    content = f.read()

# We need to find `async function handleOneShotSlashInput` to the end of it.
# The function ends around line 5202.
# Instead of a complex regex, we can replace the entire function body since we know what it looks like.

old_func = """async function handleOneShotSlashInput(input: string): Promise<boolean> {
  const parsed = parseSlashCommand(input);
  if (!parsed) return false;

  // Same rule as the interactive path: `tnf "/agents register alice worker"`
  // must reach the real command, not the curated single-token entry.
  if (parsed.args.length > 0) {
    const resolved = resolveCliPath([parsed.name, ...parsed.args]);
    if (resolved && resolved.argv.length > 1) {
      await runTnfCliEntrypoint([...resolved.argv, ...resolved.rest]);
      return true;
    }
  }

  const command = findSlashCommand(parsed.name, invocationCwd);
  if (!command) {
    console.error(chalk.red(`Unknown slash command: /${parsed.rawName}`));
    // Same near-miss list the interactive path shows. A typo should cost one
    // glance, not a trip through `tnf --help`.
    const suggestions = rankPalette(getPaletteIndex(invocationCwd), `/${parsed.rawName}`, 5);
    if (suggestions.length > 0) {
      console.error(chalk.dim('Did you mean:'));
      for (const { entry } of suggestions) {
        console.error(
          `  ${chalk.cyan(paletteEntryToLine(entry).padEnd(34))} ${chalk.dim(entry.badge.padStart(14))}  ${chalk.dim(entry.description)}`
        );
      }
    }
    console.error(
      chalk.dim('Run `tnf /help`, `tnf slash list`, or `tnf commands <text>` to search everything.')
    );
    process.exitCode = 1;
    return true;
  }

  if (command.name === 'help') {
    const target = parsed.args[0];
    if (!target) {
      printSlashCommandList();
      return true;
    }
    const detail = findSlashCommand(target, invocationCwd);
    if (!detail) {
      console.error(chalk.red(`Unknown slash command: /${target}`));
      process.exitCode = 1;
      return true;
    }
    printSlashCommandDetail(detail);
    return true;
  }

  if (command.name === 'commands') {
    printSlashCommandList();
    return true;
  }

  if (command.name === 'exit' || command.aliases?.includes('quit')) {
    return true;
  }

  if (command.name === 'clear' || command.name === 'compact') {
    console.log(chalk.dim(`/${command.name} only affects an active TNF chat/TUI transcript.`));
    return true;
  }

  if (command.name === 'cost') {
    console.log(chalk.bold('\\nCost\\n'));
    console.log(chalk.dim('  No active chat transcript in one-shot CLI mode.'));
    console.log(
      chalk.dim('  Run /cost inside `tnf tui` or `tnf ai chat` for session estimates.\\n')
    );
    return true;
  }

  if (command.name === 'model') {
    const modelName = parsed.args.join(' ').trim();
    if (!modelName) {
      await showCurrentModel();
      return true;
    }
    await runTnfCliEntrypoint(['config', 'set', 'model', modelName]);
    console.log(chalk.green(`Persisted TNF model preference: ${modelName}`));
    return true;
  }

  if (command.name === 'focus' || command.aliases?.includes('whoami-focus')) {
    handleAgentFocusSlash(parsed.args);
    return true;
  }

  if (command.mode === 'cli') {
    await runSlashCliCommand(command, parsed.args);
    return true;
  }

  if (command.mode === 'prompt') {
    console.log(formatPromptSlashCommand(command, parsed.args));
    return true;
  }

  printSlashCommandDetail(command);
  return true;
}"""

new_func = """async function handleOneShotSlashInput(input: string): Promise<boolean> {
  const parsedCommands = parseSlashCommands(input);
  if (parsedCommands.length === 0) return false;

  for (const parsed of parsedCommands) {
    if (parsed.args.length > 0) {
      const resolved = resolveCliPath([parsed.name, ...parsed.args]);
      if (resolved && resolved.argv.length > 1) {
        await runTnfCliEntrypoint([...resolved.argv, ...resolved.rest]);
        continue;
      }
    }

    const command = findSlashCommand(parsed.name, invocationCwd);
    if (!command) {
      console.error(chalk.red(`Unknown slash command: /${parsed.rawName}`));
      const suggestions = rankPalette(getPaletteIndex(invocationCwd), `/${parsed.rawName}`, 5);
      if (suggestions.length > 0) {
        console.error(chalk.dim('Did you mean:'));
        for (const { entry } of suggestions) {
          console.error(
            `  ${chalk.cyan(paletteEntryToLine(entry).padEnd(34))} ${chalk.dim(entry.badge.padStart(14))}  ${chalk.dim(entry.description)}`
          );
        }
      }
      console.error(
        chalk.dim('Run `tnf /help`, `tnf slash list`, or `tnf commands <text>` to search everything.')
      );
      process.exitCode = 1;
      continue;
    }

    if (command.name === 'help') {
      const target = parsed.args[0];
      if (!target) {
        printSlashCommandList();
        continue;
      }
      const detail = findSlashCommand(target, invocationCwd);
      if (!detail) {
        console.error(chalk.red(`Unknown slash command: /${target}`));
        process.exitCode = 1;
        continue;
      }
      printSlashCommandDetail(detail);
      continue;
    }

    if (command.name === 'commands') {
      printSlashCommandList();
      continue;
    }

    if (command.name === 'exit' || command.aliases?.includes('quit')) {
      continue;
    }

    if (command.name === 'clear' || command.name === 'compact') {
      console.log(chalk.dim(`/${command.name} only affects an active TNF chat/TUI transcript.`));
      continue;
    }

    if (command.name === 'cost') {
      console.log(chalk.bold('\\nCost\\n'));
      console.log(chalk.dim('  No active chat transcript in one-shot CLI mode.'));
      console.log(
        chalk.dim('  Run /cost inside `tnf tui` or `tnf ai chat` for session estimates.\\n')
      );
      continue;
    }

    if (command.name === 'model') {
      const modelName = parsed.args.join(' ').trim();
      if (!modelName) {
        await showCurrentModel();
        continue;
      }
      await runTnfCliEntrypoint(['config', 'set', 'model', modelName]);
      console.log(chalk.green(`Persisted TNF model preference: ${modelName}`));
      continue;
    }

    if (command.name === 'focus' || command.aliases?.includes('whoami-focus')) {
      handleAgentFocusSlash(parsed.args);
      continue;
    }

    if (command.mode === 'cli') {
      await runSlashCliCommand(command, parsed.args);
      continue;
    }

    if (command.mode === 'prompt') {
      console.log(formatPromptSlashCommand(command, parsed.args));
      continue;
    }

    printSlashCommandDetail(command);
  }
  return true;
}"""

if old_func in content:
    content = content.replace(old_func, new_func)
    with open('packages/tnf-cli/src/cli.ts', 'w') as f:
        f.write(content)
    print("Success oneshot")
else:
    print("Failed to find old oneshot function")
