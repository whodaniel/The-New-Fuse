#!/bin/bash

set -e

echo "Fixing OpenAI imports and other TypeScript issues..."

# Create necessary directories for workflow before trying to use them
mkdir -p src/workflow

# Fix OpenAI import issues correctly
echo "Fixing OpenAI imports correctly..."
find src -name "*.ts" | while read -r file; do
  if grep -q "import { OpenAI } from " "$file"; then
    echo "Fixing import in $file"
    perl -i -pe 's/import \{ OpenAI \} from "openai";/import OpenAI from "openai";/g' "$file"
    perl -i -pe "s/import \{ OpenAI \} from 'openai';/import OpenAI from 'openai';/g" "$file"
  fi
done

# Fix isolated modules issues (with properly escaped quotes)
echo "Fixing files without module declarations..."
for file in \
  src/message-handler.ts \
  src/tools/tool_manager.ts \
  src/utils/error-handler.ts
do
  if [ -f "$file" ]; then
    echo "export {};" >> "$file"
    echo "Fixed $file"
  fi
done

# Create missing workflow models file with its parent directory
echo "Creating workflow models file..."
mkdir -p src/workflow
cat > src/workflow/models.ts << 'EOL'
// filepath: src/workflow/models.ts
export interface WorkflowInstance {
  id: string;
  templateId: string;
  name: string;
  status: string;
  steps: Record<string, any>;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  startTime: Date;
  endTime: Date | null;
  error: Record<string, unknown> | null;
  metadata: Record<string, unknown>;
  version: string;
  createdAt: Date;
  createdBy: string;
}

export interface WorkflowContext {
  workflowId: string;
  instanceId: string;
  stepId: string;
  input: Record<string, unknown>;
  state: Record<string, unknown>;
}

export const WorkflowStatus = {
  PENDING: 'PENDING',
  RUNNING: 'RUNNING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED'
};

export const WorkflowError = {
  VALIDATION: 'VALIDATION',
  EXECUTION: 'EXECUTION',
  TIMEOUT: 'TIMEOUT',
  DEPENDENCY: 'DEPENDENCY',
  CANCELLED: 'CANCELLED'
};
EOL

# Create OpenAI provider fix
echo "Creating OpenAI provider fix..."
mkdir -p src/llm/providers
cat > src/llm/providers/OpenAIProvider.ts << 'EOL'
// filepath: src/llm/providers/OpenAIProvider.ts
import OpenAI from 'openai';
import { Logger } from '../../utils/logger';

export class OpenAIProvider {
  private client: OpenAI;
  private logger: Logger;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
    this.logger = new Logger('OpenAIProvider');
  }

  async generateCompletion(prompt: string, options: any = {}): Promise<string> {
    try {
      const response = await this.client.chat.completions.create({
        model: options.model || 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 500
      });

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      this.logger.error(`Error generating completion: ${error}`);
      throw new Error(`Failed to generate completion: ${error}`);
    }
  }
}
EOL

echo "Creating Message type definition..."
mkdir -p src/types
cat > src/types/llm.types.ts << 'EOL'
// filepath: src/types/llm.types.ts

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface MessageOptions {
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface ErrorMessage extends Message {
  id: string;
  timestamp: number;
  source: string;
  payload: any;
}

export interface SystemMessage extends Message {
  metadata?: Record<string, unknown>;
}

export interface UserMessage extends Message {
  userId?: string;
}
EOL

# Fix references to WorkflowInstance in workflow executor if the file exists
if [ -f "src/workflow/executor.ts" ]; then
  echo "Fixing WorkflowInstance import in workflow executor..."
  perl -i -pe 's/Cannot find name '\''WorkflowInstance'\''/import { WorkflowInstance } from '\''\.\/models'\''/g' "src/workflow/executor.ts"
  perl -i -pe 's/Cannot find name '\''instance'\''/const instance = this\.instance/g' "src/workflow/executor.ts"
else
  echo "src/workflow/executor.ts not found, skipping..."
fi

# Create a manual fix utility for OpenAI instances
cat > src/utils/openai-fixes.ts << 'EOL'
// filepath: src/utils/openai-fixes.ts
/**
 * This file provides utility functions to help with OpenAI SDK version compatibility
 */

import OpenAI from 'openai';

/**
 * Create a properly typed OpenAI client instance
 * This helps with the transition from the old { OpenAI } import pattern to the new default import
 */
export function createOpenAIClient(apiKey: string): OpenAI {
  return new OpenAI({ apiKey });
}

/**
 * Fix code that expects the old OpenAI constructor style
 * Example usage:
 *   // Instead of: const openai = new OpenAI({ apiKey: 'your-key' })
 *   const openai = createCompatOpenAI('your-key')
 */
export function createCompatOpenAI(apiKey: string): OpenAI {
  return new OpenAI({ apiKey });
}

/**
 * Create chat completion with proper typing
 */
export async function createChatCompletion(
  client: OpenAI,
  messages: Array<{ role: string; content: string }>,
  options: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
    stream?: boolean;
  } = {}
) {
  const { model = "gpt-3.5-turbo", maxTokens, ...rest } = options;
  
  return client.chat.completions.create({
    model,
    messages,
    max_tokens: maxTokens,
    ...rest
  });
}
EOL

echo "Successfully fixed OpenAI imports and other TypeScript issues."
