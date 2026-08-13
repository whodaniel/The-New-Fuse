/**
 * packages/tnf-cli/src/commands/_registry.ts
 *
 * Collision-safe Commander registration helpers.
 *
 * cli.ts registers ~100 top-level commands inline, and `src/commands/*.ts`
 * modules register more at the bottom of the file. Commander throws on a
 * duplicate name, and because that throw happens at module load it takes down
 * *every* invocation of the CLI — including the unattended ones. A single
 * duplicate `doctor` registration silently disabled `tnf full-auto` for five
 * days (see docs/operations/tnf-full-auto-daemon.log).
 *
 * Modules should never assume a name is free. Use these helpers instead of
 * calling `program.command(name)` directly.
 */

import type { Command } from 'commander';

/** Find an already-registered subcommand by name or alias. */
export function findCommand(parent: Command, name: string): Command | undefined {
  return parent.commands.find((c) => c.name() === name || (c.aliases?.() ?? []).includes(name));
}

/**
 * Return the existing command with this name, or create it.
 *
 * Use for *group* commands that several modules may want to hang
 * subcommands off (`agents`, `config`, `doctor`).
 */
export function getOrCreateCommand(parent: Command, name: string, description?: string): Command {
  const existing = findCommand(parent, name);
  if (existing) return existing;
  const created = parent.command(name);
  if (description) created.description(description);
  return created;
}

/**
 * Register `name` under `parent`. If `name` is taken, register `fallback`
 * underneath the existing command instead and return that.
 *
 * This is the pattern for a module that wants to own a top-level verb but
 * must yield to an incumbent — e.g. the Hermes-parity `config` view yielding
 * to the kilo-parity `config` group and landing as `config resolved`.
 */
export function registerOrNest(
  parent: Command,
  name: string,
  fallback: string
): { command: Command; nested: boolean } {
  const incumbent = findCommand(parent, name);
  if (!incumbent) return { command: parent.command(name), nested: false };
  if (findCommand(incumbent, fallback)) {
    throw new Error(
      `Cannot register '${name} ${fallback}': both the parent and the nested name are already taken.`
    );
  }
  return { command: incumbent.command(fallback), nested: true };
}

/**
 * Assert that no two sibling commands share a name or alias.
 *
 * Called once from cli.ts after every registration completes, so a future
 * collision surfaces as a precise, actionable message at startup instead of
 * Commander's bare "cannot add command 'x'".
 */
export function assertNoDuplicateCommands(program: Command): void {
  const problems: string[] = [];

  const walk = (cmd: Command, trail: string): void => {
    const seen = new Map<string, string>();
    for (const child of cmd.commands) {
      const names = [child.name(), ...(child.aliases?.() ?? [])];
      for (const n of names) {
        const previous = seen.get(n);
        if (previous) {
          problems.push(`${trail}: '${n}' registered by both '${previous}' and '${child.name()}'`);
        } else {
          seen.set(n, child.name());
        }
      }
      walk(child, `${trail} ${child.name()}`.trim());
    }
  };

  walk(program, program.name());

  if (problems.length > 0) {
    throw new Error(`Duplicate command registrations detected:\n  - ${problems.join('\n  - ')}`);
  }
}
