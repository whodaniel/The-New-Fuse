export interface Schema {
    version: string;
    schemaType: string;
}
export interface Migration {
    schemaType: string;
    fromVersion: string;
    toVersion: string;
    migrate: (data: unknown) => Promise<unknown>;
}
export interface MigrationPath {
    migrations: Migration[];
    finalVersion: string;
}
export interface SchemaVersionMap {
    [schemaType: string]: {
        [version: string]: Migration;
    };
}
