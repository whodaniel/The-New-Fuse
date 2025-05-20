import React from 'react';
import { AgentModule } from './agents/AgentModule.js';
import { TimelineModule } from '../features/timeline/TimelineModule.js';
import { AnalyticsModule } from './analytics/AnalyticsModule.js';
import { APIModule } from './api/APIModule.js';
import { AuthenticationModule } from './auth/AuthenticationModule.js';
import { CommunicationModule } from './communication/CommunicationModule.js';
import { DataModule } from './data/DataModule.js';
import { MarketplaceModule } from './marketplace/MarketplaceModule.js';
import { SettingsModule } from './settings/SettingsModule.js';
import { WorkflowModule } from './workflow/WorkflowModule.js';

export const FeaturesModule: React.FC = () => {
  return (
    <div className="features-container">
      <AgentModule />
      <TimelineModule />
      <AnalyticsModule />
      <APIModule />
      <AuthenticationModule />
      <CommunicationModule />
      <DataModule />
      <MarketplaceModule />
      <SettingsModule />
      <WorkflowModule />
    </div>
  );
};