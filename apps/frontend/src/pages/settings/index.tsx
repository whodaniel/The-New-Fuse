"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
import react_1 from 'react';
import react_router_dom_1 from 'react-router-dom';
import BaseLayout_1 from '@/components/layout/BaseLayout';
import core_1 from '@/components/core';
// Lazy load settings components
const General = react_1.default.lazy(() => Promise.resolve().then(() => require('./General')));
const Appearance = react_1.default.lazy(() => Promise.resolve().then(() => require('./Appearance')));
const API = react_1.default.lazy(() => Promise.resolve().then(() => require('./API')));
const Security = react_1.default.lazy(() => Promise.resolve().then(() => require('./Security')));
const Notifications = react_1.default.lazy(() => Promise.resolve().then(() => require('./Notifications')));
const settingsSections = [
    { path: 'general', title: 'General', description: 'Manage your general settings and preferences' },
    { path: 'appearance', title: 'Appearance', description: 'Customize the look and feel of your workspace' },
    { path: 'api', title: 'API Keys', description: 'Manage your API keys and integrations' },
    { path: 'security', title: 'Security', description: 'Configure security settings and permissions' },
    { path: 'notifications', title: 'Notifications', description: 'Control your notification preferences' },
];
const SettingsHome = () => {
    const location = (0, react_router_dom_1.useLocation)();
    return (<div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {settingsSections.map((section) => (<react_router_dom_1.Link key={section.path} to={section.path}>
            <core_1.Card hover clickable className="h-full">
              <core_1.CardHeader>
                <core_1.CardTitle>{section.title}</core_1.CardTitle>
              </core_1.CardHeader>
              <core_1.CardContent>
                <p className="text-muted-foreground">{section.description}</p>
              </core_1.CardContent>
            </core_1.Card>
          </react_router_dom_1.Link>))}
      </div>
    </div>);
};
const Settings = () => {
    return (<BaseLayout_1.BaseLayout>
      <react_router_dom_1.Routes>
        <react_router_dom_1.Route index element={<SettingsHome />}/>
        <react_router_dom_1.Route path="general" element={<General />}/>
        <react_router_dom_1.Route path="appearance" element={<Appearance />}/>
        <react_router_dom_1.Route path="api" element={<API />}/>
        <react_router_dom_1.Route path="security" element={<Security />}/>
        <react_router_dom_1.Route path="notifications" element={<Notifications />}/>
      </react_router_dom_1.Routes>
    </BaseLayout_1.BaseLayout>);
};
exports.default = Settings;

export {};
