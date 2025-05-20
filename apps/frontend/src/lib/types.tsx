export function castToType(key, value): any {
    const definitions = {
        openAiTemp: {
            cast: (value) => Number(value),
        },
        openAiHistory: {
            cast: (value) => Number(value),
        },
        similarityThreshold: {
            cast: (value) => parseFloat(value),
        },
        topN: {
            cast: (value) => Number(value),
        },
    };
    if (!definitions.hasOwnProperty(key))
        return value;
    return definitions[key].cast(value);
}

export interface JwtAuthConfig {
  version: string;
  algorithm: string;
  secretEnvVar: string;
  tokenExpiration: string;
  issuer: string;
}

export interface ExtensionMessageHeader {
  specVersion: string;
  jwt: string;
  origin: string;
  destination: string;
  timestamp: string;
  signature: string;
}

export interface ExtensionMessagePayload {
  type: 'request' | 'response' | 'event';
  contentType: string;
  body: Record<string, unknown>;
}
//# sourceMappingURL=types.js.map