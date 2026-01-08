import { Card, CardContent, CardHeader, CardTitle } from '@/components/core';
import { BaseLayout } from '@/components/layout/BaseLayout';
import React from 'react';
import { Link, Route, Routes, useLocation } from 'react-router-dom';

// Lazy load settings components
const General = React.lazy(() => import('./General'));
const Appearance = React.lazy(() => import('./Appearance'));
const APIComp = React.lazy(() => import('./API'));
const Security = React.lazy(() => import('./Security'));
const Notifications = React.lazy(() => import('./Notifications'));

const settingsSections = [
  {
    path: 'general',
    title: 'General',
    description: 'Manage your general settings and preferences',
  },
  {
    path: 'appearance',
    title: 'Appearance',
    description: 'Customize the look and feel of your workspace',
  },
  { path: 'api', title: 'API Keys', description: 'Manage your API keys and integrations' },
  {
    path: 'security',
    title: 'Security',
    description: 'Configure security settings and permissions',
  },
  {
    path: 'notifications',
    title: 'Notifications',
    description: 'Control your notification preferences',
  },
];

const SettingsHome = () => {
  const location = useLocation();
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">Manage your account settings and preferences.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {settingsSections.map((section) => (
          <Link key={section.path} to={section.path}>
            <Card hover clickable className="h-full">
              <CardHeader>
                <CardTitle>{section.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{section.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};

const Settings = () => {
  return (
    <BaseLayout>
      <Routes>
        <Route index element={<SettingsHome />} />
        <Route path="general" element={<General />} />
        <Route path="appearance" element={<Appearance />} />
        <Route path="api" element={<APIComp />} />
        <Route path="security" element={<Security />} />
        <Route path="notifications" element={<Notifications />} />
      </Routes>
    </BaseLayout>
  );
};

export default Settings;
