import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress';
import { useTraining } from '@/hooks/useTraining';
export var AgentTrainingInterface = function () {
    var _a = useState(''), selectedModel = _a[0], setSelectedModel = _a[1];
    var _b = useTraining(), startTraining = _b.startTraining, progress = _b.progress, metrics = _b.metrics;
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs(Card, { className: "p-4", children: [_jsx("h3", { children: "Training Configuration" }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsx(Select, { label: "Base Model", value: selectedModel, onChange: setSelectedModel, options: [
                                    { label: 'GPT-4', value: 'gpt4' },
                                    { label: 'Claude', value: 'claude' },
                                    { label: 'Custom', value: 'custom' }
                                ] }), _jsx(Input, { label: "Training Epochs", type: "number", min: 1, max: 100 }), _jsx(Input, { label: "Learning Rate", type: "number", step: "0.0001" }), _jsx(Input, { label: "Batch Size", type: "number" })] })] }), _jsxs(Card, { className: "p-4", children: [_jsx("h3", { children: "Training Progress" }), _jsx(ProgressBar, { value: progress }), _jsxs("div", { className: "grid grid-cols-3 gap-4 mt-4", children: [_jsxs("div", { children: [_jsx("h4", { children: "Loss" }), _jsx("span", { children: metrics.loss })] }), _jsxs("div", { children: [_jsx("h4", { children: "Accuracy" }), _jsx("span", { children: metrics.accuracy })] }), _jsxs("div", { children: [_jsx("h4", { children: "Time Remaining" }), _jsx("span", { children: metrics.timeRemaining })] })] })] })] }));
};
