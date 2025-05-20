"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentForm = void 0;
import react_hook_form_1 from 'react-hook-form';
import zod_1 from '@hookform/resolvers/zod';
const z = __importStar(require("zod"));
import button_1 from '@/components/ui/button';
import form_1 from '@/components/ui/form';
import select_1 from '@/components/ui/select';
const personalityTraits = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'];
const agentFormSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().min(1, 'Description is required'),
    capabilities: z.array(z.string()).min(1, 'At least one capability is required'),
    personality: z.object({
        openness: z.number().min(0).max(100),
        conscientiousness: z.number().min(0).max(100),
        extraversion: z.number().min(0).max(100),
        agreeableness: z.number().min(0).max(100),
        neuroticism: z.number().min(0).max(100),
    }),
});
const AgentForm = ({ onSubmit, initialValues }) => {
    var _a, _b, _c, _d, _e;
    const form = (0, react_hook_form_1.useForm)({
        resolver: (0, zod_1.zodResolver)(agentFormSchema),
        defaultValues: {
            name: (initialValues === null || initialValues === void 0 ? void 0 : initialValues.name) || '',
            description: (initialValues === null || initialValues === void 0 ? void 0 : initialValues.description) || '',
            capabilities: (initialValues === null || initialValues === void 0 ? void 0 : initialValues.capabilities) || [],
            personality: {
                openness: ((_a = initialValues === null || initialValues === void 0 ? void 0 : initialValues.personality) === null || _a === void 0 ? void 0 : _a.openness) || 50,
                conscientiousness: ((_b = initialValues === null || initialValues === void 0 ? void 0 : initialValues.personality) === null || _b === void 0 ? void 0 : _b.conscientiousness) || 50,
                extraversion: ((_c = initialValues === null || initialValues === void 0 ? void 0 : initialValues.personality) === null || _c === void 0 ? void 0 : _c.extraversion) || 50,
                agreeableness: ((_d = initialValues === null || initialValues === void 0 ? void 0 : initialValues.personality) === null || _d === void 0 ? void 0 : _d.agreeableness) || 50,
                neuroticism: ((_e = initialValues === null || initialValues === void 0 ? void 0 : initialValues.personality) === null || _e === void 0 ? void 0 : _e.neuroticism) || 50,
            },
        },
    });
    return ({ ...form } >
        onSubmit) = { form, : .handleSubmit(onSubmit) };
    className = "space-y-6" >
        control;
    {
        form.control;
    }
    name = "name";
    render = {}({ field });
};
exports.AgentForm = AgentForm;
(Name < /FormLabel>
    < form_1.FormControl >
    { ...field } /  >
    /FormControl>
    < form_1.FormMessage /  >
    /FormItem>)}/ >
    control) = { form, : .control };
name = "description";
render = {}({ field });
(Description < /FormLabel>
    < form_1.FormControl >
    { ...field } /  >
    /FormControl>
    < form_1.FormMessage /  >
    /FormItem>)}/ >
    control) = { form, : .control };
name = "capabilities";
render = {}({ field });
(Capabilities < /FormLabel>
    < form_1.FormControl >
    onValueChange) = {}(value);
{
    const values = field.value || [];
    const newValues = values.includes(value)
        ? values.filter((v) => v !== value)
        : [...values, value];
    field.onChange(newValues);
}
 >
    placeholder;
"Select capabilities" /  >
    /SelectTrigger>
    < select_1.SelectContent >
    value;
"conversation" > Conversation < /SelectItem>
    < select_1.SelectItem;
value = "task_execution" > Task;
Execution < /SelectItem>
    < select_1.SelectItem;
value = "code_generation" > Code;
Generation < /SelectItem>
    < select_1.SelectItem;
value = "data_analysis" > Data;
Analysis < /SelectItem>
    < /SelectContent>
    < /Select>
    < /FormControl>
    < form_1.FormMessage /  >
    /FormItem>)}/ >
    className;
"space-y-4" >
    className;
"text-lg font-medium" > Personality;
Traits < /h3>;
{
    personalityTraits.map((trait) => key = { trait }, control = { form, : .control }, name = {} `personality.${trait}`);
}
render = {}({ field });
className = "capitalize" > { trait } < /FormLabel>
    < form_1.FormControl >
    type;
"range";
min = { 0:  };
max = { 100:  };
value = { field, : .value };
onChange = {}(e);
field.onChange(Number(e.target.value));
/>
    < /FormControl>
    < div;
className = "flex justify-between text-sm text-muted-foreground" >
    0 < /span>
    < span > { field, : .value } < /span>
    < span > 100 < /span>
    < /div>
    < form_1.FormMessage /  >
    /FormItem>)}/ > ;
/div>
    < button_1.Button;
type = "submit" > Save;
Agent < /Button>
    < /form>
    < /Form>;
;
;
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map