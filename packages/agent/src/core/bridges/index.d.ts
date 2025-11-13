export declare enum MessageType {
    TASK = "TASK",
    RESULT = "RESULT",
    STATUS = "STATUS",
    ERROR = "ERROR",
    HEARTBEAT = "HEARTBEAT"
}
export declare enum Priority {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    URGENT = "URGENT"
}
export declare abstract class BaseBridge {
    abstract sendMessage(message: Record<string, unknown>, messageType: MessageType, priority: Priority): Promise<void>;
    abstract receiveMessage(): Promise<Record<string, unknown>>;
    abstract connect(): Promise<void>;
    abstract disconnect(): Promise<void>;
    abstract isConnected(): boolean;
}
//# sourceMappingURL=index.d.ts.map