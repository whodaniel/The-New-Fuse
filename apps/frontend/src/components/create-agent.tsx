"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateAgent = CreateAgent;
import react_1 from 'react';
import button_1 from '@/components/ui/button';
import input_1 from '@/components/ui/input';
import label_1 from '@/components/ui/label';
import select_1 from '@/components/ui/select';
import card_1 from '@/components/ui/card';
function CreateAgent() {
    const [name, setName] = (0, react_1.useState)('');
    const [type, setType] = (0, react_1.useState)('');
    const handleSubmit = (e) => {
        e.preventDefault();
        
        setName('');
        setType('');
    };
    return (<card_1.Card className="w-full max-w-md">
      <card_1.CardHeader>
        <card_1.CardTitle>Create New Agent</card_1.CardTitle>
      </card_1.CardHeader>
      <form onSubmit={handleSubmit}>
        <card_1.CardContent className="space-y-4">
          <div className="space-y-2">
            <label_1.Label htmlFor="name">Agent Name</label_1.Label>
            <input_1.Input id="name" value={name} onChange={(e) => setName(e.target.value)} required/>
          </div>
          <div className="space-y-2">
            <label_1.Label htmlFor="type">Agent Type</label_1.Label>
            <select_1.Select value={type} onValueChange={setType} required>
              <select_1.SelectTrigger>
                <select_1.SelectValue placeholder="Select agent type"/>
              </select_1.SelectTrigger>
              <select_1.SelectContent>
                <select_1.SelectItem value="processor">Processor</select_1.SelectItem>
                <select_1.SelectItem value="analyzer">Analyzer</select_1.SelectItem>
                <select_1.SelectItem value="communicator">Communicator</select_1.SelectItem>
              </select_1.SelectContent>
            </select_1.Select>
          </div>
        </card_1.CardContent>
        <card_1.CardFooter>
          <button_1.Button type="submit" className="w-full">Create Agent</button_1.Button>
        </card_1.CardFooter>
      </form>
    </card_1.Card>);
}
export {};
//# sourceMappingURL=create-agent.js.map