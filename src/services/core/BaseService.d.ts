import { Logger } from "@the-new-fuse/utils";
import { EventEmitter } from '../../utils/EventEmitter.tsx';
export declare abstract class BaseService extends EventEmitter {
  protected readonly logger: Logger;
  protected initialized: boolean;
  constructor(serviceName: string);
  protected initialize(): Promise<void>;
  protected abstract doInitialize(): Promise<void>;
}
