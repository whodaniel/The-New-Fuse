import chalk from 'chalk';
import { spawn, spawnSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

type LinkReceipt = {
  spec: 'tnf/assimilation-link/0.1';
  observedAt: string;
  provider: string;
  executable: string;
  providerPolicyHostPin: boolean;
  resourceFabricHostProfile: boolean;
  authorities: string[];
  note: string;
};

export class AssimilationService {
  constructor(private repoRoot: string) {}

  /** Run an external agent CLI under current TNF protocol authority. */
  public async runAssimilatedCommand(
    provider: string,
    args: string[],
    options: { skipProtocolGate?: boolean } = {}
  ): Promise<void> {
    const providerId = this.normalizeProvider(provider);
    console.log(
      chalk.cyan(`[Assimilation Engine] Routing command through external provider: ${providerId}`)
    );

    this.assertProviderAvailable(providerId);
    if (!options.skipProtocolGate) this.runProtocolGate(providerId);

    return new Promise((resolve, reject) => {
      const child = spawn(providerId, args, {
        stdio: 'inherit',
        cwd: this.repoRoot,
        env: {
          ...process.env,
          TNF_HARNESS_ROOT: this.repoRoot,
          TNF_PROTOCOL_ACK: 'TNF_PROTOCOL_ACK',
          TNF_TURN_ZERO_CANONICAL: path.join(
            this.repoRoot,
            'docs/protocols/TURN_ZERO_MANDATE.md'
          ),
        },
      });

      child.on('error', (err: any) => {
        if (err.code === 'ENOENT') {
          reject(new Error(`Provider '${providerId}' not found. Is it installed?`));
        } else {
          reject(err);
        }
      });

      child.on('close', (code) => {
        if (code === 0) {
          console.log(chalk.green(`[Assimilation Engine] ${providerId} execution complete.`));
          this.writeRuntimeReceipt('run', providerId, {
            protocolGate: options.skipProtocolGate ? 'skipped' : 'passed',
            attribution: 'tnf-native',
          });
          resolve();
        } else {
          reject(new Error(`Provider '${providerId}' exited with code ${code}`));
        }
      });
    });
  }

  private normalizeProvider(provider: string): string {
    const value = String(provider || '').trim();
    if (!/^[A-Za-z0-9._+-]+$/.test(value)) {
      throw new Error(`Invalid provider executable name: ${provider}`);
    }
    return value;
  }

  private providerExecutable(provider: string): string {
    const result = spawnSync('command', ['-v', provider], {
      shell: true,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    if (result.status !== 0) {
      throw new Error(`Provider '${provider}' not found on PATH. Link or install it before routing.`);
    }
    return String(result.stdout || '').trim() || provider;
  }

  private assertProviderAvailable(provider: string): void {
    this.providerExecutable(provider);
  }

  private runProtocolGate(provider: string): void {
    const gate = path.join(this.repoRoot, 'scripts/protocols/turn-zero-v2-gate.cjs');
    if (!fs.existsSync(gate)) {
      throw new Error(`Canonical Turn Zero gate missing before assimilating ${provider}: ${gate}`);
    }
    const result = spawnSync(
      process.execPath,
      [
        gate,
        '--consumer',
        `assimilation:${provider}`,
        '--task',
        `assimilate external provider ${provider}`,
      ],
      {
        cwd: this.repoRoot,
        stdio: 'inherit',
        env: process.env,
      }
    );
    if (result.status !== 0) {
      throw new Error(`Turn Zero V2 gate failed before assimilating ${provider}`);
    }
  }

  /**
   * Verify a provider against existing TNF authorities and persist only a
   * machine-local proof receipt. This deliberately does NOT create a second
   * canonical routing registry.
   */
  public linkProvider(provider: string): LinkReceipt {
    const providerId = this.normalizeProvider(provider);
    const executable = this.providerExecutable(providerId);
    const providerPolicy = this.readJson(
      path.join(this.repoRoot, 'data/harness/provider-failover-policy.json')
    );
    const resourceFabric = this.readJson(
      path.join(this.repoRoot, 'data/harness/agent-resource-fabric.json')
    );
    const providerKey = providerId.toLowerCase();
    const policyMatch = Boolean(providerPolicy?.hostPins?.[providerKey]);
    const resourceMatch = Boolean(
      resourceFabric?.hosts?.some((host: { id?: string }) =>
        [host.id, host.id?.replace(/-cli$/, '')]
          .filter(Boolean)
          .map((value) => String(value).toLowerCase())
          .includes(providerKey)
      )
    );
    const receipt: LinkReceipt = {
      spec: 'tnf/assimilation-link/0.1',
      observedAt: new Date().toISOString(),
      provider: providerId,
      executable,
      providerPolicyHostPin: policyMatch,
      resourceFabricHostProfile: resourceMatch,
      authorities: [
        'data/harness/provider-failover-policy.json',
        'data/harness/agent-resource-fabric.json',
        'scripts/install-agent-frontload.cjs',
      ],
      note:
        'This is a machine-local proof receipt. Canonical provider/host/resource authority remains in existing TNF registries; no assimilation-routes registry is created.',
    };
    this.writeLinkReceipt(receipt);
    console.log(
      chalk.green(
        `[Assimilation Engine] Verified external provider ${providerId} (provider policy: ${policyMatch ? 'mapped' : 'unmapped'}; resource host: ${resourceMatch ? 'mapped' : 'unmapped'}).`
      )
    );
    return receipt;
  }

  private readJson(file: string): any {
    try {
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch {
      return null;
    }
  }

  private assimilationRoot(): string {
    return path.join(os.homedir(), '.tnf', 'assimilation');
  }

  private writeLinkReceipt(receipt: LinkReceipt): void {
    const dir = path.join(this.assimilationRoot(), 'links');
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
    const file = path.join(dir, `${receipt.provider.toLowerCase()}.json`);
    fs.writeFileSync(file, `${JSON.stringify(receipt, null, 2)}\n`, { mode: 0o600 });
  }

  private writeRuntimeReceipt(operation: string, provider: string, details: object): void {
    const dir = path.join(this.assimilationRoot(), 'receipts');
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
    const observedAt = new Date().toISOString();
    const receipt = {
      spec: 'tnf/assimilation-runtime/0.1',
      observedAt,
      operation,
      provider,
      ...details,
    };
    const body = `${JSON.stringify(receipt)}\n`;
    fs.appendFileSync(path.join(this.assimilationRoot(), 'ledger.jsonl'), body, {
      mode: 0o600,
    });
    const stamp = observedAt.replace(/[:.]/g, '-');
    fs.writeFileSync(path.join(dir, `${operation}-${provider}-${stamp}.json`), `${JSON.stringify(receipt, null, 2)}\n`, {
      mode: 0o600,
    });
  }
}
