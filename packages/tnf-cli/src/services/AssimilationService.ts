import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

type AssimilationRoutes = {
  providers: Record<
    string,
    {
      linkedAt: string;
      binary?: string;
      harnessSkill?: string;
      mcpConfig?: string;
      onboardScript?: string;
    }
  >;
};

export class AssimilationService {
  private routesPath: string;

  constructor(private repoRoot: string) {
    this.routesPath = path.join(repoRoot, '.agent', 'assimilation-routes.json');
  }

  private readRoutes(): AssimilationRoutes {
    if (!fs.existsSync(this.routesPath)) {
      return { providers: {} };
    }
    try {
      const parsed = JSON.parse(fs.readFileSync(this.routesPath, 'utf8')) as AssimilationRoutes;
      return parsed?.providers ? parsed : { providers: {} };
    } catch {
      return { providers: {} };
    }
  }

  private writeRoutes(routes: AssimilationRoutes): void {
    fs.mkdirSync(path.dirname(this.routesPath), { recursive: true });
    fs.writeFileSync(this.routesPath, `${JSON.stringify(routes, null, 2)}\n`, 'utf8');
  }

  private buildPassthroughEnv(provider: string): Record<string, string> {
    const env: Record<string, string> = {};
    const routes = this.readRoutes();
    const route = routes.providers[provider];
    const mcpRelative = route?.mcpConfig ?? `data/mcp.clients/${provider}.mcp.json`;
    const mcpConfigPath = path.join(this.repoRoot, mcpRelative);
    if (fs.existsSync(mcpConfigPath)) {
      env.TNF_MCP_CONFIG_PATH = mcpConfigPath;
      env.MCP_CONFIG_PATH = mcpConfigPath;
    }
    return env;
  }

  /**
   * Run a command through an external agent CLI, forcing it to
   * conform to TNF protocols natively.
   */
  public async runAssimilatedCommand(provider: string, args: string[]): Promise<void> {
    console.log(
      chalk.cyan(`[Assimilation Engine] Routing command through external provider: ${provider}`)
    );

    const routes = this.readRoutes();
    const route = routes.providers[provider];
    const binary = route?.binary || provider;

    return new Promise((resolve, reject) => {
      const child = spawn(binary, args, {
        stdio: 'inherit',
        cwd: this.repoRoot,
        env: { ...process.env, ...this.buildPassthroughEnv(provider) },
      });

      child.on('error', (err: NodeJS.ErrnoException) => {
        if (err.code === 'ENOENT') {
          reject(new Error(`Provider '${provider}' not found. Is it installed?`));
        } else {
          reject(err);
        }
      });

      child.on('close', (code) => {
        if (code === 0) {
          console.log(chalk.green(`[Assimilation Engine] ${provider} execution complete.`));
          resolve();
        } else {
          reject(new Error(`Provider '${provider}' exited with code ${code}`));
        }
      });
    });
  }

  /**
   * Register a new external CLI mapping into the assimilation routing table.
   */
  public async linkProvider(provider: string): Promise<void> {
    const normalized = provider.trim().toLowerCase();
    if (!normalized) {
      throw new Error('Provider name is required.');
    }

    if (normalized === 'cursor') {
      await this.runOnboardScript('scripts/cursor/tnf-cursor-harness-onboard.cjs');
      console.log(chalk.green(`[Assimilation Engine] Linked external provider: ${normalized}`));
      return;
    }

    const routes = this.readRoutes();
    routes.providers[normalized] = {
      linkedAt: new Date().toISOString(),
      binary: normalized,
      mcpConfig: `data/mcp.clients/${normalized}.mcp.json`,
    };
    this.writeRoutes(routes);
    console.log(chalk.green(`[Assimilation Engine] Linked external provider: ${normalized}`));
  }

  private async runOnboardScript(scriptRelativePath: string): Promise<void> {
    const scriptPath = path.join(this.repoRoot, scriptRelativePath);
    if (!fs.existsSync(scriptPath)) {
      throw new Error(`Missing onboard script: ${scriptRelativePath}`);
    }

    return new Promise((resolve, reject) => {
      const child = spawn('node', [scriptPath], {
        stdio: 'inherit',
        cwd: this.repoRoot,
      });

      child.on('error', reject);
      child.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`Onboard script exited with code ${code}`));
      });
    });
  }
}
