"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var WorkspaceController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkspaceController = exports.UpdateWorkspaceBookmarkDto = exports.CreateWorkspaceBookmarkDto = exports.CreateWorkspaceDomainDto = exports.UpdateWorkspaceSubAccessDto = exports.SetWorkspaceSubAccessDto = exports.UpdateWorkspaceMemberRoleDto = exports.AddWorkspaceMemberDto = exports.UpdateWorkspaceDto = exports.CreateWorkspaceDto = void 0;
// @ts-nocheck
const common_1 = require("@nestjs/common");
// @ts-ignore
// @ts-ignore
const swagger_1 = require("@nestjs/swagger");
const database_1 = require("@the-new-fuse/database");
const node_crypto_1 = require("node:crypto");
const node_dns_1 = require("node:dns");
const fs_1 = require("fs");
const os = __importStar(require("node:os"));
const path = __importStar(require("path"));
const current_user_decorator_1 = require("../decorators/current-user.decorator");
const secure_auth_guard_1 = require("../guards/secure-auth.guard");
const unified_ledger_service_1 = require("../modules/unified-ledger/unified-ledger.service");
/**
 * DTO for creating a new workspace
 */
class CreateWorkspaceDto {
}
exports.CreateWorkspaceDto = CreateWorkspaceDto;
/**
 * DTO for updating a workspace
 */
class UpdateWorkspaceDto {
}
exports.UpdateWorkspaceDto = UpdateWorkspaceDto;
/**
 * DTO for adding a workspace member
 */
class AddWorkspaceMemberDto {
}
exports.AddWorkspaceMemberDto = AddWorkspaceMemberDto;
/**
 * DTO for updating a workspace member role
 */
class UpdateWorkspaceMemberRoleDto {
}
exports.UpdateWorkspaceMemberRoleDto = UpdateWorkspaceMemberRoleDto;
/**
 * DTO for setting delegated sub-access (VA access)
 */
class SetWorkspaceSubAccessDto extends AddWorkspaceMemberDto {
}
exports.SetWorkspaceSubAccessDto = SetWorkspaceSubAccessDto;
/**
 * DTO for updating delegated sub-access (VA access)
 */
class UpdateWorkspaceSubAccessDto extends UpdateWorkspaceMemberRoleDto {
}
exports.UpdateWorkspaceSubAccessDto = UpdateWorkspaceSubAccessDto;
/**
 * DTO for workspace custom domain
 */
class CreateWorkspaceDomainDto {
}
exports.CreateWorkspaceDomainDto = CreateWorkspaceDomainDto;
/**
 * DTO for workspace bookmark
 */
class CreateWorkspaceBookmarkDto {
}
exports.CreateWorkspaceBookmarkDto = CreateWorkspaceBookmarkDto;
/**
 * DTO for updating workspace bookmark
 */
class UpdateWorkspaceBookmarkDto {
}
exports.UpdateWorkspaceBookmarkDto = UpdateWorkspaceBookmarkDto;
let WorkspaceController = WorkspaceController_1 = class WorkspaceController {
    constructor(db, unifiedLedger) {
        this.db = db;
        this.unifiedLedger = unifiedLedger;
        this.logger = new common_1.Logger(WorkspaceController_1.name);
        this.hostMariaOwnerEmails = new Set((process.env.HOSTMARIA_OWNER_EMAILS || 'owner@example.com')
            .split(',')
            .map((email) => email.trim().toLowerCase())
            .filter((email) => email.length > 0));
        this.hostMariaAutoSyncTimer = null;
        this.hostMariaAutoSyncRunning = false;
    }
    onModuleInit() {
        if (!this.isHostMariaAutoSyncEnabled()) {
            return;
        }
        const intervalMs = this.getHostMariaAutoSyncIntervalMs();
        const runOnStart = this.shouldRunHostMariaAutoSyncOnStart();
        this.logger.log(`HostMaria workspace auto-sync enabled (interval=${intervalMs}ms, runOnStart=${runOnStart})`);
        if (runOnStart) {
            void this.runHostMariaAutoSyncCycle('startup');
        }
        this.hostMariaAutoSyncTimer = setInterval(() => {
            void this.runHostMariaAutoSyncCycle('interval');
        }, intervalMs);
    }
    onModuleDestroy() {
        if (this.hostMariaAutoSyncTimer) {
            clearInterval(this.hostMariaAutoSyncTimer);
            this.hostMariaAutoSyncTimer = null;
        }
    }
    isHostMariaAutoSyncEnabled() {
        const raw = String(process.env.HOSTMARIA_AUTO_SYNC_ENABLED || '')
            .trim()
            .toLowerCase();
        if (!raw) {
            return false;
        }
        return raw === '1' || raw === 'true' || raw === 'yes' || raw === 'on';
    }
    shouldRunHostMariaAutoSyncOnStart() {
        const raw = String(process.env.HOSTMARIA_AUTO_SYNC_RUN_ON_START || '')
            .trim()
            .toLowerCase();
        if (!raw)
            return true;
        return raw === '1' || raw === 'true' || raw === 'yes' || raw === 'on';
    }
    getHostMariaAutoSyncIntervalMs() {
        const fromEnv = Number.parseInt(process.env.HOSTMARIA_AUTO_SYNC_INTERVAL_MS || '', 10);
        if (Number.isFinite(fromEnv) && fromEnv >= 60_000) {
            return fromEnv;
        }
        return 10 * 60 * 1000;
    }
    async runHostMariaAutoSyncCycle(trigger) {
        if (this.hostMariaAutoSyncRunning) {
            return;
        }
        this.hostMariaAutoSyncRunning = true;
        try {
            const inputs = await this.readHostMariaSyncInputs();
            const noSignals = inputs.targets.length === 0 && !inputs.latestReport && !inputs.latestArchive;
            if (noSignals) {
                this.logger.warn('HostMaria auto-sync skipped: no targets or latest report/archive artifacts detected');
                return;
            }
            const allWorkspaces = await this.db.workspaces.findAllWithOwner();
            const eligible = allWorkspaces.filter((workspace) => this.isHostMariaOwnerEmail(String(workspace.owner?.email || '')));
            if (eligible.length === 0) {
                return;
            }
            let syncedWorkspaces = 0;
            let tasksCreated = 0;
            let tasksUpdated = 0;
            let ledgerCreated = 0;
            let ledgerUpdated = 0;
            for (const workspace of eligible) {
                try {
                    const ownerEmail = String(workspace.owner?.email || '')
                        .trim()
                        .toLowerCase();
                    const project = await this.upsertHostMariaProject(workspace.id, ownerEmail, inputs);
                    const taskSync = await this.upsertHostMariaTasks(workspace.ownerId, workspace.id, project.id, ownerEmail, inputs);
                    const ledgerSync = await this.upsertHostMariaLedgerTasks(workspace.ownerId, workspace.id, taskSync.items);
                    syncedWorkspaces += 1;
                    tasksCreated += taskSync.created;
                    tasksUpdated += taskSync.updated;
                    ledgerCreated += ledgerSync.created;
                    ledgerUpdated += ledgerSync.updated;
                }
                catch (error) {
                    this.logger.error(`HostMaria auto-sync failed for workspace ${workspace.id}`, error);
                }
            }
            if (syncedWorkspaces > 0) {
                this.logger.log(`HostMaria auto-sync (${trigger}) completed: workspaces=${syncedWorkspaces}, tasks=+${tasksCreated}/~${tasksUpdated}, ledger=+${ledgerCreated}/~${ledgerUpdated}`);
            }
        }
        catch (error) {
            this.logger.error('HostMaria auto-sync cycle failed', error);
        }
        finally {
            this.hostMariaAutoSyncRunning = false;
        }
    }
    requireActor(user) {
        const userId = user.id || user.sub;
        if (!userId) {
            throw new common_1.ForbiddenException('Authenticated user id is required');
        }
        const email = String(user.email || '')
            .trim()
            .toLowerCase();
        if (!email) {
            throw new common_1.ForbiddenException('Authenticated user email is required');
        }
        return { userId, email };
    }
    isHostMariaOwnerEmail(email) {
        return this.hostMariaOwnerEmails.has(String(email || '')
            .trim()
            .toLowerCase());
    }
    isHostMariaProject(project) {
        const payload = this.asObject(project);
        const name = String(payload.name || '')
            .trim()
            .toLowerCase();
        const settings = this.asObject(payload.settings);
        return settings.hostMariaOps === true || name === 'hostmaria legacy ops';
    }
    canAccessHostMariaWorkspace(access, actorEmail, mode) {
        const ownerEmail = String(access.workspace.owner?.email || '')
            .trim()
            .toLowerCase();
        if (!this.isHostMariaOwnerEmail(ownerEmail)) {
            return false;
        }
        if (this.isHostMariaOwnerEmail(actorEmail)) {
            return true;
        }
        const membership = access.membership;
        if (!membership) {
            return false;
        }
        const delegatedByOwner = membership.addedByUserId === access.workspace.ownerId;
        if (!delegatedByOwner) {
            return false;
        }
        if (mode === 'write') {
            return membership.role === 'admin' || membership.role === 'member';
        }
        return membership.role !== 'viewer';
    }
    async ensureHostMariaWorkspaceAccess(workspaceId, user, mode) {
        const actor = this.requireActor(user);
        const access = mode === 'write'
            ? await this.ensureWorkspaceMemberManagement(workspaceId, actor.userId)
            : await this.ensureWorkspaceAccess(workspaceId, actor.userId);
        if (!this.canAccessHostMariaWorkspace(access, actor.email, mode)) {
            throw new common_1.ForbiddenException(`HostMaria operations are restricted to account owner (${Array.from(this.hostMariaOwnerEmails).join(', ')}) and delegated agents.`);
        }
        return { actor, access };
    }
    resolveHostMariaPaths() {
        const homeDir = os.homedir();
        return {
            configPath: process.env.HOSTMARIA_PROJECTS_FILE ||
                path.join(homeDir, '.tnf', 'hostmaria', 'projects.txt'),
            reportPath: process.env.HOSTMARIA_LATEST_REPORT_FILE ||
                path.join(homeDir, '.tnf', 'hostmaria', 'reports', 'hostmaria-preservation-latest.json'),
            archivePath: process.env.HOSTMARIA_LATEST_ARCHIVE_FILE ||
                path.join(homeDir, '.tnf', 'hostmaria', 'archive', 'latest-archive-summary.json'),
        };
    }
    sanitizeSyncKey(value) {
        return value
            .toLowerCase()
            .replace(/[^a-z0-9:_-]+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-+|-+$/g, '')
            .slice(0, 80);
    }
    normalizeHostMariaTarget(input) {
        const raw = String(input || '').trim();
        if (!raw || raw.startsWith('#'))
            return null;
        const withScheme = /^[a-zA-Z][a-zA-Z\d+.-]*:\/\//.test(raw) ? raw : `https://${raw}`;
        try {
            const parsed = new URL(withScheme);
            const host = parsed.hostname.trim().toLowerCase();
            return host || null;
        }
        catch {
            return null;
        }
    }
    normalizeHostMariaSeverity(value) {
        const normalized = String(value || '')
            .trim()
            .toLowerCase();
        if (normalized === 'critical')
            return 'critical';
        if (normalized === 'warning')
            return 'warning';
        return 'ok';
    }
    asObject(value) {
        return value && typeof value === 'object' && !Array.isArray(value)
            ? value
            : {};
    }
    asStringArray(value) {
        if (!Array.isArray(value))
            return [];
        return value
            .map((item) => String(item || '').trim())
            .filter((item) => item.length > 0);
    }
    async readJsonObject(filePath) {
        try {
            const raw = await fs_1.promises.readFile(filePath, 'utf8');
            const parsed = JSON.parse(raw);
            const payload = this.asObject(parsed);
            return Object.keys(payload).length > 0 ? payload : null;
        }
        catch {
            return null;
        }
    }
    async readHostMariaSyncInputs() {
        const { configPath, reportPath, archivePath } = this.resolveHostMariaPaths();
        let targets = [];
        try {
            const raw = await fs_1.promises.readFile(configPath, 'utf8');
            targets = Array.from(new Set(raw
                .split('\n')
                .map((line) => this.normalizeHostMariaTarget(line))
                .filter((line) => Boolean(line))));
        }
        catch {
            targets = [];
        }
        const [latestReport, latestArchive] = await Promise.all([
            this.readJsonObject(reportPath),
            this.readJsonObject(archivePath),
        ]);
        return {
            configPath,
            reportPath,
            archivePath,
            targets,
            latestReport,
            latestArchive,
        };
    }
    mapSeverityToTaskStatus(severity) {
        if (severity === 'critical')
            return 'FAILED';
        if (severity === 'warning')
            return 'IN_PROGRESS';
        return 'COMPLETED';
    }
    mapSeverityToTaskPriority(severity) {
        if (severity === 'critical')
            return 'URGENT';
        if (severity === 'warning')
            return 'HIGH';
        return 'MEDIUM';
    }
    mapTaskStatusToLedgerStatus(status) {
        if (status === 'COMPLETED')
            return 'completed';
        if (status === 'IN_PROGRESS')
            return 'in_progress';
        if (status === 'FAILED')
            return 'failed';
        if (status === 'CANCELLED')
            return 'rejected';
        return 'submitted';
    }
    mapTaskPriorityToLedgerPriority(priority) {
        if (priority === 'URGENT')
            return 'urgent';
        if (priority === 'HIGH')
            return 'high';
        if (priority === 'LOW')
            return 'low';
        return 'medium';
    }
    formatTargetStatusSummary(check) {
        if (!check)
            return 'No live check data available yet.';
        const http = this.asObject(check.http);
        const tls = this.asObject(check.tls);
        const statusCode = Number(http.statusCode || 0);
        const daysRemaining = Number(tls.daysRemaining || 0);
        const httpSummary = statusCode > 0 ? `HTTP ${statusCode}` : 'HTTP unavailable';
        const tlsSummary = Number.isFinite(daysRemaining) && daysRemaining > 0
            ? `TLS ${daysRemaining} days remaining`
            : 'TLS unavailable';
        return `${httpSummary} | ${tlsSummary}`;
    }
    buildHostMariaTaskBlueprints(workspaceId, projectId, actorEmail, inputs) {
        const latestReport = this.asObject(inputs.latestReport);
        const summary = this.asObject(latestReport.summary);
        const reportChecksRaw = Array.isArray(latestReport.checks) ? latestReport.checks : [];
        const reportChecks = reportChecksRaw.map((item) => this.asObject(item));
        const checksByTarget = new Map();
        for (const check of reportChecks) {
            const normalizedTarget = this.normalizeHostMariaTarget(check.target);
            if (normalizedTarget) {
                checksByTarget.set(normalizedTarget, check);
            }
        }
        const reportSeverity = this.normalizeHostMariaSeverity(latestReport.status);
        const generatedAt = String(latestReport.generatedAt || 'unknown');
        const targetCount = inputs.targets.length;
        const okCount = Number(summary.ok || 0);
        const warningCount = Number(summary.warning || 0);
        const criticalCount = Number(summary.critical || 0);
        const sharedMetadata = {
            hostMariaOps: true,
            workspaceId,
            projectId,
            ownerEmail: actorEmail,
            configPath: inputs.configPath,
            reportPath: inputs.reportPath,
            archivePath: inputs.archivePath,
            targetCount,
            reportGeneratedAt: generatedAt,
            reportSeverity,
        };
        const blueprints = [
            {
                syncKey: 'hostmaria:monitor',
                title: 'HostMaria Preservation Monitor',
                description: `Track legacy site health every 10 minutes. Last report: ${generatedAt}. ok=${okCount}, warning=${warningCount}, critical=${criticalCount}.`,
                status: reportSeverity === 'critical' ? 'FAILED' : 'IN_PROGRESS',
                priority: reportSeverity === 'critical' ? 'URGENT' : 'HIGH',
                data: {
                    command: 'node scripts/runtime/hostmaria-preservation-check.cjs --config ~/.tnf/hostmaria/projects.txt --out-dir ~/.tnf/hostmaria/reports',
                    latestReport: latestReport || null,
                },
                metadata: {
                    ...sharedMetadata,
                    hostMariaSyncKey: 'hostmaria:monitor',
                    schedule: '*/10 * * * *',
                },
            },
            {
                syncKey: 'hostmaria:archive',
                title: 'HostMaria Daily Archive Snapshot',
                description: `Capture homepage/robots/sitemap snapshots daily for ${Math.max(targetCount, 1)} target(s).`,
                status: inputs.latestArchive ? 'IN_PROGRESS' : 'PENDING',
                priority: 'MEDIUM',
                data: {
                    command: 'node scripts/runtime/hostmaria-daily-archive.cjs --config ~/.tnf/hostmaria/projects.txt --out-dir ~/.tnf/hostmaria/archive',
                    latestArchive: inputs.latestArchive || null,
                },
                metadata: {
                    ...sharedMetadata,
                    hostMariaSyncKey: 'hostmaria:archive',
                    schedule: '17 2 * * *',
                },
            },
        ];
        for (const target of inputs.targets) {
            const check = checksByTarget.get(target) || null;
            const severity = this.normalizeHostMariaSeverity(check?.severity);
            const reasons = this.asStringArray(check?.reasons);
            blueprints.push({
                syncKey: `hostmaria:target:${this.sanitizeSyncKey(target)}`,
                title: `Preserve ${target}`,
                description: reasons.length > 0
                    ? `${reasons.join(' | ')} (${this.formatTargetStatusSummary(check)})`
                    : this.formatTargetStatusSummary(check),
                status: this.mapSeverityToTaskStatus(severity),
                priority: this.mapSeverityToTaskPriority(severity),
                data: {
                    target,
                    check,
                },
                metadata: {
                    ...sharedMetadata,
                    hostMariaSyncKey: `hostmaria:target:${this.sanitizeSyncKey(target)}`,
                    target,
                    severity,
                    reasons,
                },
            });
        }
        return blueprints;
    }
    async upsertHostMariaProject(workspaceId, actorEmail, inputs) {
        const [existingProject] = await this.db.client
            .select()
            .from(database_1.drizzleSchema.projects)
            .where((0, database_1.and)((0, database_1.eq)(database_1.drizzleSchema.projects.workspaceId, workspaceId), (0, database_1.eq)(database_1.drizzleSchema.projects.name, 'HostMaria Legacy Ops')))
            .orderBy((0, database_1.desc)(database_1.drizzleSchema.projects.updatedAt))
            .limit(1);
        const report = this.asObject(inputs.latestReport);
        const reportSummary = this.asObject(report.summary);
        const description = `Legacy preservation + archive automation for ${Math.max(inputs.targets.length, 1)} target(s). Last report status: ${String(report.status || 'unknown')}.`;
        const settings = {
            hostMariaOps: true,
            ownerEmail: actorEmail,
            configPath: inputs.configPath,
            reportPath: inputs.reportPath,
            archivePath: inputs.archivePath,
            targets: inputs.targets,
            reportStatus: report.status || 'unknown',
            reportSummary,
            syncedAt: new Date().toISOString(),
        };
        if (existingProject) {
            const [updatedProject] = await this.db.client
                .update(database_1.drizzleSchema.projects)
                .set({
                description,
                settings,
                customInstructions: 'Keep HostMaria legacy properties healthy with 10-minute checks and daily archival snapshots.',
                updatedAt: new Date(),
            })
                .where((0, database_1.eq)(database_1.drizzleSchema.projects.id, existingProject.id))
                .returning();
            return updatedProject || existingProject;
        }
        const [createdProject] = await this.db.client
            .insert(database_1.drizzleSchema.projects)
            .values({
            id: `prj_${(0, node_crypto_1.randomUUID)().replace(/-/g, '').slice(0, 16)}`,
            name: 'HostMaria Legacy Ops',
            description,
            workspaceId,
            customInstructions: 'Keep HostMaria legacy properties healthy with 10-minute checks and daily archival snapshots.',
            settings,
            createdAt: new Date(),
            updatedAt: new Date(),
        })
            .returning();
        return createdProject;
    }
    async upsertHostMariaTasks(userId, workspaceId, projectId, actorEmail, inputs) {
        try {
            return await this.upsertHostMariaTasksModern(userId, workspaceId, projectId, actorEmail, inputs);
        }
        catch (error) {
            if (!this.isHostMariaLegacyTaskSchemaError(error)) {
                throw error;
            }
            this.logger.warn('HostMaria task sync detected legacy tasks schema; applying compatibility upsert path.');
            return this.upsertHostMariaTasksLegacy(userId, workspaceId, projectId, actorEmail, inputs);
        }
    }
    async upsertHostMariaTasksModern(userId, workspaceId, projectId, actorEmail, inputs) {
        const blueprints = this.buildHostMariaTaskBlueprints(workspaceId, projectId, actorEmail, inputs);
        const existingTasks = await this.db.client
            .select()
            .from(database_1.tasks)
            .where((0, database_1.and)((0, database_1.eq)(database_1.tasks.userId, userId), (0, database_1.eq)(database_1.tasks.type, 'HOSTMARIA_LEGACY_OPS'), (0, database_1.isNull)(database_1.tasks.deletedAt)));
        const bySyncKey = new Map();
        for (const taskRow of existingTasks) {
            const metadata = this.asObject(taskRow.metadata);
            const syncKey = String(metadata.hostMariaSyncKey || '');
            if (syncKey)
                bySyncKey.set(syncKey, taskRow);
        }
        let created = 0;
        let updated = 0;
        const items = [];
        for (const blueprint of blueprints) {
            const existing = bySyncKey.get(blueprint.syncKey);
            if (existing) {
                const [updatedTask] = await this.db.client
                    .update(database_1.tasks)
                    .set({
                    title: blueprint.title,
                    description: blueprint.description,
                    status: blueprint.status,
                    priority: blueprint.priority,
                    data: blueprint.data,
                    metadata: blueprint.metadata,
                    updatedAt: new Date(),
                    deletedAt: null,
                })
                    .where((0, database_1.eq)(database_1.tasks.id, existing.id))
                    .returning();
                if (updatedTask) {
                    updated += 1;
                    items.push({
                        id: updatedTask.id,
                        title: updatedTask.title,
                        description: updatedTask.description,
                        status: updatedTask.status,
                        priority: updatedTask.priority,
                        updatedAt: updatedTask.updatedAt,
                        metadata: updatedTask.metadata,
                    });
                }
                continue;
            }
            const [createdTask] = await this.db.client
                .insert(database_1.tasks)
                .values({
                type: 'HOSTMARIA_LEGACY_OPS',
                title: blueprint.title,
                description: blueprint.description,
                status: blueprint.status,
                priority: blueprint.priority,
                data: blueprint.data,
                metadata: blueprint.metadata,
                userId,
                createdAt: new Date(),
                updatedAt: new Date(),
            })
                .returning();
            if (createdTask) {
                created += 1;
                items.push({
                    id: createdTask.id,
                    title: createdTask.title,
                    description: createdTask.description,
                    status: createdTask.status,
                    priority: createdTask.priority,
                    updatedAt: createdTask.updatedAt,
                    metadata: createdTask.metadata,
                });
            }
        }
        const liveSyncKeys = new Set(blueprints.map((blueprint) => blueprint.syncKey));
        for (const existing of existingTasks) {
            const metadata = this.asObject(existing.metadata);
            const syncKey = String(metadata.hostMariaSyncKey || '');
            if (!syncKey || liveSyncKeys.has(syncKey))
                continue;
            const [cancelledTask] = await this.db.client
                .update(database_1.tasks)
                .set({
                status: 'CANCELLED',
                updatedAt: new Date(),
                metadata: {
                    ...metadata,
                    active: false,
                    archivedAt: new Date().toISOString(),
                },
            })
                .where((0, database_1.eq)(database_1.tasks.id, existing.id))
                .returning();
            if (cancelledTask) {
                updated += 1;
            }
        }
        return { created, updated, items };
    }
    normalizeSqlRows(result) {
        if (Array.isArray(result)) {
            return result.map((row) => this.asObject(row));
        }
        const payload = this.asObject(result);
        if (Array.isArray(payload.rows)) {
            return payload.rows.map((row) => this.asObject(row));
        }
        return [];
    }
    isHostMariaLegacyTaskSchemaError(error) {
        const message = String(error?.message || '').toLowerCase();
        return (message.includes('column "data" does not exist') ||
            message.includes('column "user_id" does not exist') ||
            message.includes('column "deleted_at" does not exist') ||
            message.includes('column "updated_at" does not exist') ||
            message.includes('column "created_at" does not exist'));
    }
    async upsertHostMariaTasksLegacy(userId, workspaceId, projectId, actorEmail, inputs) {
        const blueprints = this.buildHostMariaTaskBlueprints(workspaceId, projectId, actorEmail, inputs);
        const existingRaw = await this.db.client.execute((0, database_1.sql) `
      SELECT
        "id",
        "title",
        "description",
        "status",
        "priority",
        "metadata",
        "updatedAt"
      FROM "tasks"
      WHERE "createdBy" = ${userId}
        AND "type" = 'HOSTMARIA_LEGACY_OPS'
    `);
        const existingTasks = this.normalizeSqlRows(existingRaw);
        const bySyncKey = new Map();
        for (const taskRow of existingTasks) {
            const metadata = this.asObject(taskRow.metadata);
            const syncKey = String(metadata.hostMariaSyncKey || '');
            if (syncKey)
                bySyncKey.set(syncKey, taskRow);
        }
        let created = 0;
        let updated = 0;
        const items = [];
        for (const blueprint of blueprints) {
            const existing = bySyncKey.get(blueprint.syncKey);
            const now = new Date();
            const nowIso = now.toISOString();
            const completedAt = blueprint.status === 'COMPLETED' ? nowIso : null;
            const errorText = blueprint.status === 'FAILED' ? blueprint.description : null;
            const metadataJson = JSON.stringify(blueprint.metadata || {});
            if (existing) {
                const taskId = String(existing.id || '');
                if (!taskId)
                    continue;
                const updatedRows = this.normalizeSqlRows(await this.db.client.execute((0, database_1.sql) `
            UPDATE "tasks"
            SET
              "title" = ${blueprint.title},
              "description" = ${blueprint.description},
              "status" = ${blueprint.status},
              "priority" = ${blueprint.priority},
              "metadata" = ${metadataJson}::jsonb,
              "updatedAt" = ${nowIso},
              "completedAt" = ${completedAt},
              "error" = ${errorText}
            WHERE "id" = ${taskId}
            RETURNING
              "id",
              "title",
              "description",
              "status",
              "priority",
              "metadata",
              "updatedAt"
          `));
                const updatedTask = updatedRows[0];
                if (updatedTask) {
                    updated += 1;
                    items.push({
                        id: updatedTask.id,
                        title: updatedTask.title,
                        description: updatedTask.description,
                        status: updatedTask.status,
                        priority: updatedTask.priority,
                        updatedAt: updatedTask.updatedAt,
                        metadata: this.asObject(updatedTask.metadata),
                    });
                }
                continue;
            }
            const taskId = `task_${(0, node_crypto_1.randomUUID)().replace(/-/g, '').slice(0, 24)}`;
            const createdRows = this.normalizeSqlRows(await this.db.client.execute((0, database_1.sql) `
          INSERT INTO "tasks" (
            "id",
            "title",
            "description",
            "status",
            "priority",
            "type",
            "updatedAt",
            "createdBy",
            "metadata",
            "completedAt",
            "error"
          )
          VALUES (
            ${taskId},
            ${blueprint.title},
            ${blueprint.description},
            ${blueprint.status},
            ${blueprint.priority},
            'HOSTMARIA_LEGACY_OPS',
            ${nowIso},
            ${userId},
            ${metadataJson}::jsonb,
            ${completedAt},
            ${errorText}
          )
          RETURNING
            "id",
            "title",
            "description",
            "status",
            "priority",
            "metadata",
            "updatedAt"
        `));
            const createdTask = createdRows[0];
            if (createdTask) {
                created += 1;
                items.push({
                    id: createdTask.id,
                    title: createdTask.title,
                    description: createdTask.description,
                    status: createdTask.status,
                    priority: createdTask.priority,
                    updatedAt: createdTask.updatedAt,
                    metadata: this.asObject(createdTask.metadata),
                });
            }
        }
        const liveSyncKeys = new Set(blueprints.map((blueprint) => blueprint.syncKey));
        for (const existing of existingTasks) {
            const metadata = this.asObject(existing.metadata);
            const syncKey = String(metadata.hostMariaSyncKey || '');
            const taskId = String(existing.id || '');
            if (!taskId || !syncKey || liveSyncKeys.has(syncKey))
                continue;
            await this.db.client.execute((0, database_1.sql) `
        UPDATE "tasks"
        SET
          "status" = 'CANCELLED',
          "updatedAt" = ${new Date().toISOString()},
          "metadata" = ${JSON.stringify({
                ...metadata,
                active: false,
                archivedAt: new Date().toISOString(),
            })}::jsonb
        WHERE "id" = ${taskId}
      `);
            updated += 1;
        }
        return { created, updated, items };
    }
    async upsertHostMariaLedgerTasks(userId, workspaceId, taskItems) {
        if (!this.unifiedLedger) {
            return { created: 0, updated: 0 };
        }
        let created = 0;
        let updated = 0;
        for (const taskItem of taskItems) {
            const metadata = this.asObject(taskItem.metadata);
            const syncKey = String(metadata.hostMariaSyncKey || '');
            if (!syncKey)
                continue;
            const ledgerId = `hostmaria_${this.sanitizeSyncKey(workspaceId)}_${this.sanitizeSyncKey(syncKey)}`.slice(0, 120);
            const existing = await this.unifiedLedger.getRecord(ledgerId, userId);
            const payload = {
                title: String(taskItem.title || 'HostMaria Task'),
                description: String(taskItem.description || ''),
                status: this.mapTaskStatusToLedgerStatus(String(taskItem.status || 'PENDING')),
                priority: this.mapTaskPriorityToLedgerPriority(String(taskItem.priority || 'MEDIUM')),
                owner: userId,
                tags: ['hostmaria', 'legacy', `workspace:${workspaceId}`],
                metadata: {
                    ...(metadata || {}),
                    sourceTaskId: taskItem.id,
                    workspaceId,
                },
                source: 'orchestrator',
            };
            if (existing) {
                await this.unifiedLedger.updateRecord(ledgerId, payload, userId);
                updated += 1;
            }
            else {
                await this.unifiedLedger.createRecord({
                    id: ledgerId,
                    kind: 'task',
                    ...payload,
                });
                created += 1;
            }
        }
        return { created, updated };
    }
    normalizeDomain(value) {
        const trimmed = value.trim().toLowerCase();
        if (!trimmed)
            return '';
        let normalized = trimmed.replace(/^https?:\/\//, '');
        normalized = normalized.split('/')[0];
        if (normalized.startsWith('www.')) {
            normalized = normalized.slice(4);
        }
        return normalized;
    }
    normalizeBookmarkUrl(value) {
        const trimmed = value.trim();
        if (!trimmed)
            return '';
        if (trimmed.startsWith('/'))
            return trimmed;
        if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(trimmed))
            return trimmed;
        return `https://${trimmed}`;
    }
    isValidDomain(domain) {
        return /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/.test(domain);
    }
    isValidBookmarkUrl(url) {
        if (url.startsWith('/'))
            return true;
        try {
            const parsed = new URL(url);
            return parsed.protocol === 'http:' || parsed.protocol === 'https:';
        }
        catch {
            return false;
        }
    }
    async verifyDomainDns(domain) {
        const details = [];
        try {
            const cnames = await node_dns_1.promises.resolveCname(domain);
            if (cnames.length > 0) {
                details.push(`CNAME -> ${cnames.join(', ')}`);
            }
        }
        catch {
            // Best effort: CNAME may not exist when A/AAAA is used.
        }
        try {
            const aRecords = await node_dns_1.promises.resolve4(domain);
            if (aRecords.length > 0) {
                details.push(`A -> ${aRecords.join(', ')}`);
            }
        }
        catch {
            // Best effort: A record may not exist when CNAME/AAAA is used.
        }
        try {
            const aaaaRecords = await node_dns_1.promises.resolve6(domain);
            if (aaaaRecords.length > 0) {
                details.push(`AAAA -> ${aaaaRecords.join(', ')}`);
            }
        }
        catch {
            // Best effort: AAAA may not exist.
        }
        if (details.length === 0) {
            return {
                status: 'error',
                verificationMessage: 'No DNS records found. Add CNAME or A/AAAA records and retry.',
            };
        }
        return {
            status: 'verified',
            verificationMessage: `DNS records found: ${details.join(' | ')}`,
        };
    }
    handleError(error, context) {
        if (error instanceof common_1.HttpException) {
            throw error;
        }
        this.logger.error(`${context} failed`, error);
        throw new common_1.HttpException(error?.message || 'Internal server error', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
    }
    validateUser(userId) {
        if (!userId) {
            throw new common_1.HttpException('Authentication required', common_1.HttpStatus.UNAUTHORIZED);
        }
        return userId;
    }
    timelineTrackToProjectName(track) {
        const normalized = track.trim();
        if (normalized === 'tnf_platform_development')
            return 'The New Fuse Platform';
        if (normalized === 'media_empire_strategy')
            return "Daniel Who's Media Empire";
        if (normalized === 'new_fuse_novel_development')
            return 'The New Fuse (Novel)';
        if (!normalized)
            return 'Unassigned';
        return normalized.replace(/_/g, ' ');
    }
    readTimelineProject(payload) {
        const explicitProject = typeof payload.project === 'string' ? payload.project.trim() : '';
        const trackCandidate = typeof payload.timelineTrack === 'string'
            ? payload.timelineTrack
            : typeof payload.segment === 'string'
                ? payload.segment
                : '';
        const timelineTrackKey = trackCandidate.trim() || null;
        if (explicitProject.length > 0) {
            return { projectName: explicitProject, timelineTrackKey };
        }
        if (timelineTrackKey) {
            return {
                projectName: this.timelineTrackToProjectName(timelineTrackKey),
                timelineTrackKey,
            };
        }
        return { projectName: 'Unassigned', timelineTrackKey: null };
    }
    readTimelineAssetRefs(payload) {
        const refs = new Set();
        if (Array.isArray(payload.assetRefs)) {
            for (const value of payload.assetRefs) {
                if (typeof value !== 'string')
                    continue;
                const trimmed = value.trim();
                if (trimmed.length > 0)
                    refs.add(trimmed);
            }
        }
        if (Array.isArray(payload.evidenceRefs)) {
            for (const value of payload.evidenceRefs) {
                if (typeof value !== 'string')
                    continue;
                const trimmed = value.trim();
                if (!trimmed.startsWith('librarian:artifact:'))
                    continue;
                refs.add(trimmed.replace('librarian:artifact:', ''));
            }
        }
        return Array.from(refs);
    }
    readTimelineEventTitle(event, payload) {
        if (typeof payload.title === 'string' && payload.title.trim().length > 0) {
            return payload.title.trim();
        }
        if (typeof payload.note === 'string' && payload.note.trim().length > 0) {
            return payload.note.trim();
        }
        if (typeof event?.eventType === 'string' && event.eventType.trim().length > 0) {
            return event.eventType.trim();
        }
        return 'timeline_event';
    }
    parsePositiveInt(input, fallback, min, max) {
        const value = Number.parseInt(String(input || ''), 10);
        if (!Number.isFinite(value))
            return fallback;
        return Math.min(max, Math.max(min, value));
    }
    normalizeRole(role) {
        return role === 'admin' || role === 'member' || role === 'viewer' ? role : 'member';
    }
    async listAccessibleWorkspaces(userId) {
        const owned = await this.db.workspaces.findByOwnerWithOwner(userId);
        const memberRows = await this.db.workspaceMembers.listByUser(userId);
        const ownedIds = new Set(owned.map((workspace) => workspace.id));
        const memberIds = memberRows
            .map((row) => row.workspaceId)
            .filter((id) => !ownedIds.has(id));
        const memberWorkspaces = await this.db.workspaces.findByIdsWithOwner(memberIds);
        const roleByWorkspace = new Map(memberRows.map((row) => [row.workspaceId, row.role]));
        return [
            ...owned.map((workspace) => ({ ...workspace, membershipRole: 'owner' })),
            ...memberWorkspaces.map((workspace) => ({
                ...workspace,
                membershipRole: roleByWorkspace.get(workspace.id) || 'member',
            })),
        ];
    }
    async ensureWorkspaceAccess(workspaceId, userId) {
        const workspace = (await this.db.workspaces.findByIdWithOwner(workspaceId));
        if (!workspace) {
            throw new common_1.NotFoundException('Workspace not found');
        }
        const membership = (await this.db.workspaceMembers.findMembership(workspaceId, userId));
        const isOwner = workspace.ownerId === userId;
        const isAdmin = membership?.role === 'admin';
        if (!isOwner && !membership) {
            throw new common_1.ForbiddenException('You do not have access to this workspace');
        }
        return { workspace, membership, isOwner, isAdmin };
    }
    async ensureWorkspaceMemberManagement(workspaceId, userId) {
        const access = await this.ensureWorkspaceAccess(workspaceId, userId);
        if (!access.isOwner && !access.isAdmin) {
            throw new common_1.ForbiddenException('Only workspace owners or admins can manage members');
        }
        return access;
    }
    async ensureWorkspaceWriteAccess(workspaceId, userId) {
        const access = await this.ensureWorkspaceAccess(workspaceId, userId);
        if (!access.isOwner && access.membership?.role === 'viewer') {
            throw new common_1.ForbiddenException('Workspace viewers have read-only access');
        }
        return access;
    }
    async resolveTargetUserId(memberData) {
        if (memberData.userId?.trim()) {
            const existingById = await this.db.users.findById(memberData.userId.trim());
            if (!existingById) {
                throw new common_1.NotFoundException('User not found');
            }
            return existingById.id;
        }
        if (memberData.email?.trim()) {
            const normalizedEmail = memberData.email.trim().toLowerCase();
            const existingByEmail = await this.db.users.findByEmail(normalizedEmail);
            if (!existingByEmail) {
                throw new common_1.NotFoundException('User with this email was not found. Ask them to create an account first.');
            }
            return existingByEmail.id;
        }
        throw new common_1.BadRequestException('Either userId or email is required');
    }
    async listWorkspaceMembersInternal(workspaceId, userId) {
        const { workspace } = await this.ensureWorkspaceAccess(workspaceId, userId);
        const members = await this.db.workspaceMembers.listByWorkspaceWithUsers(workspaceId);
        const hasOwner = members.some((member) => member.userId === workspace.ownerId);
        const formatted = members.map((member) => ({
            userId: member.userId,
            email: member.userEmail,
            role: member.role,
            joinedAt: member.createdAt,
        }));
        if (!hasOwner) {
            formatted.unshift({
                userId: workspace.ownerId,
                email: workspace.owner?.email ?? null,
                role: 'owner',
                joinedAt: workspace.createdAt,
            });
        }
        return formatted;
    }
    async addWorkspaceMemberInternal(workspaceId, memberData, actingUserId) {
        const { workspace } = await this.ensureWorkspaceMemberManagement(workspaceId, actingUserId);
        const targetUserId = await this.resolveTargetUserId(memberData);
        if (targetUserId === workspace.ownerId) {
            throw new common_1.ForbiddenException('Workspace owner already has full access');
        }
        const role = this.normalizeRole(memberData.role);
        const member = await this.db.workspaceMembers.upsertMember({
            workspaceId,
            userId: targetUserId,
            role,
            addedByUserId: actingUserId,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        const targetUser = await this.db.users.findById(targetUserId);
        return {
            message: 'Workspace member added',
            member: {
                userId: member.userId,
                email: targetUser?.email ?? null,
                role: member.role,
                joinedAt: member.createdAt,
            },
        };
    }
    async updateWorkspaceMemberRoleInternal(workspaceId, memberUserId, roleData, actingUserId) {
        const { workspace } = await this.ensureWorkspaceMemberManagement(workspaceId, actingUserId);
        if (memberUserId === workspace.ownerId) {
            throw new common_1.ForbiddenException('Cannot change role for the workspace owner');
        }
        const existingMember = await this.db.workspaceMembers.findMembership(workspaceId, memberUserId);
        if (!existingMember) {
            throw new common_1.NotFoundException('Workspace member not found');
        }
        const role = this.normalizeRole(roleData.role);
        const updatedMember = await this.db.workspaceMembers.updateRole(workspaceId, memberUserId, role);
        if (!updatedMember) {
            throw new common_1.NotFoundException('Workspace member not found');
        }
        const targetUser = await this.db.users.findById(memberUserId);
        return {
            message: 'Workspace member role updated',
            member: {
                userId: updatedMember.userId,
                email: targetUser?.email ?? null,
                role: updatedMember.role,
                joinedAt: updatedMember.createdAt,
            },
        };
    }
    async removeWorkspaceMemberInternal(workspaceId, memberUserId, actingUserId) {
        const { workspace } = await this.ensureWorkspaceMemberManagement(workspaceId, actingUserId);
        if (memberUserId === workspace.ownerId) {
            throw new common_1.ForbiddenException('Cannot remove the workspace owner. Transfer ownership first.');
        }
        const removed = await this.db.workspaceMembers.removeMember(workspaceId, memberUserId);
        if (!removed) {
            throw new common_1.NotFoundException('Workspace member not found');
        }
        return {
            message: 'Workspace member removed',
            memberId: memberUserId,
        };
    }
    /**
     * Get all workspaces accessible by the current user
     */
    async getAllWorkspaces(userId) {
        try {
            this.validateUser(userId);
            return await this.listAccessibleWorkspaces(userId);
        }
        catch (error) {
            this.handleError(error, 'getAllWorkspaces');
        }
    }
    /**
     * Get current workspace for user.
     * Uses first accessible workspace as default current workspace.
     */
    async getCurrentWorkspace(userId) {
        try {
            this.validateUser(userId);
            const workspaces = await this.listAccessibleWorkspaces(userId);
            if (workspaces.length === 0) {
                throw new common_1.NotFoundException('No workspace found for current user');
            }
            return workspaces[0];
        }
        catch (error) {
            this.handleError(error, 'getCurrentWorkspace');
        }
    }
    /**
     * Get workspace by ID
     * Accessible by workspace owner or members
     */
    async getWorkspaceById(id, userId) {
        try {
            this.validateUser(userId);
            const { workspace } = await this.ensureWorkspaceAccess(id, userId);
            return workspace;
        }
        catch (error) {
            this.handleError(error, 'getWorkspaceById');
        }
    }
    /**
     * Create a new workspace
     * The current user becomes the owner
     */
    async createWorkspace(workspaceData, userId) {
        try {
            this.validateUser(userId);
            const workspace = await this.db.workspaces.create({
                name: workspaceData.name,
                description: workspaceData.description,
                ownerId: userId,
            });
            await this.db.workspaceMembers.upsertMember({
                workspaceId: workspace.id,
                userId,
                role: 'owner',
                addedByUserId: userId,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            return workspace;
        }
        catch (error) {
            this.handleError(error, 'createWorkspace');
        }
    }
    /**
     * Update workspace
     * Accessible by workspace owner and admins
     */
    async updateWorkspace(id, workspaceData, userId) {
        try {
            this.validateUser(userId);
            const { isOwner, isAdmin } = await this.ensureWorkspaceAccess(id, userId);
            if (!isOwner && !isAdmin) {
                throw new common_1.ForbiddenException('You do not have permission to update this workspace');
            }
            const updatedWorkspace = await this.db.workspaces.update(id, {
                name: workspaceData.name,
                description: workspaceData.description,
            });
            return updatedWorkspace;
        }
        catch (error) {
            this.handleError(error, 'updateWorkspace');
        }
    }
    /**
     * Delete workspace
     * Only the owner can delete the workspace
     */
    async deleteWorkspace(id, userId) {
        try {
            this.validateUser(userId);
            const existingWorkspace = await this.db.workspaces.findById(id);
            if (!existingWorkspace) {
                throw new common_1.NotFoundException('Workspace not found');
            }
            if (existingWorkspace.ownerId !== userId) {
                throw new common_1.ForbiddenException('You do not have permission to delete this workspace');
            }
            const deleted = await this.db.workspaces.delete(id);
            if (!deleted) {
                throw new common_1.NotFoundException('Workspace not found');
            }
            return { message: 'Workspace deleted successfully', id };
        }
        catch (error) {
            this.handleError(error, 'deleteWorkspace');
        }
    }
    /**
     * Get workspace members
     */
    async getWorkspaceMembers(id, userId) {
        try {
            this.validateUser(userId);
            return await this.listWorkspaceMembersInternal(id, userId);
        }
        catch (error) {
            this.handleError(error, 'getWorkspaceMembers');
        }
    }
    /**
     * Add member to workspace by userId or email
     */
    async addWorkspaceMember(id, memberData, userId) {
        try {
            this.validateUser(userId);
            return await this.addWorkspaceMemberInternal(id, memberData, userId);
        }
        catch (error) {
            this.handleError(error, 'addWorkspaceMember');
        }
    }
    /**
     * Update member role in workspace
     */
    async updateWorkspaceMemberRole(id, memberUserId, roleData, userId) {
        try {
            this.validateUser(userId);
            return await this.updateWorkspaceMemberRoleInternal(id, memberUserId, roleData, userId);
        }
        catch (error) {
            this.handleError(error, 'updateWorkspaceMemberRole');
        }
    }
    /**
     * Remove member from workspace
     */
    async removeWorkspaceMember(id, memberUserId, userId) {
        try {
            this.validateUser(userId);
            return await this.removeWorkspaceMemberInternal(id, memberUserId, userId);
        }
        catch (error) {
            this.handleError(error, 'removeWorkspaceMember');
        }
    }
    /**
     * List delegated sub-access users (non-owner members), useful for VA management UIs.
     */
    async listWorkspaceSubAccess(id, userId) {
        try {
            this.validateUser(userId);
            const members = await this.listWorkspaceMembersInternal(id, userId);
            return {
                workspaceId: id,
                members: members
                    .filter((member) => member.role !== 'owner')
                    .map((member) => ({
                    ...member,
                    accessLevel: member.role,
                })),
            };
        }
        catch (error) {
            this.handleError(error, 'listWorkspaceSubAccess');
        }
    }
    /**
     * Grant delegated sub-access (VA access) using email or userId.
     */
    async grantWorkspaceSubAccess(id, accessData, userId) {
        try {
            this.validateUser(userId);
            const result = await this.addWorkspaceMemberInternal(id, accessData, userId);
            return {
                message: 'Sub-access granted',
                member: result.member,
                accessLevel: result.member.role,
            };
        }
        catch (error) {
            this.handleError(error, 'grantWorkspaceSubAccess');
        }
    }
    /**
     * Update delegated sub-access role.
     */
    async updateWorkspaceSubAccess(id, memberUserId, accessData, userId) {
        try {
            this.validateUser(userId);
            const result = await this.updateWorkspaceMemberRoleInternal(id, memberUserId, accessData, userId);
            return {
                message: 'Sub-access updated',
                member: result.member,
                accessLevel: result.member.role,
            };
        }
        catch (error) {
            this.handleError(error, 'updateWorkspaceSubAccess');
        }
    }
    /**
     * Revoke delegated sub-access.
     */
    async revokeWorkspaceSubAccess(id, memberUserId, userId) {
        try {
            this.validateUser(userId);
            const result = await this.removeWorkspaceMemberInternal(id, memberUserId, userId);
            return {
                message: 'Sub-access revoked',
                memberId: result.memberId,
            };
        }
        catch (error) {
            this.handleError(error, 'revokeWorkspaceSubAccess');
        }
    }
    /**
     * List custom domains assigned to workspace.
     */
    async getWorkspaceDomains(id, userId) {
        try {
            this.validateUser(userId);
            await this.ensureWorkspaceAccess(id, userId);
            const items = await this.db.workspaceDomains.listByWorkspace(id);
            return { workspaceId: id, items };
        }
        catch (error) {
            this.handleError(error, 'getWorkspaceDomains');
        }
    }
    /**
     * Add custom domain for workspace.
     */
    async addWorkspaceDomain(id, payload, userId) {
        try {
            this.validateUser(userId);
            await this.ensureWorkspaceMemberManagement(id, userId);
            const normalized = this.normalizeDomain(payload.domain || '');
            if (!normalized || !this.isValidDomain(normalized)) {
                throw new common_1.BadRequestException('Enter a valid domain (example.com)');
            }
            const existingDomain = await this.db.workspaceDomains.findByDomain(normalized);
            if (existingDomain?.workspaceId === id) {
                return { workspaceId: id, item: existingDomain };
            }
            if (existingDomain && existingDomain.workspaceId !== id) {
                throw new common_1.BadRequestException('This domain is already connected to another workspace');
            }
            const item = await this.db.workspaceDomains.addDomain({
                workspaceId: id,
                domain: normalized,
                status: 'pending',
                verificationMessage: 'Add DNS records and verify from hosting.',
                createdByUserId: userId,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            return { workspaceId: id, item };
        }
        catch (error) {
            this.handleError(error, 'addWorkspaceDomain');
        }
    }
    /**
     * Remove custom domain from workspace.
     */
    async removeWorkspaceDomain(id, domainId, userId) {
        try {
            this.validateUser(userId);
            await this.ensureWorkspaceMemberManagement(id, userId);
            const removed = await this.db.workspaceDomains.removeDomain(id, domainId);
            if (!removed) {
                throw new common_1.NotFoundException('Workspace domain not found');
            }
            return { workspaceId: id, domainId };
        }
        catch (error) {
            this.handleError(error, 'removeWorkspaceDomain');
        }
    }
    /**
     * Verify custom domain DNS state for workspace.
     */
    async verifyWorkspaceDomain(id, domainId, userId) {
        try {
            this.validateUser(userId);
            await this.ensureWorkspaceWriteAccess(id, userId);
            const existing = await this.db.workspaceDomains.findById(id, domainId);
            if (!existing) {
                throw new common_1.NotFoundException('Workspace domain not found');
            }
            const verification = await this.verifyDomainDns(existing.domain);
            const item = await this.db.workspaceDomains.updateStatus(id, domainId, verification.status, verification.verificationMessage);
            if (!item) {
                throw new common_1.NotFoundException('Workspace domain not found');
            }
            return { workspaceId: id, item };
        }
        catch (error) {
            this.handleError(error, 'verifyWorkspaceDomain');
        }
    }
    /**
     * List workspace bookmarks.
     */
    async getWorkspaceBookmarks(id, userId) {
        try {
            this.validateUser(userId);
            await this.ensureWorkspaceAccess(id, userId);
            const items = await this.db.workspaceBookmarks.listByWorkspaceForUser(id, userId);
            return { workspaceId: id, items };
        }
        catch (error) {
            this.handleError(error, 'getWorkspaceBookmarks');
        }
    }
    /**
     * Add (or upsert by URL) workspace bookmark.
     */
    async addWorkspaceBookmark(id, payload, userId) {
        try {
            this.validateUser(userId);
            await this.ensureWorkspaceWriteAccess(id, userId);
            const title = String(payload.title || '').trim();
            const normalizedUrl = this.normalizeBookmarkUrl(String(payload.url || ''));
            if (!title || !normalizedUrl || !this.isValidBookmarkUrl(normalizedUrl)) {
                throw new common_1.BadRequestException('Valid title and URL are required');
            }
            const tags = Array.isArray(payload.tags)
                ? payload.tags.map((tag) => String(tag || '').trim()).filter((tag) => tag.length > 0)
                : [];
            const note = typeof payload.note === 'string' ? payload.note.trim() || null : null;
            const existing = await this.db.workspaceBookmarks.findByUrlForUser(id, normalizedUrl, userId);
            if (existing) {
                const updated = await this.db.workspaceBookmarks.updateBookmarkForUser(id, existing.id, userId, {
                    title,
                    tags,
                    note,
                    url: normalizedUrl,
                });
                return { workspaceId: id, item: updated || existing };
            }
            const item = await this.db.workspaceBookmarks.addBookmark({
                workspaceId: id,
                title,
                url: normalizedUrl,
                tags,
                note,
                createdByUserId: userId,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            return { workspaceId: id, item };
        }
        catch (error) {
            this.handleError(error, 'addWorkspaceBookmark');
        }
    }
    /**
     * Update workspace bookmark.
     */
    async updateWorkspaceBookmark(id, bookmarkId, payload, userId) {
        try {
            this.validateUser(userId);
            await this.ensureWorkspaceWriteAccess(id, userId);
            const existing = await this.db.workspaceBookmarks.findByIdForUser(id, bookmarkId, userId);
            if (!existing) {
                throw new common_1.NotFoundException('Workspace bookmark not found');
            }
            const nextTitle = payload.title === undefined ? existing.title : String(payload.title || '').trim();
            const nextUrl = payload.url === undefined
                ? existing.url
                : this.normalizeBookmarkUrl(String(payload.url || ''));
            if (!nextTitle || !nextUrl || !this.isValidBookmarkUrl(nextUrl)) {
                throw new common_1.BadRequestException('Valid title and URL are required');
            }
            const tags = payload.tags === undefined
                ? existing.tags || []
                : payload.tags.map((tag) => String(tag || '').trim()).filter((tag) => tag.length > 0);
            const note = payload.note === undefined
                ? existing.note
                : typeof payload.note === 'string'
                    ? payload.note.trim()
                    : null;
            if (nextUrl !== existing.url) {
                const conflicting = await this.db.workspaceBookmarks.findByUrlForUser(id, nextUrl, userId);
                if (conflicting && conflicting.id !== bookmarkId) {
                    throw new common_1.BadRequestException('A bookmark with this URL already exists for this user');
                }
            }
            const item = await this.db.workspaceBookmarks.updateBookmarkForUser(id, bookmarkId, userId, {
                title: nextTitle,
                url: nextUrl,
                tags,
                note,
            });
            if (!item) {
                throw new common_1.NotFoundException('Workspace bookmark not found');
            }
            return { workspaceId: id, item };
        }
        catch (error) {
            this.handleError(error, 'updateWorkspaceBookmark');
        }
    }
    /**
     * Remove workspace bookmark.
     */
    async removeWorkspaceBookmark(id, bookmarkId, userId) {
        try {
            this.validateUser(userId);
            await this.ensureWorkspaceWriteAccess(id, userId);
            const removed = await this.db.workspaceBookmarks.removeBookmarkForUser(id, bookmarkId, userId);
            if (!removed) {
                throw new common_1.NotFoundException('Workspace bookmark not found');
            }
            return { workspaceId: id, bookmarkId };
        }
        catch (error) {
            this.handleError(error, 'removeWorkspaceBookmark');
        }
    }
    /**
     * Get workspace asset exposure summary (owner-scoped timeline + linked assets).
     */
    async getWorkspaceAssets(id, userId, projectQuery, timelineTrackQuery, assetSearchQuery, assetPageQuery, assetPageSizeQuery, eventPageQuery, eventPageSizeQuery, projectLimitQuery) {
        try {
            this.validateUser(userId);
            const access = await this.ensureWorkspaceAccess(id, userId);
            const ownerId = access.workspace.ownerId;
            const scope = access.isOwner ? 'owner' : 'delegated';
            const projectFilter = projectQuery?.trim().toLowerCase() || null;
            const timelineTrackFilter = timelineTrackQuery?.trim().toLowerCase() || null;
            const assetSearchFilter = assetSearchQuery?.trim().toLowerCase() || null;
            const assetPage = this.parsePositiveInt(assetPageQuery, 1, 1, 10000);
            const assetPageSize = this.parsePositiveInt(assetPageSizeQuery, 50, 1, 200);
            const eventPage = this.parsePositiveInt(eventPageQuery, 1, 1, 10000);
            const eventPageSize = this.parsePositiveInt(eventPageSizeQuery, 25, 1, 200);
            const projectLimit = this.parsePositiveInt(projectLimitQuery, 200, 1, 1000);
            const empty = {
                workspaceId: id,
                ownerId,
                scope,
                totalTimelineEvents: 0,
                uniqueLinkedAssets: 0,
                assetPagination: {
                    page: assetPage,
                    pageSize: assetPageSize,
                    total: 0,
                    totalPages: 0,
                },
                eventPagination: {
                    page: eventPage,
                    pageSize: eventPageSize,
                    total: 0,
                    totalPages: 0,
                },
                appliedFilters: {
                    project: projectFilter,
                    timelineTrack: timelineTrackFilter,
                    assetSearch: assetSearchFilter,
                },
                projects: [],
                assets: [],
                recentEvents: [],
            };
            if (!this.unifiedLedger) {
                return empty;
            }
            const allTimelineEvents = await this.unifiedLedger.listTimelineEvents({
                userId: ownerId,
                viewerUserId: userId,
            });
            const timelineEvents = allTimelineEvents.filter((event) => {
                const payload = event?.payload && typeof event.payload === 'object'
                    ? event.payload
                    : {};
                const { projectName, timelineTrackKey } = this.readTimelineProject(payload);
                if (projectFilter && !projectName.toLowerCase().includes(projectFilter)) {
                    return false;
                }
                if (timelineTrackFilter &&
                    (!timelineTrackKey || timelineTrackKey.toLowerCase() !== timelineTrackFilter)) {
                    return false;
                }
                return true;
            });
            const projectMap = new Map();
            const assetMap = new Map();
            const recentEvents = [];
            for (const event of timelineEvents) {
                const payload = event?.payload && typeof event.payload === 'object'
                    ? event.payload
                    : {};
                const { projectName, timelineTrackKey } = this.readTimelineProject(payload);
                const assetRefs = this.readTimelineAssetRefs(payload);
                const projectKey = projectName.trim().toLowerCase() || 'unassigned';
                let projectEntry = projectMap.get(projectKey);
                if (!projectEntry) {
                    projectEntry = {
                        projectName,
                        timelineTrackKeys: new Set(),
                        timelineEventCount: 0,
                        linkedAssets: new Set(),
                        latestEvidenceAt: null,
                    };
                    projectMap.set(projectKey, projectEntry);
                }
                projectEntry.timelineEventCount += 1;
                if (timelineTrackKey) {
                    projectEntry.timelineTrackKeys.add(timelineTrackKey);
                }
                for (const assetRef of assetRefs) {
                    projectEntry.linkedAssets.add(assetRef);
                }
                if (!projectEntry.latestEvidenceAt || event.timestamp > projectEntry.latestEvidenceAt) {
                    projectEntry.latestEvidenceAt = event.timestamp;
                }
                for (const assetRef of assetRefs) {
                    let assetEntry = assetMap.get(assetRef);
                    if (!assetEntry) {
                        assetEntry = { occurrences: 0, projects: new Set(), lastSeenAt: null };
                        assetMap.set(assetRef, assetEntry);
                    }
                    assetEntry.occurrences += 1;
                    assetEntry.projects.add(projectName);
                    if (!assetEntry.lastSeenAt || event.timestamp > assetEntry.lastSeenAt) {
                        assetEntry.lastSeenAt = event.timestamp;
                    }
                }
                recentEvents.push({
                    id: event.id,
                    title: this.readTimelineEventTitle(event, payload),
                    timestamp: event.timestamp,
                    projectName,
                    linkedAssetCount: assetRefs.length,
                });
            }
            const projects = Array.from(projectMap.values())
                .map((entry) => ({
                projectName: entry.projectName,
                timelineTrackKeys: Array.from(entry.timelineTrackKeys).sort(),
                timelineEventCount: entry.timelineEventCount,
                linkedAssetCount: entry.linkedAssets.size,
                latestEvidenceAt: entry.latestEvidenceAt,
            }))
                .sort((a, b) => {
                if (b.timelineEventCount !== a.timelineEventCount) {
                    return b.timelineEventCount - a.timelineEventCount;
                }
                return a.projectName.localeCompare(b.projectName);
            })
                .slice(0, projectLimit);
            const sortedAssets = Array.from(assetMap.entries())
                .map(([ref, entry]) => ({
                ref,
                occurrences: entry.occurrences,
                projects: Array.from(entry.projects).sort(),
                lastSeenAt: entry.lastSeenAt,
            }))
                .sort((a, b) => {
                if (b.occurrences !== a.occurrences) {
                    return b.occurrences - a.occurrences;
                }
                return a.ref.localeCompare(b.ref);
            });
            const filteredAssets = assetSearchFilter
                ? sortedAssets.filter((asset) => asset.ref.toLowerCase().includes(assetSearchFilter) ||
                    asset.projects.some((project) => project.toLowerCase().includes(assetSearchFilter)))
                : sortedAssets;
            const assetTotal = filteredAssets.length;
            const assetTotalPages = assetTotal > 0 ? Math.ceil(assetTotal / assetPageSize) : 0;
            const effectiveAssetPage = assetTotalPages > 0 ? Math.min(assetPage, assetTotalPages) : assetPage;
            const assetOffset = assetTotalPages > 0 ? (effectiveAssetPage - 1) * assetPageSize : 0;
            const assets = filteredAssets.slice(assetOffset, assetOffset + assetPageSize);
            const sortedRecentEvents = recentEvents.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
            const eventTotal = sortedRecentEvents.length;
            const eventTotalPages = eventTotal > 0 ? Math.ceil(eventTotal / eventPageSize) : 0;
            const effectiveEventPage = eventTotalPages > 0 ? Math.min(eventPage, eventTotalPages) : eventPage;
            const eventOffset = eventTotalPages > 0 ? (effectiveEventPage - 1) * eventPageSize : 0;
            const paginatedRecentEvents = sortedRecentEvents.slice(eventOffset, eventOffset + eventPageSize);
            return {
                workspaceId: id,
                ownerId,
                scope,
                totalTimelineEvents: timelineEvents.length,
                uniqueLinkedAssets: assetMap.size,
                assetPagination: {
                    page: effectiveAssetPage,
                    pageSize: assetPageSize,
                    total: assetTotal,
                    totalPages: assetTotalPages,
                },
                eventPagination: {
                    page: effectiveEventPage,
                    pageSize: eventPageSize,
                    total: eventTotal,
                    totalPages: eventTotalPages,
                },
                appliedFilters: {
                    project: projectFilter,
                    timelineTrack: timelineTrackFilter,
                    assetSearch: assetSearchFilter,
                },
                projects,
                assets,
                recentEvents: paginatedRecentEvents,
            };
        }
        catch (error) {
            this.handleError(error, 'getWorkspaceAssets');
        }
    }
    /**
     * Get all projects in a workspace
     */
    async getWorkspaceProjects(id, userId) {
        try {
            this.validateUser(userId);
            await this.ensureWorkspaceAccess(id, userId);
            const workspaceWithProjects = await this.db.workspaces.findByIdWithProjects(id);
            return workspaceWithProjects?.projects || [];
        }
        catch (error) {
            this.handleError(error, 'getWorkspaceProjects');
        }
    }
};
exports.WorkspaceController = WorkspaceController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all workspaces for the current user' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of workspaces' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WorkspaceController.prototype, "getAllWorkspaces", null);
__decorate([
    (0, common_1.Get)('current'),
    (0, swagger_1.ApiOperation)({ summary: 'Get current workspace for current user' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Current workspace' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'No workspace found for user' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WorkspaceController.prototype, "getCurrentWorkspace", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get workspace by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Workspace details' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Workspace not found' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Access denied' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], WorkspaceController.prototype, "getWorkspaceById", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create new workspace' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Workspace created' }),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateWorkspaceDto, String]),
    __metadata("design:returntype", Promise)
], WorkspaceController.prototype, "createWorkspace", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update workspace' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Workspace updated' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Workspace not found' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Access denied' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, UpdateWorkspaceDto, String]),
    __metadata("design:returntype", Promise)
], WorkspaceController.prototype, "updateWorkspace", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete workspace' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Workspace deleted' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Workspace not found' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Access denied' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], WorkspaceController.prototype, "deleteWorkspace", null);
__decorate([
    (0, common_1.Get)(':id/members'),
    (0, swagger_1.ApiOperation)({ summary: 'Get workspace members' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of workspace members' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Workspace not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], WorkspaceController.prototype, "getWorkspaceMembers", null);
__decorate([
    (0, common_1.Post)(':id/members'),
    (0, swagger_1.ApiOperation)({ summary: 'Add member to workspace' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Member added' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Workspace not found' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Access denied' }),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, AddWorkspaceMemberDto, String]),
    __metadata("design:returntype", Promise)
], WorkspaceController.prototype, "addWorkspaceMember", null);
__decorate([
    (0, common_1.Patch)(':id/members/:userId'),
    (0, swagger_1.ApiOperation)({ summary: 'Update workspace member role' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Member role updated' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Workspace or member not found' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Access denied' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('userId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, UpdateWorkspaceMemberRoleDto, String]),
    __metadata("design:returntype", Promise)
], WorkspaceController.prototype, "updateWorkspaceMemberRole", null);
__decorate([
    (0, common_1.Delete)(':id/members/:userId'),
    (0, swagger_1.ApiOperation)({ summary: 'Remove member from workspace' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Member removed' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Workspace or member not found' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Access denied' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('userId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], WorkspaceController.prototype, "removeWorkspaceMember", null);
__decorate([
    (0, common_1.Get)(':id/sub-access'),
    (0, swagger_1.ApiOperation)({ summary: 'List delegated sub-access users for workspace' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of delegated users and access levels' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], WorkspaceController.prototype, "listWorkspaceSubAccess", null);
__decorate([
    (0, common_1.Post)(':id/sub-access'),
    (0, swagger_1.ApiOperation)({ summary: 'Grant delegated sub-access to workspace' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Sub-access granted' }),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, SetWorkspaceSubAccessDto, String]),
    __metadata("design:returntype", Promise)
], WorkspaceController.prototype, "grantWorkspaceSubAccess", null);
__decorate([
    (0, common_1.Patch)(':id/sub-access/:userId'),
    (0, swagger_1.ApiOperation)({ summary: 'Update delegated sub-access level' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Sub-access updated' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('userId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, UpdateWorkspaceSubAccessDto, String]),
    __metadata("design:returntype", Promise)
], WorkspaceController.prototype, "updateWorkspaceSubAccess", null);
__decorate([
    (0, common_1.Delete)(':id/sub-access/:userId'),
    (0, swagger_1.ApiOperation)({ summary: 'Revoke delegated sub-access' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Sub-access revoked' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('userId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], WorkspaceController.prototype, "revokeWorkspaceSubAccess", null);
__decorate([
    (0, common_1.Get)(':id/domains'),
    (0, swagger_1.ApiOperation)({ summary: 'List workspace custom domains' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Workspace domains' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], WorkspaceController.prototype, "getWorkspaceDomains", null);
__decorate([
    (0, common_1.Post)(':id/domains'),
    (0, swagger_1.ApiOperation)({ summary: 'Add workspace custom domain' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Workspace domain created' }),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, CreateWorkspaceDomainDto, String]),
    __metadata("design:returntype", Promise)
], WorkspaceController.prototype, "addWorkspaceDomain", null);
__decorate([
    (0, common_1.Delete)(':id/domains/:domainId'),
    (0, swagger_1.ApiOperation)({ summary: 'Remove workspace custom domain' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Workspace domain removed' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('domainId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], WorkspaceController.prototype, "removeWorkspaceDomain", null);
__decorate([
    (0, common_1.Post)(':id/domains/:domainId/verify'),
    (0, swagger_1.ApiOperation)({ summary: 'Verify workspace custom domain DNS state' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Workspace domain verification result' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('domainId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], WorkspaceController.prototype, "verifyWorkspaceDomain", null);
__decorate([
    (0, common_1.Get)(':id/bookmarks'),
    (0, swagger_1.ApiOperation)({ summary: 'List workspace bookmarks' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Workspace bookmarks' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], WorkspaceController.prototype, "getWorkspaceBookmarks", null);
__decorate([
    (0, common_1.Post)(':id/bookmarks'),
    (0, swagger_1.ApiOperation)({ summary: 'Add workspace bookmark' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Workspace bookmark created' }),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, CreateWorkspaceBookmarkDto, String]),
    __metadata("design:returntype", Promise)
], WorkspaceController.prototype, "addWorkspaceBookmark", null);
__decorate([
    (0, common_1.Patch)(':id/bookmarks/:bookmarkId'),
    (0, swagger_1.ApiOperation)({ summary: 'Update workspace bookmark' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Workspace bookmark updated' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('bookmarkId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, UpdateWorkspaceBookmarkDto, String]),
    __metadata("design:returntype", Promise)
], WorkspaceController.prototype, "updateWorkspaceBookmark", null);
__decorate([
    (0, common_1.Delete)(':id/bookmarks/:bookmarkId'),
    (0, swagger_1.ApiOperation)({ summary: 'Remove workspace bookmark' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Workspace bookmark removed' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('bookmarkId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], WorkspaceController.prototype, "removeWorkspaceBookmark", null);
__decorate([
    (0, common_1.Get)(':id/assets'),
    (0, swagger_1.ApiOperation)({ summary: 'Get workspace asset exposure summary' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Workspace asset summary' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Workspace not found' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Access denied' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, common_1.Query)('project')),
    __param(3, (0, common_1.Query)('timelineTrack')),
    __param(4, (0, common_1.Query)('assetSearch')),
    __param(5, (0, common_1.Query)('assetPage')),
    __param(6, (0, common_1.Query)('assetPageSize')),
    __param(7, (0, common_1.Query)('eventPage')),
    __param(8, (0, common_1.Query)('eventPageSize')),
    __param(9, (0, common_1.Query)('projectLimit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], WorkspaceController.prototype, "getWorkspaceAssets", null);
__decorate([
    (0, common_1.Get)(':id/projects'),
    (0, swagger_1.ApiOperation)({ summary: 'Get workspace projects' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of projects in the workspace' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Workspace not found' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Access denied' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], WorkspaceController.prototype, "getWorkspaceProjects", null);
exports.WorkspaceController = WorkspaceController = WorkspaceController_1 = __decorate([
    (0, swagger_1.ApiTags)('workspaces'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('workspaces'),
    (0, common_1.UseGuards)(secure_auth_guard_1.SecureAuthGuard),
    __param(1, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [database_1.DatabaseService,
        unified_ledger_service_1.UnifiedLedgerService])
], WorkspaceController);
//# sourceMappingURL=workspace.controller.js.map