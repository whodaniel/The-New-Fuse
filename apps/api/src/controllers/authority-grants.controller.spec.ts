import { HttpException, HttpStatus } from '@nestjs/common';
import { AuthorityGrantsController } from './authority-grants.controller';
import { AuthorityGrantsService } from '../services/authority-grants.service';

describe('AuthorityGrantsController', () => {
  let controller: AuthorityGrantsController;
  let serviceMock: jest.Mocked<Partial<AuthorityGrantsService>>;

  beforeEach(() => {
    serviceMock = {
      issueGrant: jest.fn(),
      renewGrant: jest.fn(),
      revokeGrant: jest.fn(),
      resolveRole: jest.fn(),
      getGrantById: jest.fn(),
    };
    controller = new AuthorityGrantsController(serviceMock as unknown as AuthorityGrantsService);
  });

  describe('issueGrant', () => {
    it('successfully issues a grant and returns it', async () => {
      const mockGrant = { id: 'grant-123', role: 'sub-director', subjectDid: 'did:tnf:local:sub-1' };
      (serviceMock.issueGrant as jest.Mock).mockResolvedValue(mockGrant);

      const res = await controller.issueGrant({
        callerDid: 'did:tnf:local:super-1',
        subjectDid: 'did:tnf:local:sub-1',
        role: 'sub-director',
      });

      expect(res).toEqual({ ok: true, grant: mockGrant });
      expect(serviceMock.issueGrant).toHaveBeenCalledWith({
        callerDid: 'did:tnf:local:super-1',
        subjectDid: 'did:tnf:local:sub-1',
        role: 'sub-director',
      });
    });

    it('rejects with FORBIDDEN and exact message when caller is not authorized', async () => {
      const errMsg = 'Refusing to issue grant: caller did:tnf:local:worker has resolved role worker, which cannot issue grants';
      (serviceMock.issueGrant as jest.Mock).mockRejectedValue(new Error(errMsg));

      await expect(
        controller.issueGrant({
          callerDid: 'did:tnf:local:worker',
          subjectDid: 'did:tnf:local:target',
          role: 'sub-director',
        })
      ).rejects.toThrow(new HttpException(errMsg, HttpStatus.FORBIDDEN));
    });

    it('rejects with BAD_REQUEST and exact message on validation failure', async () => {
      const errMsg = 'subjectDid must be in did:tnf format';
      (serviceMock.issueGrant as jest.Mock).mockRejectedValue(new Error(errMsg));

      await expect(
        controller.issueGrant({
          callerDid: 'did:tnf:local:super-1',
          subjectDid: 'invalid-did',
          role: 'sub-director',
        })
      ).rejects.toThrow(new HttpException(errMsg, HttpStatus.BAD_REQUEST));
    });
  });

  describe('renewGrant', () => {
    it('renews a grant and returns the newly minted row', async () => {
      const mockRenewed = { id: 'grant-456', role: 'sub-director', subjectDid: 'did:tnf:local:sub-1' };
      (serviceMock.renewGrant as jest.Mock).mockResolvedValue(mockRenewed);

      const res = await controller.renewGrant({
        callerDid: 'did:tnf:local:super-1',
        grantId: 'grant-123',
        ttlSeconds: 7200,
      });

      expect(res).toEqual({ ok: true, grant: mockRenewed });
    });
  });

  describe('revokeGrant', () => {
    it('revokes a grant and returns the revoked row', async () => {
      const mockRevoked = { id: 'grant-123', revokedAt: new Date().toISOString() };
      (serviceMock.revokeGrant as jest.Mock).mockResolvedValue(mockRevoked);

      const res = await controller.revokeGrant({
        callerDid: 'did:tnf:local:super-1',
        grantId: 'grant-123',
        reason: 'Operator revoked test grant',
      });

      expect(res).toEqual({ ok: true, grant: mockRevoked });
    });
  });

  describe('resolveRole', () => {
    it('resolves effective role for a subject', async () => {
      const mockResolution = { ok: true, role: 'super-director', verified: true };
      (serviceMock.resolveRole as jest.Mock).mockResolvedValue(mockResolution as any);

      const res = await controller.resolveRole('did:tnf:local:director-1');
      expect(res).toEqual({ ok: true, result: mockResolution });
    });
  });

  describe('getGrantById', () => {
    it('returns grant when found', async () => {
      const mockGrant = { id: 'grant-123', role: 'sub-director' };
      (serviceMock.getGrantById as jest.Mock).mockResolvedValue(mockGrant as any);

      const res = await controller.getGrantById('grant-123');
      expect(res).toEqual({ ok: true, grant: mockGrant });
    });

    it('throws 404 when grant is not found', async () => {
      (serviceMock.getGrantById as jest.Mock).mockResolvedValue(null);

      await expect(controller.getGrantById('nonexistent')).rejects.toThrow(
        new HttpException('Authority grant nonexistent not found', HttpStatus.NOT_FOUND)
      );
    });
  });
});
