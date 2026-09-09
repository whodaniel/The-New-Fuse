import {
  CallHandler,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  NestInterceptor,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { DatabaseService } from '@the-new-fuse/database';
import { from, lastValueFrom } from 'rxjs';
import { UnifiedLedgerService } from './unified-ledger.service';

@Injectable()
export class LedgerScopeInterceptor implements NestInterceptor {
  constructor(
    @Inject(UnifiedLedgerService) private readonly ledger: UnifiedLedgerService,
    @Inject(DatabaseService) private readonly db: DatabaseService
  ) {}
  async intercept(context: ExecutionContext, next: CallHandler) {
    const req = context.switchToHttp().getRequest();
    const user = req.user || {};
    const owner = user.id || user.sub || user.user_id || user.userId;
    if (typeof owner !== 'string' || !owner.trim())
      throw new UnauthorizedException('Missing authenticated ledger owner');
    const tenantId =
      typeof user.tenantId === 'string' && user.tenantId.trim()
        ? user.tenantId.trim()
        : `user:${owner}`;
    const authWorkspace =
      user.workspaceId ||
      user.activeWorkspaceId ||
      user.currentWorkspaceId ||
      user.context?.workspaceId ||
      user.scope?.workspaceId;
    const hint = req.body?.workspaceId || req.query?.workspaceId;
    const tenantHint = req.body?.tenantId || req.query?.tenantId;
    if (tenantHint && tenantHint !== tenantId)
      throw new ForbiddenException('Ledger tenant does not match authenticated scope');
    if (authWorkspace && hint && authWorkspace !== hint)
      throw new ForbiddenException('Ledger workspace does not match authenticated scope');
    const workspaceId = authWorkspace || hint || 'personal';
    if (workspaceId !== 'personal') {
      const workspace = await this.db.workspaces.findByIdWithOwner(workspaceId);
      if (!workspace) throw new NotFoundException('Workspace not found');
      if (
        workspace.ownerId !== owner &&
        !(await this.db.workspaceMembers.findMembership(workspaceId, owner))
      )
        throw new ForbiddenException('Workspace access denied');
      if ((workspace as any).tenantId && (workspace as any).tenantId !== tenantId)
        throw new ForbiddenException('Workspace tenant mismatch');
    }
    return from(this.ledger.inScope({ tenantId, workspaceId }, () => lastValueFrom(next.handle())));
  }
}
