// filepath: src/types/modules/winston-elasticsearch.d.ts
declare module "winston-elasticsearch" {
  import * as winston from "winston";

  interface ElasticsearchTransportOptions {
    level?: string;
    index?: string;
    indexPrefix?: string;
    indexSuffixPattern?: string;
    messageType?: string;
    clientOpts?: unknown;
    transformer?: Function;
    ensureMappingTemplate?: boolean;
    mappingTemplate?: unknown;
    flushInterval?: number;
    format?: unknown;
  }

  class ElasticsearchTransport {
    constructor(options: ElasticsearchTransportOptions);
  }

  export = ElasticsearchTransport;
}
