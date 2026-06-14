import { z } from 'zod';
export declare const TwipScopeSchema: z.ZodObject<{
    tenant_id: z.ZodString;
    session_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    workflow_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strict>;
export declare const TwipTraceSchema: z.ZodObject<{
    correlation_id: z.ZodString;
    causation_id: z.ZodNullable<z.ZodString>;
}, z.core.$strict>;
export declare const TwipIdentityProvenanceItemSchema: z.ZodObject<{
    key: z.ZodString;
    value: z.ZodOptional<z.ZodUnknown>;
    source: z.ZodEnum<{
        kernel: "kernel";
        process: "process";
        env: "env";
        multiplexer: "multiplexer";
        gui: "gui";
        derived: "derived";
    }>;
    confidence: z.ZodNumber;
    observed_at: z.ZodString;
}, z.core.$strict>;
export declare const TwipIdentitySchema: z.ZodObject<{
    twid: z.ZodString;
    spec: z.ZodLiteral<"twip/0.1">;
    created_at: z.ZodString;
    incarnation: z.ZodOptional<z.ZodInt>;
    scope: z.ZodObject<{
        tenant_id: z.ZodString;
        host_id: z.ZodString;
        emulator_id: z.ZodString;
        window_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        tab_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        pane_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        session_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.core.$strict>;
    process: z.ZodOptional<z.ZodObject<{
        shell_pid: z.ZodOptional<z.ZodInt>;
        pgid: z.ZodOptional<z.ZodInt>;
        sid: z.ZodOptional<z.ZodInt>;
    }, z.core.$strict>>;
    pty: z.ZodOptional<z.ZodObject<{
        path: z.ZodOptional<z.ZodString>;
        inode: z.ZodOptional<z.ZodInt>;
    }, z.core.$strict>>;
    multiplexer: z.ZodOptional<z.ZodNullable<z.ZodObject<{
        kind: z.ZodEnum<{
            none: "none";
            tmux: "tmux";
            screen: "screen";
        }>;
        session_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        window_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        pane_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.core.$strict>>>;
    provenance: z.ZodArray<z.ZodObject<{
        key: z.ZodString;
        value: z.ZodOptional<z.ZodUnknown>;
        source: z.ZodEnum<{
            kernel: "kernel";
            process: "process";
            env: "env";
            multiplexer: "multiplexer";
            gui: "gui";
            derived: "derived";
        }>;
        confidence: z.ZodNumber;
        observed_at: z.ZodString;
    }, z.core.$strict>>;
    labels: z.ZodOptional<z.ZodArray<z.ZodString>>;
    context_excerpt: z.ZodOptional<z.ZodObject<{
        source: z.ZodEnum<{
            "tmux-capture-pane": "tmux-capture-pane";
            "terminal-history": "terminal-history";
        }>;
        captured_at: z.ZodString;
        line_count: z.ZodInt;
        char_count: z.ZodInt;
        redaction_count: z.ZodInt;
        truncated: z.ZodBoolean;
        text: z.ZodString;
    }, z.core.$strict>>;
}, z.core.$strict>;
export declare const TwipEnvelopeSchema: z.ZodObject<{
    id: z.ZodString;
    spec: z.ZodLiteral<"twip/0.1">;
    type: z.ZodEnum<{
        ERROR: "ERROR";
        "IDENTITY.PUBLISH": "IDENTITY.PUBLISH";
        "IDENTITY.RESOLVE": "IDENTITY.RESOLVE";
        "IDENTITY.RESOLVE.RESULT": "IDENTITY.RESOLVE.RESULT";
        "IDENTITY.REVOKE": "IDENTITY.REVOKE";
        "CAPABILITY.REGISTER": "CAPABILITY.REGISTER";
        "POLICY.DECISION": "POLICY.DECISION";
    }>;
    sent_at: z.ZodString;
    scope: z.ZodObject<{
        tenant_id: z.ZodString;
        session_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        workflow_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.core.$strict>;
    trace: z.ZodObject<{
        correlation_id: z.ZodString;
        causation_id: z.ZodNullable<z.ZodString>;
    }, z.core.$strict>;
    policy: z.ZodOptional<z.ZodObject<{
        ttl_seconds: z.ZodOptional<z.ZodInt>;
        allow_remote_propagation: z.ZodOptional<z.ZodBoolean>;
        redact_gui_fields: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strict>>;
    payload: z.ZodUnion<readonly [z.ZodObject<{
        identity: z.ZodObject<{
            twid: z.ZodString;
            spec: z.ZodLiteral<"twip/0.1">;
            created_at: z.ZodString;
            incarnation: z.ZodOptional<z.ZodInt>;
            scope: z.ZodObject<{
                tenant_id: z.ZodString;
                host_id: z.ZodString;
                emulator_id: z.ZodString;
                window_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                tab_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                pane_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                session_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.core.$strict>;
            process: z.ZodOptional<z.ZodObject<{
                shell_pid: z.ZodOptional<z.ZodInt>;
                pgid: z.ZodOptional<z.ZodInt>;
                sid: z.ZodOptional<z.ZodInt>;
            }, z.core.$strict>>;
            pty: z.ZodOptional<z.ZodObject<{
                path: z.ZodOptional<z.ZodString>;
                inode: z.ZodOptional<z.ZodInt>;
            }, z.core.$strict>>;
            multiplexer: z.ZodOptional<z.ZodNullable<z.ZodObject<{
                kind: z.ZodEnum<{
                    none: "none";
                    tmux: "tmux";
                    screen: "screen";
                }>;
                session_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                window_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                pane_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.core.$strict>>>;
            provenance: z.ZodArray<z.ZodObject<{
                key: z.ZodString;
                value: z.ZodOptional<z.ZodUnknown>;
                source: z.ZodEnum<{
                    kernel: "kernel";
                    process: "process";
                    env: "env";
                    multiplexer: "multiplexer";
                    gui: "gui";
                    derived: "derived";
                }>;
                confidence: z.ZodNumber;
                observed_at: z.ZodString;
            }, z.core.$strict>>;
            labels: z.ZodOptional<z.ZodArray<z.ZodString>>;
            context_excerpt: z.ZodOptional<z.ZodObject<{
                source: z.ZodEnum<{
                    "tmux-capture-pane": "tmux-capture-pane";
                    "terminal-history": "terminal-history";
                }>;
                captured_at: z.ZodString;
                line_count: z.ZodInt;
                char_count: z.ZodInt;
                redaction_count: z.ZodInt;
                truncated: z.ZodBoolean;
                text: z.ZodString;
            }, z.core.$strict>>;
        }, z.core.$strict>;
    }, z.core.$strict>, z.ZodObject<{
        twid: z.ZodString;
    }, z.core.$strict>, z.ZodObject<{
        code: z.ZodString;
        message: z.ZodString;
        retryable: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strict>]>;
    sig: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
export type TwipIdentity = z.infer<typeof TwipIdentitySchema>;
export type TwipEnvelope = z.infer<typeof TwipEnvelopeSchema>;
//# sourceMappingURL=twip.d.ts.map