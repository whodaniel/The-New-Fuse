import {
  type LedgerRecord,
  type ProjectPlanRecord,
  getPlan,
  linkPlan,
  listPlans,
  listRecords,
  updateRecord,
} from '@/services/unifiedLedgerApi';

type TimelineRecord = LedgerRecord & {
  planId?: string;
  startTime?: string;
  endTime?: string;
  color?: string;
  metadata?: Record<string, unknown>;
};

type TimelinePlan = ProjectPlanRecord & {
  records: TimelineRecord[];
};

type MacroTimelineView = {
  plans: TimelinePlan[];
};

function getMetadataPlanHints(record: TimelineRecord): string[] {
  const metadata = record.metadata;
  if (!metadata || typeof metadata !== 'object') return [];

  const hints: string[] = [];

  const directPlanId = metadata.planId;
  if (typeof directPlanId === 'string' && directPlanId.trim().length > 0) {
    hints.push(directPlanId);
  }

  const linkedPlanIds = metadata.linkedPlanIds;
  if (Array.isArray(linkedPlanIds)) {
    for (const candidate of linkedPlanIds) {
      if (typeof candidate === 'string' && candidate.trim().length > 0) {
        hints.push(candidate);
      }
    }
  }

  return hints;
}

function attachRecordsToPlans(plans: ProjectPlanRecord[], records: TimelineRecord[]): TimelinePlan[] {
  const plansById = new Map(plans.map((plan) => [plan.id, plan]));
  const linkedByPlan = new Map<string, TimelineRecord[]>();
  const assignedRecordIds = new Set<string>();

  for (const plan of plans) {
    linkedByPlan.set(plan.id, []);
  }

  for (const record of records) {
    const planHints = new Set<string>();

    if (record.planId) planHints.add(record.planId);
    for (const hint of getMetadataPlanHints(record)) planHints.add(hint);

    for (const plan of plans) {
      if (plan.linkedRecordIds.includes(record.id)) {
        planHints.add(plan.id);
      }
    }

    for (const planId of planHints) {
      if (!plansById.has(planId)) continue;
      linkedByPlan.get(planId)?.push(record);
      assignedRecordIds.add(record.id);
    }
  }

  const hydratedPlans: TimelinePlan[] = plans.map((plan) => ({
    ...plan,
    records: linkedByPlan.get(plan.id) ?? [],
  }));

  const unassigned = records.filter((record) => !assignedRecordIds.has(record.id));
  if (unassigned.length > 0) {
    hydratedPlans.push({
      id: 'unassigned',
      name: 'Unassigned Pipeline',
      objective: 'Records not linked to a plan yet.',
      owner: 'system',
      status: 'active',
      linkedGoalIds: [],
      linkedRecordIds: unassigned.map((record) => record.id),
      cadence: {
        cycleDays: 7,
        reviewBpm: 60,
        progressPercent: 0,
      },
      createdAt: new Date(0).toISOString(),
      updatedAt: new Date().toISOString(),
      records: unassigned,
    });
  }

  return hydratedPlans;
}

export const timelineApi = {
  async getMacroView(): Promise<MacroTimelineView> {
    const [plans, records] = await Promise.all([
      listPlans(),
      listRecords(),
    ]);

    return {
      plans: attachRecordsToPlans(plans, records as TimelineRecord[]),
    };
  },

  async getPlanTimeline(planId: string): Promise<TimelinePlan | null> {
    const [plan, records] = await Promise.all([getPlan(planId), listRecords()]);
    if (!plan) return null;

    const [hydrated] = attachRecordsToPlans([plan], records as TimelineRecord[]);
    return hydrated ?? { ...plan, records: [] };
  },

  async updateRecordTimeline(
    recordId: string,
    data: { startTime?: string; endTime?: string; color?: string; [key: string]: unknown }
  ): Promise<TimelineRecord | null> {
    return (await updateRecord(recordId, data)) as TimelineRecord | null;
  },

  async linkRecordToPlan(planId: string, recordId: string): Promise<ProjectPlanRecord | null> {
    return linkPlan(planId, { recordId, actor: 'timeline-ui' });
  },
};
