import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
export var AgentTrainingArena = function (_a) {
    var agentId = _a.agentId;
    var _b = useState(''), selectedSkill = _b[0], setSelectedSkill = _b[1];
    var _c = useState(0), trainingProgress = _c[0], setTrainingProgress = _c[1];
    var _d = useState(false), isTraining = _d[0], setIsTraining = _d[1];
    var agentSkills = [
        { id: '1', name: 'Natural Language Processing', level: 1 },
        { id: '2', name: 'Computer Vision', level: 1 },
        { id: '3', name: 'Data Analysis', level: 1 },
    ];
    var handleStartTraining = function () {
        if (!selectedSkill)
            return;
        setIsTraining(true);
        var interval = setInterval(function () {
            setTrainingProgress(function (prev) {
                if (prev >= 100) {
                    clearInterval(interval);
                    setIsTraining(false);
                    return 100;
                }
                return prev + 10;
            });
        }, 1000);
    };
    return (_jsx(Card, { className: "p-4", children: _jsxs("div", { className: "flex flex-col gap-4", children: [_jsxs("div", { children: [_jsx("p", { className: "mb-2 text-sm font-medium", children: "Select Skill to Train" }), _jsxs(Select, { value: selectedSkill, onValueChange: setSelectedSkill, disabled: isTraining, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select a skill" }) }), _jsx(SelectContent, { children: agentSkills.map(function (skill) { return (_jsxs(SelectItem, { value: skill.id, children: [skill.name, " (Level ", skill.level, ")"] }, skill.id)); }) })] })] }), isTraining && (_jsxs("div", { children: [_jsx("p", { className: "mb-2 text-sm font-medium", children: "Training Progress" }), _jsx(Progress, { value: trainingProgress, className: "h-2" })] })), _jsx(Button, { variant: "default", onClick: handleStartTraining, disabled: isTraining || !selectedSkill, className: "mt-4", children: isTraining ? 'Training...' : 'Start Training' })] }) }));
};
