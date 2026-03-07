export const analysisSchema = {
  type: 'object',
  properties: {
    summary: {
      type: 'string',
      description: 'Brief summary of analysis',
    },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          category: { type: 'string' },
          description: { type: 'string' },
          severity: {
            type: 'string',
            enum: ['low', 'medium', 'high'],
          },
          recommendations: {
            type: 'array',
            items: { type: 'string' },
          },
        },
        required: ['category', 'description', 'severity'],
      },
    },
    metadata: {
      type: 'object',
      properties: {
        timestamp: {
          type: 'string',
          format: 'date-time',
        },
        version: { type: 'string' },
      },
    },
  },
  required: ['summary', 'findings'],
};

export const workflowSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    description: { type: 'string' },
    steps: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          type: { type: 'string' },
          config: { type: 'object' },
        },
        required: ['id', 'type'],
      },
    },
  },
  required: ['name', 'steps'],
};
