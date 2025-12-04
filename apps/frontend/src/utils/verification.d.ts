export declare class OutputVerifier {
    constructor();
    verifySchema(output: any): {
        success: boolean;
        type: any;
        message: string;
        details: {
            receivedType: "string" | "number" | "bigint" | "boolean" | "symbol" | "undefined" | "object" | "function";
            missingField?: undefined;
            field?: undefined;
            expectedType?: undefined;
        };
    } | {
        success: boolean;
        type: any;
        message: string;
        details: {
            missingField: string;
            receivedType?: undefined;
            field?: undefined;
            expectedType?: undefined;
        };
    } | {
        success: boolean;
        type: any;
        message: string;
        details: {
            field: string;
            expectedType: any;
            receivedType: any;
            missingField?: undefined;
        };
    } | {
        success: boolean;
        type: any;
        message: string;
        details?: undefined;
    };
    verifyContent(output: any): {
        success: boolean;
        type: any;
        message: string;
        details: {
            content: any;
            missingFields?: undefined;
        };
    } | {
        success: boolean;
        type: any;
        message: string;
        details: {
            missingFields: string[];
            content?: undefined;
        };
    } | {
        success: boolean;
        type: any;
        message: string;
        details?: undefined;
    };
    verifySecurity(output: any): {
        success: boolean;
        type: any;
        message: string;
        details: {
            patterns: any;
        };
    } | {
        success: boolean;
        type: any;
        message: string;
        details?: undefined;
    };
    verifyHarmlessness(output: any): {
        success: boolean;
        type: any;
        message: string;
        details: {
            patterns: any;
        };
    } | {
        success: boolean;
        type: any;
        message: string;
        details?: undefined;
    };
    verifyAll(output: any): ({
        success: boolean;
        type: any;
        message: string;
        details: {
            receivedType: "string" | "number" | "bigint" | "boolean" | "symbol" | "undefined" | "object" | "function";
            missingField?: undefined;
            field?: undefined;
            expectedType?: undefined;
        };
    } | {
        success: boolean;
        type: any;
        message: string;
        details: {
            missingField: string;
            receivedType?: undefined;
            field?: undefined;
            expectedType?: undefined;
        };
    } | {
        success: boolean;
        type: any;
        message: string;
        details: {
            field: string;
            expectedType: any;
            receivedType: any;
            missingField?: undefined;
        };
    } | {
        success: boolean;
        type: any;
        message: string;
        details?: undefined;
    } | {
        success: boolean;
        type: any;
        message: string;
        details: {
            content: any;
            missingFields?: undefined;
        };
    } | {
        success: boolean;
        type: any;
        message: string;
        details: {
            missingFields: string[];
            content?: undefined;
        };
    } | {
        success: boolean;
        type: any;
        message: string;
        details: {
            patterns: any;
        };
    })[];
}
