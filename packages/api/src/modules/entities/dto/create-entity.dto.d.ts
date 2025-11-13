type JsonValue = string | number | boolean | null | {
    [key: string]: JsonValue;
} | JsonValue[];
export declare class CreateEntityDto {
    name: string;
    type: string;
    metadata?: JsonValue;
}
export {};
//# sourceMappingURL=create-entity.dto.d.ts.map