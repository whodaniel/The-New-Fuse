"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
import react_1 from '@chakra-ui/react';
import input_1 from '@/components/ui/input';
const AgentFilters = ({ onFilterChange }) => {
    const handleFilterChange = (field, value) => {
        onFilterChange({
            status: field === 'status' ? value : undefined,
            capability: field === 'capability' ? value : undefined,
            model: field === 'model' ? value : undefined,
            performance: field === 'performance' ? value : undefined,
        });
    };
    return gap = { 4:  };
    width = "100%";
    align = "stretch" >
        mb;
    {
        2;
    }
     > Status < /Text>
        < react_1.Select;
    placeholder = "Select status";
    onChange = {}(e);
};
handleFilterChange('status', e.target.value);
 >
    value;
"active" > Active < /option>
    < option;
value = "idle" > Idle < /option>
    < option;
value = "offline" > Offline < /option>
    < /Select>
    < /Box>
    < react_1.Box >
    mb;
{
    2;
}
 > Capability < /Text>
    < react_1.Select;
placeholder = "Select capability";
onChange = {}(e);
handleFilterChange('capability', e.target.value);
 >
    value;
"conversation" > Conversation < /option>
    < option;
value = "task" > Task;
Execution < /option>
    < option;
value = "learning" > Learning < /option>
    < /Select>
    < /Box>
    < react_1.Box >
    mb;
{
    2;
}
 > Model < /Text>
    < react_1.Select;
placeholder = "Select model";
onChange = {}(e);
handleFilterChange('model', e.target.value);
 >
    value;
"gpt-4" > GPT - 4 < /option>
    < option;
value = "gpt-3.5" > GPT - 3.5 < /option>
    < option;
value = "claude" > Claude < /option>
    < /Select>
    < /Box>
    < react_1.Box >
    mb;
{
    2;
}
 > Performance < /Text>
    < input_1.Input;
type = "number";
min = { 0:  };
max = { 100:  };
onChange = {}(e);
handleFilterChange('performance', parseInt(e.target.value));
placeholder = "Enter minimum performance" /  >
    /Box>
    < /VStack>;
;
;
exports.default = AgentFilters;
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map