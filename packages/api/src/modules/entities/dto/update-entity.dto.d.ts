type JsonValue = string | number | boolean | null | {
    [key: string]: JsonValue;
} | JsonValue[];
export declare class UpdateEntityDto {
    name?: string;
    type?: string;
    metadata?: JsonValue;
}
export {};
//# sourceMappingURL=update-entity.dto.d.ts.map