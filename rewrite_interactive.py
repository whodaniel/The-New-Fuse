import re

with open('packages/tnf-cli/src/cli.ts', 'r') as f:
    content = f.read()

old_func = """async function handleInteractiveSlashCommand(
  input: string,
  context: InteractiveSlashContext
): Promise<SlashCommandOutcome> {
  const parsed = parseSlashCommand(input);
  if (!parsed) return { handled: false };

  // Multi-token input that names a real CLI path dispatches straight to it.
  //
  // This is what makes the flat palette honest: choosing `agents register`
  // has to RUN `tnf agents register`, not fall through to the curated
  // `/agents` entry (hard-coded to `agents list`) and silently do something
  // else. Single-token input is left to the curated table on purpose, so
  // `/agents` keeps its useful default and `/skills` keeps its bank status.
  if (parsed.args.length > 0) {
    const resolved = resolveCliPath([parsed.name, ...parsed.args]);
    if (resolved && resolved.argv.length > 1) {
      await runTnfCliEntrypoint([...resolved.argv, ...resolved.rest]);
      return { handled: true };
    }
  }

  const command = findSlashCommand(parsed.name, invocationCwd);
  if (!command) {
    const suggestions = rankPalette(getPaletteIndex(invocationCwd), `/${parsed.rawName}`, 5);
    console.log(chalk.red(`  Unknown slash command: /${parsed.rawName}`));
    if (suggestions.length > 0) {
      console.log(chalk.dim('  Did you mean:'));
      for (const { entry } of suggestions) {
        console.log(
          `    ${chalk.cyan(paletteEntryToLine(entry).padEnd(34))} ${chalk.dim(entry.badge.padStart(14))}  ${chalk.dim(entry.description)}`
        );
      }
    }
    console.log(chalk.dim('  Press / and type to search every command, or run /help.'));
    return { handled: true };
  }

  if (command.name === 'help') {
    const target = parsed.args[0];
    if (!target) {
      printSlashCommandList();
      return { handled: true };
    }
    const detail = findSlashCommand(target, invocationCwd);
    if (!detail) {
      console.log(chalk.red(`  Unknown slash command: /${target}`));
      return { handled: true };
    }
    printSlashCommandDetail(detail);
    return { handled: true };
  }

  if (command.name === 'commands') {
    printSlashCommandList();
    return { handled: true };
  }

  if (command.name === 'exit' || command.aliases?.includes('quit')) {
    return { handled: true, exit: true };
  }

  if (command.name === 'clear' || command.name === 'compact') {
    context.messages.length = context.systemMessageCount;
    console.log(
      chalk.dim(`  ${command.name === 'compact' ? 'Transcript compacted' : 'History cleared'}`)
    );
    return { handled: true };
  }

  if (command.name === 'cost') {
    printSessionCost(context);
    return { handled: true };
  }

  if (command.name === 'status') {
    printTuiStatus(context);
    return { handled: true };
  }

  if (command.name === 'model') {
    const modelName = parsed.args.join(' ').trim();
    if (!modelName) {
      console.log(chalk.dim(`  Provider: ${context.client?.providerName || 'unknown'}`));
      console.log(chalk.dim(`  Model: ${context.client?.model || 'unknown'}`));
      if (context.client?.baseUrl) console.log(chalk.dim(`  Base URL: ${context.client.baseUrl}`));
      return { handled: true };
    }
    setInteractiveModel(context.client, modelName);
    return { handled: true };
  }

  if (command.name === 'focus' || command.aliases?.includes('whoami-focus')) {
    handleAgentFocusSlash(parsed.args);
    return { handled: true };
  }

  if (command.name === 'exec') {
    const script = parsed.args.join(' ').trim();
    if (!script) {
      console.log(chalk.red('  Usage: /exec <command>'));
      return { handled: true };
    }
    const result = await executeInteractiveBash(script);
    if (result.ok) {
      console.log(chalk.green('  ✓ command succeeded'));
    } else {
      console.log(chalk.red(`  ✗ command failed (exit ${result.code})`));
    }
    return { handled: true };
  }

  if (command.name === 'autonomous' || command.aliases?.includes('auto')) {
    const toggle = resolveAutonomousModeToggle(parsed.args);
    if (toggle === null && parsed.args.length > 0) {
      console.log(chalk.red('  Usage: /autonomous [on|off]'));
      return { handled: true };
    }
    const wantsOn = toggle === null ? !context.autonomousMode : toggle;
    // A session launched under a read-only permission mode cannot talk itself
    // back into shell access; the operator must relaunch with wider
    // permissions. Otherwise --permission-mode would be advisory, which is
    // exactly the failure this replaced.
    if (wantsOn && context.permissions && !context.permissions.mutationsAllowed) {
      console.log(
        chalk.yellow(
          `  Refused: this session runs under --permission-mode ${context.permissions.mode} (${context.permissions.summary}).`
        )
      );
      console.log(
        chalk.dim('  Relaunch with a permission mode that allows shell to enable autonomy.')
      );
      return { handled: true };
    }
    context.autonomousMode = wantsOn;
    console.log(
      `  Autonomous shell execution: ${context.autonomousMode ? chalk.green('ON') : chalk.yellow('OFF')}`
    );
    if (context.autonomousState) {
      const { turnsThisSession, maxTurnsPerSession, capCeiling } = context.autonomousState;
      console.log(
        chalk.dim(
          `  Turn budget: ${turnsThisSession}/${maxTurnsPerSession} (soft warn @ ${Math.ceil(maxTurnsPerSession * autonomousTurnCapConfig.softRatio)}; ceiling ${capCeiling}; LONG_RUN may emit TNF_EXTEND_TURN_CAP=<n>)`
        )
      );
    }
    if (context.autonomousMode) {
      enableAutonomousRuntimeDefaults();
      if (context.autonomousState) {
        context.autonomousState.operatorHold = false;
        context.autonomousState.continuePending = true;
      }
    } else if (context.autonomousState) {
      context.autonomousState.continuePending = false;
    }
    return { handled: true };
  }

  if (command.name === 'window' || command.aliases?.includes('operator-window')) {
    const arg = parsed.args.join(' ').trim();
    if (!arg) {
      const current = resolveOperatorWindowMs();
      console.log(
        chalk.cyan(
          `  Operator window: ${Math.round(current / 1000)}s (${current}ms). Default ${Math.round(DEFAULT_OPERATOR_WINDOW_MS / 1000)}s.`
        )
      );
      console.log(
        chalk.dim('  Usage: /window <seconds|30s|8000ms>  ·  persists to ~/.tnf/tui-mode.json')
      );
      return { handled: true };
    }
    const parsedMs = parseOperatorWindowArg(arg);
    if (parsedMs === null) {
      console.log(chalk.red('  Usage: /window <seconds|30s|8000ms>'));
      return { handled: true };
    }
    const saved = persistOperatorWindowMs(parsedMs);
    process.env.TNF_OPERATOR_WINDOW_MS = String(saved);
    console.log(
      chalk.green(
        `  Operator window set to ${Math.round(saved / 1000)}s (${saved}ms) — persisted for next launch`
      )
    );
    return { handled: true };
  }

  if (command.name === 'hold' || command.aliases?.includes('pause-auto')) {
    if (context.autonomousState) {
      context.autonomousState.operatorHold = true;
      context.autonomousState.continuePending = false;
    }
    console.log(
      chalk.yellow(
        '  ⏸ Autonomous continue HOLD — type freely. /continue or /autonomous on to resume.'
      )
    );
    return { handled: true };
  }

  if (command.name === 'continue' || command.aliases?.includes('resume-auto')) {
    if (context.autonomousState) {
      context.autonomousState.operatorHold = false;
      context.autonomousState.continuePending = true;
    }
    context.autonomousMode = true;
    enableAutonomousRuntimeDefaults();
    console.log(chalk.green('  ⟳ Autonomous continue resumed'));
    return { handled: true };
  }

  if (command.mode === 'cli') {
    await runSlashCliCommand(command, parsed.args);
    return { handled: true };
  }

  if (command.mode === 'prompt') {
    return { handled: true, prompt: formatPromptSlashCommand(command, parsed.args) };
  }

  printSlashCommandDetail(command);
  return { handled: true };
}"""

new_func = """async function handleInteractiveSlashCommand(
  input: string,
  context: InteractiveSlashContext
): Promise<SlashCommandOutcome> {
  const parsedCommands = parseSlashCommands(input);
  if (parsedCommands.length === 0) return { handled: false };

  let combinedPrompt = '';
  let handled = false;
  let exit = false;

  for (const parsed of parsedCommands) {
    if (parsed.args.length > 0) {
      const resolved = resolveCliPath([parsed.name, ...parsed.args]);
      if (resolved && resolved.argv.length > 1) {
        await runTnfCliEntrypoint([...resolved.argv, ...resolved.rest]);
        handled = true;
        continue;
      }
    }

    const command = findSlashCommand(parsed.name, invocationCwd);
    if (!command) {
      const suggestions = rankPalette(getPaletteIndex(invocationCwd), `/${parsed.rawName}`, 5);
      console.log(chalk.red(`  Unknown slash command: /${parsed.rawName}`));
      if (suggestions.length > 0) {
        console.log(chalk.dim('  Did you mean:'));
        for (const { entry } of suggestions) {
          console.log(
            `    ${chalk.cyan(paletteEntryToLine(entry).padEnd(34))} ${chalk.dim(entry.badge.padStart(14))}  ${chalk.dim(entry.description)}`
          );
        }
      }
      console.log(chalk.dim('  Press / and type to search every command, or run /help.'));
      handled = true;
      continue;
    }

    if (command.name === 'help') {
      const target = parsed.args[0];
      if (!target) {
        printSlashCommandList();
        handled = true;
        continue;
      }
      const detail = findSlashCommand(target, invocationCwd);
      if (!detail) {
        console.log(chalk.red(`  Unknown slash command: /${target}`));
        handled = true;
        continue;
      }
      printSlashCommandDetail(detail);
      handled = true;
      continue;
    }

    if (command.name === 'commands') {
      printSlashCommandList();
      handled = true;
      continue;
    }

    if (command.name === 'exit' || command.aliases?.includes('quit')) {
      handled = true;
      exit = true;
      continue;
    }

    if (command.name === 'clear' || command.name === 'compact') {
      context.messages.length = context.systemMessageCount;
      console.log(
        chalk.dim(`  ${command.name === 'compact' ? 'Transcript compacted' : 'History cleared'}`)
      );
      handled = true;
      continue;
    }

    if (command.name === 'cost') {
      printSessionCost(context);
      handled = true;
      continue;
    }

    if (command.name === 'status') {
      printTuiStatus(context);
      handled = true;
      continue;
    }

    if (command.name === 'model') {
      const modelName = parsed.args.join(' ').trim();
      if (!modelName) {
        console.log(chalk.dim(`  Provider: ${context.client?.providerName || 'unknown'}`));
        console.log(chalk.dim(`  Model: ${context.client?.model || 'unknown'}`));
        if (context.client?.baseUrl) console.log(chalk.dim(`  Base URL: ${context.client.baseUrl}`));
        handled = true;
        continue;
      }
      setInteractiveModel(context.client, modelName);
      handled = true;
      continue;
    }

    if (command.name === 'focus' || command.aliases?.includes('whoami-focus')) {
      handleAgentFocusSlash(parsed.args);
      handled = true;
      continue;
    }

    if (command.name === 'exec') {
      const script = parsed.args.join(' ').trim();
      if (!script) {
        console.log(chalk.red('  Usage: /exec <command>'));
        handled = true;
        continue;
      }
      const result = await executeInteractiveBash(script);
      if (result.ok) {
        console.log(chalk.green('  ✓ command succeeded'));
      } else {
        console.log(chalk.red(`  ✗ command failed (exit ${result.code})`));
      }
      handled = true;
      continue;
    }

    if (command.name === 'autonomous' || command.aliases?.includes('auto')) {
      const toggle = resolveAutonomousModeToggle(parsed.args);
      if (toggle === null && parsed.args.length > 0) {
        console.log(chalk.red('  Usage: /autonomous [on|off]'));
        handled = true;
        continue;
      }
      const wantsOn = toggle === null ? !context.autonomousMode : toggle;
      if (wantsOn && context.permissions && !context.permissions.mutationsAllowed) {
        console.log(
          chalk.yellow(
            `  Refused: this session runs under --permission-mode ${context.permissions.mode} (${context.permissions.summary}).`
          )
        );
        console.log(
          chalk.dim('  Relaunch with a permission mode that allows shell to enable autonomy.')
        );
        handled = true;
        continue;
      }
      context.autonomousMode = wantsOn;
      console.log(
        `  Autonomous shell execution: ${context.autonomousMode ? chalk.green('ON') : chalk.yellow('OFF')}`
      );
      if (context.autonomousState) {
        const { turnsThisSession, maxTurnsPerSession, capCeiling } = context.autonomousState;
        console.log(
          chalk.dim(
            `  Turn budget: ${turnsThisSession}/${maxTurnsPerSession} (soft warn @ ${Math.ceil(maxTurnsPerSession * autonomousTurnCapConfig.softRatio)}; ceiling ${capCeiling}; LONG_RUN may emit TNF_EXTEND_TURN_CAP=<n>)`
          )
        );
      }
      if (context.autonomousMode) {
        enableAutonomousRuntimeDefaults();
        if (context.autonomousState) {
          context.autonomousState.operatorHold = false;
          context.autonomousState.continuePending = true;
        }
      } else if (context.autonomousState) {
        context.autonomousState.continuePending = false;
      }
      handled = true;
      continue;
    }

    if (command.name === 'window' || command.aliases?.includes('operator-window')) {
      const arg = parsed.args.join(' ').trim();
      if (!arg) {
        const current = resolveOperatorWindowMs();
        console.log(
          chalk.cyan(
            `  Operator window: ${Math.round(current / 1000)}s (${current}ms). Default ${Math.round(DEFAULT_OPERATOR_WINDOW_MS / 1000)}s.`
          )
        );
        console.log(
          chalk.dim('  Usage: /window <seconds|30s|8000ms>  ·  persists to ~/.tnf/tui-mode.json')
        );
        handled = true;
        continue;
      }
      const parsedMs = parseOperatorWindowArg(arg);
      if (parsedMs === null) {
        console.log(chalk.red('  Usage: /window <seconds|30s|8000ms>'));
        handled = true;
        continue;
      }
      const saved = persistOperatorWindowMs(parsedMs);
      process.env.TNF_OPERATOR_WINDOW_MS = String(saved);
      console.log(
        chalk.green(
          `  Operator window set to ${Math.round(saved / 1000)}s (${saved}ms) — persisted for next launch`
        )
      );
      handled = true;
      continue;
    }

    if (command.name === 'hold' || command.aliases?.includes('pause-auto')) {
      if (context.autonomousState) {
        context.autonomousState.operatorHold = true;
        context.autonomousState.continuePending = false;
      }
      console.log(
        chalk.yellow(
          '  ⏸ Autonomous continue HOLD — type freely. /continue or /autonomous on to resume.'
        )
      );
      handled = true;
      continue;
    }

    if (command.name === 'continue' || command.aliases?.includes('resume-auto')) {
      if (context.autonomousState) {
        context.autonomousState.operatorHold = false;
        context.autonomousState.continuePending = true;
      }
      context.autonomousMode = true;
      enableAutonomousRuntimeDefaults();
      console.log(chalk.green('  ⟳ Autonomous continue resumed'));
      handled = true;
      continue;
    }

    if (command.mode === 'cli') {
      await runSlashCliCommand(command, parsed.args);
      handled = true;
      continue;
    }

    if (command.mode === 'prompt') {
      const p = formatPromptSlashCommand(command, parsed.args);
      if (combinedPrompt) {
        combinedPrompt += '\\n\\n---\\n\\n' + p;
      } else {
        combinedPrompt = p;
      }
      handled = true;
      continue;
    }

    printSlashCommandDetail(command);
    handled = true;
  }

  return { handled, exit, prompt: combinedPrompt || undefined };
}"""

if old_func in content:
    content = content.replace(old_func, new_func)
    with open('packages/tnf-cli/src/cli.ts', 'w') as f:
        f.write(content)
    print("Success interactive")
else:
    print("Failed to find old interactive function")
