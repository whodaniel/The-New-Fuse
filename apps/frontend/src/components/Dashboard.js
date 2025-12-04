import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from 'react';
import { useRoute } from '@/contexts/route-context';
import { Card } from '@/components/ui/card';
import { AgentCollaborationDashboard } from '@/components/AgentCollaborationDashboard';
import { SystemMetrics } from '@/components/SystemMetrics';
import { PerformanceMetrics } from '@/components/PerformanceMetrics';
import { TaskBoard } from '@/components/TaskBoard';
import { AgentNetwork } from '@/components/AgentNetwork';
export function Dashboard() {
    var setPageTitle = useRoute().setPageTitle;
    useEffect(function () {
        setPageTitle('Dashboard');
    }, [setPageTitle]);
    return (_jsxs("div", { className: "grid gap-6", children: [_jsx(Card, { className: "p-6", children: _jsx(AgentCollaborationDashboard, {}) }), _jsxs("div", { className: "grid gap-6 md:grid-cols-2", children: [_jsx(Card, { className: "p-6", children: _jsx(SystemMetrics, {}) }), _jsx(Card, { className: "p-6", children: _jsx(PerformanceMetrics, {}) })] }), _jsxs("div", { className: "grid gap-6 md:grid-cols-3", children: [_jsx(Card, { className: "p-6 md:col-span-2", children: _jsx(TaskBoard, {}) }), _jsx(Card, { className: "p-6", children: _jsx(AgentNetwork, {}) })] })] }));
}
