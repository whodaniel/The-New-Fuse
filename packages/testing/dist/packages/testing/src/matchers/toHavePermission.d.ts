interface UserWithPermissions {
    id: string;
    permissions?: string[];
    roles?: {
        name: string;
        permissions: string[];
    }[];
}
export declare const toHavePermission: (this: import("expect").MatcherState, received: UserWithPermissions, ...args: any[]) => Promise<import("./utils.js").CustomMatcherResult>;
export {};
//# sourceMappingURL=toHavePermission.d.ts.map