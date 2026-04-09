import React, { useState } from 'react';
import { FaPlus, FaTrash } from 'react-icons/fa';
import { Button } from '../ui/design-system';

interface VariableManagerProps {
  variables: Record<string, string>;
  onChange: (variables: Record<string, string>) => void;
}

export const VariableManager: React.FC<VariableManagerProps> = ({ variables, onChange }) => {
  const [newVarName, setNewVarName] = useState('');
  const [newVarValue, setNewVarValue] = useState('');

  const showToast = (title: string) => {
    alert(title); // Simple toast - can be enhanced
  };

  const handleAddVariable = () => {
    if (!newVarName.trim()) {
      showToast('Variable name required');
      return;
    }

    if (variables.hasOwnProperty(newVarName)) {
      showToast('Variable already exists');
      return;
    }

    const updatedVariables = {
      ...variables,
      [newVarName]: newVarValue,
    };
    onChange(updatedVariables);

    // Clear the input fields
    setNewVarName('');
    setNewVarValue('');
  };

  const handleUpdateVariable = (name: string, value: string) => {
    const updatedVariables = {
      ...variables,
      [name]: value,
    };
    onChange(updatedVariables);
  };

  const handleDeleteVariable = (name: string) => {
    const updatedVariables = { ...variables };
    delete updatedVariables[name];
    onChange(updatedVariables);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Variable Name"
          value={newVarName}
          onChange={(e) => setNewVarName(e.target.value)}
          className="input flex-1"
        />
        <input
          type="text"
          placeholder="Value"
          value={newVarValue}
          onChange={(e) => setNewVarValue(e.target.value)}
          className="input flex-1"
        />
        <Button onClick={handleAddVariable} className="flex items-center gap-2">
          <FaPlus /> Add
        </Button>
      </div>

      <div className="border border-gray-200 rounded-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 px-3 font-medium">Variable</th>
              <th className="text-left py-2 px-3 font-medium">Value</th>
              <th className="text-left py-2 px-3 font-medium w-[80px]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(variables).map(([name, value]) => (
              <tr key={name} className="border-b border-gray-100">
                <td className="py-2 px-3">
                  <p className="font-medium">{name}</p>
                </td>
                <td className="py-2 px-3">
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => handleUpdateVariable(name, e.target.value)}
                    className="input text-sm w-full"
                  />
                </td>
                <td className="py-2 px-3">
                  <button
                    onClick={() => handleDeleteVariable(name)}
                    className="text-red-500 hover:text-red-700 p-2"
                    aria-label="Delete variable"
                  >
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
            {Object.keys(variables).length === 0 && (
              <tr>
                <td colSpan={3} className="text-center py-4 text-gray-500">
                  No variables defined
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
