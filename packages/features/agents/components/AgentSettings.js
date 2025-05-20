"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
import button_1 from '@/components/ui/button';
import input_1 from '@/components/ui/input';
const AgentSettings = ({ agent }) => {
    const handleSave = async () => ;
    () => ;
    (e) => {
        e.preventDefault();
    };
    return onSubmit = { handleSave } >
        className;
    "space-y-6 p-4" >
        className;
    "space-y-2" >
        className;
    "flex flex-col gap-1.5" >
        className;
    "text-sm font-medium";
    htmlFor = "name" >
        Agent;
    Name
        < /Label>
        < input_1.Input;
    id = "name";
    defaultValue = { agent, : .name } /  >
        /div>
        < /div>
        < div;
    className = "space-y-2" >
        className;
    "flex flex-col gap-1.5" >
        className;
    "text-sm font-medium";
    htmlFor = "description" >
        Description
        < /Label>
        < input_1.Input;
    id = "description";
    defaultValue = { agent, : .description } /  >
        /div>
        < /div>
        < div;
    className = "space-y-2" >
        className;
    "flex flex-col gap-1.5" >
        className;
    "text-sm font-medium";
    htmlFor = "capabilities" >
        Capabilities
        < /Label>
        < input_1.Input;
    id = "capabilities";
    defaultValue = { agent, : .capabilities.join(', ') };
    placeholder = "Enter capabilities separated by commas" /  >
        /div>
        < /div>
        < div;
    className = "space-y-2" >
        className;
    "flex flex-col gap-1.5" >
        className;
    "text-sm font-medium";
    htmlFor = "model" >
        Model
        < /Label>
        < input_1.Input;
    id = "model";
    defaultValue = { agent, : .configuration.model } /  >
        /div>
        < /div>
        < div;
    className = "flex items-center justify-between space-x-2" >
        className;
    "flex items-center space-x-2" >
        id;
    "status";
    defaultChecked = { agent, : .status === 'active' } /  >
        className;
    "text-sm font-medium";
    htmlFor = "status" >
        Active
        < /Label>
        < /div>
        < /div>
        < button_1.Button;
    type = "submit" > Save;
    Changes < /Button>
        < /CardContent>
        < /Card>
        < /form>;
    ;
};
exports.default = AgentSettings;
//# sourceMappingURL=AgentSettings.js.map
//# sourceMappingURL=AgentSettings.js.map