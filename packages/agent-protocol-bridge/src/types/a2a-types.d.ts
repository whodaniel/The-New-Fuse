export interface A2AMessage {
    protocol: 'a2a';
    version: '2.0';
    from: string;
    to: string;
    payload: {
        type: string;
        data: any;
    };
}
//# sourceMappingURL=a2a-types.d.ts.map