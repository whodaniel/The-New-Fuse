// @ts-nocheck
import React from 'react';
import { TimelineModule } from '../features/timeline/TimelineModule';
import { AgentModule } from './agents/AgentModule';
import { AnalyticsModule } from './analytics/AnalyticsModule';
import { APIModule } from './api/APIModule';
import { AuthenticationModule } from './auth/AuthenticationModule';
import { CommunicationModule } from './communication/CommunicationModule';
import { DataModule } from './data/DataModule';
import { MarketplaceModule } from './marketplace/MarketplaceModule';
import { SettingsModule } from './settings/SettingsModule';
import { WorkflowModule } from './workflow/WorkflowModule';

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
