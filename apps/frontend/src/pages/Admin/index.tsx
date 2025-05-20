import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './AdminLayout.js';
const Dashboard = React.lazy(() => import('./Dashboard.js'));
const Users = React.lazy(() => import('./Users.js'));
const Workspaces = React.lazy(() => import('./Workspaces.js'));
const SystemHealth = React.lazy(() => import('./SystemHealth.js'));
const Settings = React.lazy(() => import('./Settings.js'));
const Onboarding = React.lazy(() => import('./Onboarding.js'));
const AdminIndex = (): any => {
    return (<Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<Navigate to="dashboard" replace/>}/>
        <Route path="dashboard" element={<Dashboard />}/>
        <Route path="users" element={<Users />}/>
        <Route path="workspaces" element={<Workspaces />}/>
        <Route path="system-health" element={<SystemHealth />}/>
        <Route path="settings" element={<Settings />}/>
        <Route path="onboarding" element={<Onboarding />}/>
      </Route>
    </Routes>);
};
export default AdminIndex;
//# sourceMappingURL=index.js.map