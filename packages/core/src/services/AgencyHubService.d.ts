import { LoggingService } from './LoggingService';
export interface Agency {
    id: string;
    name: string;
    description: string;
    type: 'individual' | 'team' | 'enterprise';
    status: 'active' | 'inactive' | 'suspended';
    owner_id: string;
    created_at: Date;
    updated_at: Date;
    settings: AgencySettings;
    metadata: Record<string, any>;
}
export interface AgencySettings {
    public_profile: boolean;
    allow_collaboration: boolean;
    max_agents: number;
    max_workflows: number;
    api_access_enabled: boolean;
    webhook_endpoints: string[];
    integrations_enabled: string[];
}
export interface AgencyMember {
    id: string;
    agency_id: string;
    user_id: string;
    role: 'owner' | 'admin' | 'member' | 'viewer';
    permissions: string[];
    joined_at: Date;
    last_active: Date;
    status: 'active' | 'inactive' | 'pending';
}
export interface AgencyInvitation {
    id: string;
    agency_id: string;
    inviter_id: string;
    email: string;
    role: AgencyMember['role'];
    permissions: string[];
    status: 'pending' | 'accepted' | 'declined' | 'expired';
    created_at: Date;
    expires_at: Date;
    accepted_at?: Date;
}
export interface AgencyStats {
    total_agencies: number;
    active_agencies: number;
    total_members: number;
    active_members: number;
    pending_invitations: number;
    agencies_by_type: Record<Agency['type'], number>;
}
export declare class AgencyHubService {
    private readonly logger;
    private agencies;
    private members;
    private invitations;
    constructor(logger: LoggingService);
    createAgency(data: {
        name: string;
        description: string;
        type: Agency['type'];
        owner_id: string;
        settings?: Partial<AgencySettings>;
        metadata?: Record<string, any>;
    }): Promise<Agency>;
    getAgency(id: string): Promise<Agency | null>;
    getAgencies(filter?: {
        owner_id?: string;
        type?: Agency['type'];
        status?: Agency['status'];
        public_only?: boolean;
        limit?: number;
    }): Promise<Agency[]>;
    updateAgency(id: string, updates: Partial<Omit<Agency, 'id' | 'created_at' | 'owner_id'>>): Promise<Agency | null>;
    deleteAgency(id: string): Promise<boolean>;
    getMembers(agency_id: string): Promise<AgencyMember[]>;
    updateMember(member_id: string, updates: Partial<Omit<AgencyMember, 'id' | 'agency_id' | 'user_id' | 'joined_at'>>): Promise<AgencyMember | null>;
    removeMember(member_id: string): Promise<boolean>;
    inviteMember(data: {
        agency_id: string;
        inviter_id: string;
        email: string;
        role: AgencyMember['role'];
        permissions: string[];
        expires_in_hours?: number;
    }): Promise<AgencyInvitation | null>;
}
export default AgencyHubService;
//# sourceMappingURL=AgencyHubService.d.ts.map