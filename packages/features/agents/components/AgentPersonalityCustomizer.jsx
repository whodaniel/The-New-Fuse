"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentPersonalityCustomizer = void 0;
import jsx_runtime_1 from 'react/jsx-runtime';
import card_1 from '@/components/ui/card';
const AgentPersonalityCustomizer = ({ agent, onUpdate, }) => {
    const [personality, setPersonality] = useState(agent?.personality || {
        openness: 50,
        conscientiousness: 50,
        extraversion: 50,
        agreeableness: 50,
        neuroticism: 50,
    });
    const [instructions, setInstructions] = useState(agent?.customInstructions || ''), unknown, { return:  };
    (0, jsx_runtime_1.jsx)("div", { className: "text-center p-4", children: "Please select an agent to customize" });
};
exports.AgentPersonalityCustomizer = AgentPersonalityCustomizer;
const handleTraitChange, value;
(trait > {
    setPersonality() { }
}(prev));
({
    ...prev,
    [trait]: value,
});
;
;
const handleSubmit;
;
;
return ((0, jsx_runtime_1.jsxs)(card_1.Card, { children: [(0, jsx_runtime_1.jsx)(card_1.CardContent, { className: true }), " () => ", onUpdate({
            ...agent,
            personality,
            customInstructions, "space-y-6 p-6":  >
                ((0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h3", { className: "text-lg font-medium mb-4", children: "Personality Traits" }), Object.entries(personality).map(([trait, value]) => ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-2 mb-4", children: [(0, jsx_runtime_1.jsxs)("label", { className: "text-sm font-medium capitalize", children: [trait, ": ", value, "%"] }), (0, jsx_runtime_1.jsx)(slider_1.Slider, { value: [value], onValueChange: ([newValue]) => handleTraitChange(trait, newValue), max: 100, step: 1 })] }, trait)))] })
                    ,
                        (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h3", { className: "text-lg font-medium mb-4", children: "Custom Instructions" }), (0, jsx_runtime_1.jsx)(textarea_1.Textarea, { value: instructions, onChange: (e) => setInstructions(e.target.value), placeholder: "Enter custom instructions for the agent...", className: "min-h-[100px]" })] })
                            ,
                                (0, jsx_runtime_1.jsx)(button_1.Button, { onClick: handleSubmit, className: "w-full", children: "Update Agent Personality" }))
        })] }));
card_1.Card >
;
;
;
//# sourceMappingURL=AgentPersonalityCustomizer.js.map