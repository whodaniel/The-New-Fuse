import { describe, expect, it, jest } from '@jest/globals';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '@the-new-fuse/database';
import { EmailCustodianService } from './email-custodian.service';

describe('EmailCustodianService', () => {
  const createService = () => {
    const db = {
      agentManagedAccounts: {
        listByOwner: jest.fn(),
        createAccount: jest.fn(),
        findByIdForOwner: jest.fn(),
        createGrant: jest.fn(),
        listGrantsForAccount: jest.fn(),
        revokeGrant: jest.fn(),
        redeemGrant: jest.fn(),
      },
    } as unknown as DatabaseService;

    const config = {
      get: jest.fn((_key: string) => undefined),
    } as unknown as ConfigService;

    const service = new EmailCustodianService(db, config);
    return { service, db, config };
  };

  it('marks chatgpt provisioning as pending when automation is disabled', async () => {
    const { service, db } = createService();
    (db.agentManagedAccounts.createAccount as jest.Mock).mockResolvedValue({
      id: 'acct-1',
      accountType: 'chatgpt',
      provider: 'openai_chatgpt',
      status: 'pending_external_automation',
    });

    const result = await service.provisionAccountForOwner('user-1', {
      accountType: 'chatgpt',
      loginIdentifier: 'agent1@example.com',
      secret: 'Passw0rd!',
      allowChatgptAutomation: false,
    });

    expect(result.status).toBe('pending_external_automation');
    expect(db.agentManagedAccounts.createAccount).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({
        accountType: 'chatgpt',
        provider: 'openai_chatgpt',
        status: 'pending_external_automation',
      })
    );
  });

  it('rejects grant creation with past expiration', async () => {
    const { service, db } = createService();
    (db.agentManagedAccounts.findByIdForOwner as jest.Mock).mockResolvedValue({
      id: 'acct-1',
      accountType: 'hosted_email',
      provider: 'cpanel',
      loginIdentifier: 'agent1@example.com',
    });

    await expect(
      service.createGrantForAccount('user-1', 'acct-1', {
        granteeAgentId: 'agent-alpha',
        expiresAt: '2000-01-01T00:00:00.000Z',
      })
    ).rejects.toThrow('expiresAt must be a future ISO timestamp');
  });

  it('rejects redeem when token is invalid', async () => {
    const { service, db } = createService();
    (db.agentManagedAccounts.redeemGrant as jest.Mock).mockResolvedValue(null);

    await expect(
      service.redeemGrant({
        grantToken: 'tnf_cust_invalid_token',
        granteeAgentId: 'agent-alpha',
      })
    ).rejects.toThrow('Invalid, revoked, expired, or mismatched grant token');
  });

  it('uses ssh transport for hosted email provisioning when configured', async () => {
    const { service, db, config } = createService();

    (config.get as jest.Mock).mockImplementation((key: string) => {
      const env: Record<string, string> = {
        HOSTING_PROVISION_TRANSPORT: 'ssh_command',
        HOSTING_SSH_HOST: 'ssh.gb.stackcp.com',
        HOSTING_SSH_USERNAME: 'findproductsandservices.com',
        HOSTING_SSH_PRIVATE_KEY_PATH: '/tmp/tnf_hostmaria_key',
        HOSTING_SSH_PORT: '22',
        HOSTING_SSH_CONNECT_TIMEOUT_MS: '5000',
      };
      return env[key];
    });

    const sshSpy = jest.spyOn(service as any, 'executeSshCommand').mockResolvedValue({
      stdout: '{"status":1,"data":{"status":1}}',
      stderr: '',
      exitCode: 0,
    });

    (db.agentManagedAccounts.createAccount as jest.Mock).mockResolvedValue({
      id: 'acct-ssh-1',
      accountType: 'hosted_email',
      provider: 'stackcp_ssh',
      status: 'active',
    });

    await service.provisionAccountForOwner('user-1', {
      accountType: 'hosted_email',
      loginIdentifier: 'agent1@findproductsandservices.com',
      secret: 'Passw0rd!',
      hostingQuotaMb: 1024,
    });

    expect(sshSpy).toHaveBeenCalledTimes(1);
    expect(db.agentManagedAccounts.createAccount).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({
        accountType: 'hosted_email',
        provider: 'stackcp_ssh',
      })
    );
  });
});
