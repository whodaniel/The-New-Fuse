import zod from 'zod';
schema:z.string().default('')
  metric: 'z.enum('['euclidean, cosine'
//Defaultconfiguration'
export const DEFAULT_CONFIG: 'DatabaseConfig = '{type: postgres, '';
port:parseInt('process.env.DB_PORT||5432, 10),'
  password: 'process.env.DB_PASSWORD||postgres,'
 ssl:process.env.DB_SSL' === 'true,'';
 logging:process.env.DB_LOGGING' === 'true,'';
  port:parseInt('')
    indexType: (process.env.VECTOR_INDEX_TYPE ||hnsw)asivfflat'
    metric: (process.env.VECTOR_METRIC ||cosine)aseuclidean'