"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeDetails = void 0;
import react_1 from 'react';
import react_router_dom_1 from 'react-router-dom';
import core_1 from '@/components/core';
const NodeDetails = ({ nodes, onNodeUpdate }) => {
    var _a, _b, _c;
    const { nodeId } = (0, react_router_dom_1.useParams)();
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) {
        return (<core_1.Card>
        <core_1.CardHeader>
          <core_1.CardTitle>Error</core_1.CardTitle>
          <core_1.CardDescription>Node not found</core_1.CardDescription>
        </core_1.CardHeader>
      </core_1.Card>);
    }
    const handleParameterChange = (paramKey, value) => {
        var _a;
        if (onNodeUpdate) {
            onNodeUpdate(node.id, {
                data: Object.assign(Object.assign({}, node.data), { parameters: Object.assign(Object.assign({}, (_a = node.data) === null || _a === void 0 ? void 0 : _a.parameters), { [paramKey]: value }) }),
            });
        }
    };
    return (<core_1.Card className="max-w-2xl mx-auto">
      <core_1.CardHeader>
        <core_1.CardTitle>{((_a = node.data) === null || _a === void 0 ? void 0 : _a.label) || 'Unnamed Node'}</core_1.CardTitle>
        <core_1.CardDescription>
          ID: {node.id} • Type: {((_b = node.data) === null || _b === void 0 ? void 0 : _b.type) || 'Unknown'}
        </core_1.CardDescription>
      </core_1.CardHeader>
      <core_1.CardContent className="space-y-6">
        {((_c = node.data) === null || _c === void 0 ? void 0 : _c.parameters) && (<>
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Parameters</h3>
              <div className="space-y-4">
                {Object.entries(node.data.parameters).map(([key, value]) => (<div key={key} className="space-y-2">
                    <core_1.Label>{key}</core_1.Label>
                    {typeof value === 'boolean' ? (<core_1.Switch checked={value} onCheckedChange={(checked) => handleParameterChange(key, checked)}/>) : typeof value === 'number' ? (<core_1.Input type="number" value={value} onChange={(e) => handleParameterChange(key, parseFloat(e.target.value))}/>) : (<core_1.Input type="text" value={value} onChange={(e) => handleParameterChange(key, e.target.value)}/>)}
                  </div>))}
              </div>
            </div>
            <core_1.Separator />
          </>)}

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Position</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <core_1.Label>X</core_1.Label>
              <core_1.Input type="number" value={node.position.x} readOnly disabled/>
            </div>
            <div className="space-y-2">
              <core_1.Label>Y</core_1.Label>
              <core_1.Input type="number" value={node.position.y} readOnly disabled/>
            </div>
          </div>
        </div>
      </core_1.CardContent>
    </core_1.Card>);
};
exports.NodeDetails = NodeDetails;
export {};
//# sourceMappingURL=NodeDetails.js.map