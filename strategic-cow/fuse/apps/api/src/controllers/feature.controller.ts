import { Body, Controller, Get, Param, Patch } from '@nestjs/common';

// Mock Feature Flags
let FEATURE_FLAGS = [
  {
    id: 'new-ui',
    name: 'New UI Layout',
    description: 'Enable the redesigned user interface',
    enabled: true,
    rolloutPercentage: 100,
  },
  {
    id: 'beta-workflows',
    name: 'Beta Workflow Engine',
    description: 'Access to experimental workflow features',
    enabled: false,
    rolloutPercentage: 0,
  },
  {
    id: 'agent-marketplace',
    name: 'Agent Marketplace',
    description: 'Browsable marketplace for agent skills',
    enabled: true,
    rolloutPercentage: 50,
  },
];

@Controller('features')
export class FeatureController {
  @Get()
  async getFeatureFlags() {
    return FEATURE_FLAGS;
  }

  @Patch(':id')
  async updateFeatureFlag(@Param('id') id: string, @Body() body: { enabled: boolean }) {
    const { enabled } = body;

    const index = FEATURE_FLAGS.findIndex((f) => f.id === id);
    if (index === -1) {
      return { success: false, message: 'Feature flag not found' };
    }

    FEATURE_FLAGS[index] = { ...FEATURE_FLAGS[index], enabled };
    return FEATURE_FLAGS[index];
  }
}
