"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgencyHubService = void 0;
const common_1 = require("@nestjs/common");
const LoggingService_1 = require("./LoggingService");
let AgencyHubService = class AgencyHubService {
    logger;
    agencies = new Map();
    members = new Map();
    invitations = new Map();
    constructor(logger) {
        this.logger = logger;
        this.logger.log('AgencyHubService initialized', 'AgencyHubService');
        this.startCleanupTimer();
    }
    async createAgency(data) {
        const agency = {
            id: `agency_${Date.now()}_${Math.random().toString(36).substr(2, 9)},
      name: data.name,
      description: data.description,
      type: data.type,
      status: 'active',
      owner_id: data.owner_id,
      created_at: new Date(),
      updated_at: new Date(),
      settings: {
        public_profile: false,
        allow_collaboration: true,
        max_agents: this.getDefaultMaxAgents(data.type),
        max_workflows: this.getDefaultMaxWorkflows(data.type),
        api_access_enabled: data.type !== 'individual',
        webhook_endpoints: [],
        integrations_enabled: [],
        ...data.settings
      },
      metadata: data.metadata || {}
    };

    this.agencies.set(agency.id, agency);

    // Add owner as member
    await this.addMember(agency.id, data.owner_id, 'owner', this.getOwnerPermissions());
`,
            this: .logger.log(Agency, created, $, { data, : .name } ` (${agency.id}`), 'AgencyHubService': 
        };
        return agency;
    }
    async getAgency(id) {
        return this.agencies.get(id) || null;
    }
    async getAgencies(filter = {}) {
        let agencies = Array.from(this.agencies.values());
        if (filter.owner_id) {
            agencies = agencies.filter(a => a.owner_id === filter.owner_id);
        }
        if (filter.type) {
            agencies = agencies.filter(a => a.type === filter.type);
        }
        if (filter.status) {
            agencies = agencies.filter(a => a.status === filter.status);
        }
        if (filter.public_only) {
            agencies = agencies.filter(a => a.settings.public_profile);
        }
        agencies.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
        return agencies.slice(0, filter.limit || 100);
    }
    async updateAgency(id, updates) {
        const agency = this.agencies.get(id);
        if (!agency) {
            return null;
        }
        Object.assign(agency, updates, { updated_at: new Date() });
        this.logger.log(Agency, updated, $, { agency, : .name }($, { id }), 'AgencyHubService');
        return agency;
    }
    async deleteAgency(id) {
        const agency = this.agencies.get(id);
        if (!agency) {
            return false;
        }
        // Remove all members
        const agency_members = Array.from(this.members.values())
            .filter(m => m.agency_id === id);
        agency_members.forEach(member => this.members.delete(member.id));
        // Cancel pending invitations
        const pending_invitations = Array.from(this.invitations.values())
            .filter(inv => inv.agency_id === id && inv.status === 'pending');
        pending_invitations.forEach(inv => {
            inv.status = 'expired';
        });
        this.agencies.delete(id);
        `
    this.logger.log(`;
        Agency;
        deleted: $;
        {
            agency.name;
        }
        ($);
        {
            id;
        }
        `, 'AgencyHubService');
    
    return true;
  }

  async addMember(agency_id: string, user_id: string, role: AgencyMember['role'], permissions: string[]): Promise<AgencyMember | null> {
    const agency = this.agencies.get(agency_id);
    if (!agency) {
      return null;
    }

    // Check if user is already a member
    const existing_member = Array.from(this.members.values())
      .find(m => m.agency_id === agency_id && m.user_id === user_id);
    
    if (existing_member) {
      return existing_member;
    }

    const member: AgencyMember = {
      id: member_${Date.now()}_${Math.random().toString(36).substr(2, 9)},
      agency_id,
      user_id,
      role,
      permissions,
      joined_at: new Date(),
      last_active: new Date(),
      status: 'active'
    };

    this.members.set(member.id, member);`;
        this.logger.log(Member, added, to, agency, $, { agency_id }, $, { user_id } ` (${role}`), 'AgencyHubService';
        ;
        return member;
    }
    async getMembers(agency_id) {
        return Array.from(this.members.values())
            .filter(m => m.agency_id === agency_id)
            .sort((a, b) => a.joined_at.getTime() - b.joined_at.getTime());
    }
    async updateMember(member_id, updates) {
        const member = this.members.get(member_id);
        if (!member) {
            return null;
        }
        Object.assign(member, updates);
        this.logger.log(Member, updated, $, { member_id }, 'AgencyHubService');
        return member;
    }
    async removeMember(member_id) {
        const member = this.members.get(member_id);
        if (!member) {
            return false;
        }
        // Don't allow removing the owner
        if (member.role === 'owner') {
            return false;
        }
        this.members.delete(member_id);
        `
    this.logger.log(`;
        Member;
        removed: $;
        {
            member_id;
        }
        'AgencyHubService';
        ;
        return true;
    }
    async inviteMember(data) {
        const agency = this.agencies.get(data.agency_id);
        if (!agency) {
            return null;
            `
    }`;
            const invitation = {
                id: invitation_$
            }, { Date, now };
            ();
        }
        `_${Math.random().toString(36).substr(2, 9)}`,
            agency_id;
        data.agency_id,
            inviter_id;
        data.inviter_id,
            email;
        data.email,
            role;
        data.role,
            permissions;
        data.permissions,
            status;
        'pending',
            created_at;
        new Date(),
            expires_at;
        new Date(Date.now() + (data.expires_in_hours || 72) * 60 * 60 * 1000);
    }
    ;
};
exports.AgencyHubService = AgencyHubService;
exports.AgencyHubService = AgencyHubService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [LoggingService_1.LoggingService])
], AgencyHubService);
this.invitations.set(invitation.id, invitation);
this.logger.log(Invitation, sent);
for (agency; $; { data, : .agency_id })
    : $;
{
    data.email;
}
'AgencyHubService';
;
return invitation;
async;
getInvitations(agency_id, string, status ?  : AgencyInvitation['status']);
Promise < AgencyInvitation[] > {
    let, invitations = Array.from(this.invitations.values())
        .filter(inv => inv.agency_id === agency_id),
    if(status) {
        invitations = invitations.filter(inv => inv.status === status);
    },
    return: invitations.sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
};
async;
acceptInvitation(invitation_id, string, user_id, string);
Promise < AgencyMember | null > {
    const: invitation = this.invitations.get(invitation_id),
    if(, invitation) { }
} || invitation.status !== 'pending';
{
    return null;
}
if (invitation.expires_at <= new Date()) {
    invitation.status = 'expired';
    return null;
}
invitation.status = 'accepted';
invitation.accepted_at = new Date();
const member = await this.addMember(invitation.agency_id, user_id, invitation.role, invitation.permissions);
`
    this.logger.log(Invitation accepted: ${invitation_id}`, 'AgencyHubService';
;
return member;
async;
declineInvitation(invitation_id, string);
Promise < boolean > {
    const: invitation = this.invitations.get(invitation_id),
    if(, invitation) { }
} || invitation.status !== 'pending';
{
    return false;
}
invitation.status = 'declined';
this.logger.log(Invitation, declined, $, { invitation_id } ``, 'AgencyHubService');
return true;
async;
getUserAgencies(user_id, string);
Promise < Agency[] > {
    const: user_memberships = Array.from(this.members.values())
        .filter(m => m.user_id === user_id && m.status === 'active'),
    const: agencies, Agency, []:  = [],
    for(, membership, of, user_memberships) {
        const agency = this.agencies.get(membership.agency_id);
        if (agency) {
            agencies.push(agency);
        }
    },
    return: agencies.sort((a, b) => b.updated_at.getTime() - a.updated_at.getTime())
};
async;
getStats();
Promise < AgencyStats > {
    const: agencies = Array.from(this.agencies.values()),
    const: members = Array.from(this.members.values()),
    const: invitations = Array.from(this.invitations.values()),
    const: agencies_by_type, ['type']: , number
} > ;
{
    individual: 0,
        team;
    0,
        enterprise;
    0;
}
;
agencies.forEach(agency => {
    agencies_by_type[agency.type]++;
});
return {
    total_agencies: agencies.length,
    active_agencies: agencies.filter(a => a.status === 'active').length,
    total_members: members.length,
    active_members: members.filter(m => m.status === 'active').length,
    pending_invitations: invitations.filter(inv => inv.status === 'pending').length,
    agencies_by_type
};
getDefaultMaxAgents(type, Agency['type']);
number;
{
    switch (type) {
        case 'individual': return 5;
        case 'team': return 25;
        case 'enterprise': return 100;
        default: return 5;
    }
}
getDefaultMaxWorkflows(type, Agency['type']);
number;
{
    switch (type) {
        case 'individual': return 10;
        case 'team': return 50;
        case 'enterprise': return 250;
        default: return 10;
    }
}
getOwnerPermissions();
string[];
{
    return [
        'agency.read',
        'agency.write',
        'agency.delete',
        'members.read',
        'members.write',
        'members.delete',
        'invitations.send',
        'invitations.manage',
        'agents.read',
        'agents.write',
        'agents.delete',
        'workflows.read',
        'workflows.write',
        'workflows.delete',
        'settings.read',
        'settings.write'
    ];
}
startCleanupTimer();
void {
    // Clean up expired invitations every hour
    setInterval() { }
}();
{
    const now = new Date();
    for (const invitation of this.invitations.values()) {
        if (invitation.status === 'pending' && invitation.expires_at <= now) {
            invitation.status = 'expired';
        }
    }
}
60 * 60 * 1000;
;
exports.default = AgencyHubService;
//# sourceMappingURL=AgencyHubService.js.map