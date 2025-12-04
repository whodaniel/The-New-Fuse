import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { webSocketService } from '../services/websocket';
function AgentPersonalityCustomizer(_a) {
    var agentId = _a.agentId;
    var _b = useState(50), openness = _b[0], setOpenness = _b[1];
    var _c = useState(50), conscientiousness = _c[0], setConscientiousness = _c[1];
    var _d = useState(50), extraversion = _d[0], setExtraversion = _d[1];
    var _e = useState(50), agreeableness = _e[0], setAgreeableness = _e[1];
    var _f = useState(50), neuroticism = _f[0], setNeuroticism = _f[1];
    var traits = [
        { name: 'Openness', value: openness, description: '' },
        { name: 'Conscientiousness', value: conscientiousness, description: '' },
        { name: 'Extraversion', value: extraversion, description: '' },
        { name: 'Agreeableness', value: agreeableness, description: '' },
        { name: 'Neuroticism', value: neuroticism, description: '' },
    ];
    var handleSave = function () {
        var personality = {
            openness: openness,
            conscientiousness: conscientiousness,
            extraversion: extraversion,
            agreeableness: agreeableness,
            neuroticism: neuroticism
        };
        webSocketService.send('updateAgentPersonality', { agentId: agentId, personality: personality });
    };
    var handleTraitChange = function (traitName, value) {
        switch (traitName) {
            case 'Openness':
                setOpenness(value);
                break;
            case 'Conscientiousness':
                setConscientiousness(value);
                break;
            case 'Extraversion':
                setExtraversion(value);
                break;
            case 'Agreeableness':
                setAgreeableness(value);
                break;
            case 'Neuroticism':
                setNeuroticism(value);
                break;
            default:
                break;
        }
    };
    return (_jsxs(Card, { className: "w-full max-w-md", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Customize Agent Personality" }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsx("div", { className: "space-y-6", children: traits.map(function (trait) { return (_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx(Label, { children: trait.name }), _jsx("span", { className: "text-sm text-muted-foreground", children: trait.value })] }), _jsx(Slider, { defaultValue: [trait.value], min: 0, max: 100, step: 1, onValueChange: function (values) { return handleTraitChange(trait.name, values[0]); }, className: "w-full" }), _jsx("p", { className: "text-sm text-muted-foreground", children: trait.description })] }, trait.name)); }) }), _jsx("button", { onClick: handleSave, className: "w-full", children: "Save Personality" })] })] }));
}
export default AgentPersonalityCustomizer;
