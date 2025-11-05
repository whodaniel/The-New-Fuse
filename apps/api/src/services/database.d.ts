export interface DatabaseConnection {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
}
export declare class DatabaseService {
    private connections;
    connect(name: string, config: DatabaseConnection): Promise<void>;
    disconnect(name: string): Promise<void>;
    getConnection(name: string): DatabaseConnection | null;
    query(sql: string, params?: any[]): Promise<any[]>;
    transaction<T>(callback: () => Promise<T>): Promise<T>;
}
export declare const databaseService: DatabaseService;
//# sourceMappingURL=database.d.ts.map