import { simpleChatBridge } from './adapters/SimpleChatBridge';
import {
  ProgressiveSelfPrompter,
  type ProgressiveSelfPrompterOptions,
} from '../../shared/progressive-self-prompter';

export class SelfPrompter extends ProgressiveSelfPrompter {
  constructor(options: ProgressiveSelfPrompterOptions = {}) {
    super(simpleChatBridge, options);
  }
}
