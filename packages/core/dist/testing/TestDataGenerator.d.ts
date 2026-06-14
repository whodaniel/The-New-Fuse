export declare class TestDataGenerator {
    /**
     * Generates test data based on a schema.
     * The schema can be a simple string (e.g., 'email'),
     * an array (e.g., ['string']), or a schema object
     * (e.g., { type: 'object', properties: { ... } })
     */
    generate(schema: any): any;
    /**
     * Generates multiple instances of data from a schema.
     */
    generateMany(schema: any, count: number): any[];
    private generateString;
    private generateNumber;
    private generateBoolean;
    private generateArray;
    private generateObject;
}
//# sourceMappingURL=TestDataGenerator.d.ts.map