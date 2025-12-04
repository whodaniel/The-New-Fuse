export interface Invite {
    id: string;
    email: string;
    status: string;
    expiresAt: string;
    workspaceId?: string;
}
declare class InviteModel {
    getInvite(id: string): Promise<Invite>;
    acceptInvite(id: string, data: {
        password: string;
    }): Promise<void>;
    createInvite(email: string, workspaceId?: string): Promise<Invite>;
    deleteInvite(id: string): Promise<void>;
}
declare const _default: InviteModel;
export default _default;
