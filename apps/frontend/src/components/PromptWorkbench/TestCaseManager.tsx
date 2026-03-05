// @ts-nocheck
import React, { useState } from 'react';
import { FaChevronDown, FaEdit, FaPlus, FaTrash } from 'react-icons/fa';
import { Button } from '../ui/design-system';

interface TestCase {
  id: string;
  name: string;
  description?: string;
  variables: Record<string, string>;
}

interface TestCaseManagerProps {
  testCases: TestCase[];
  onChange: (testCases: TestCase[]) => void;
}

export const TestCaseManager: React.FC<TestCaseManagerProps> = ({ testCases, onChange }) => {
  const [newTestCase, setNewTestCase] = useState<TestCase>({
    id: '',
    name: '',
    description: '',
    variables: {},
  });
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [newVarName, setNewVarName] = useState('');
  const [newVarValue, setNewVarValue] = useState('');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const showToast = (title: string, type: 'warning' | 'success' = 'warning') => {
    // Simple toast implementation - you can enhance this
    alert(title);
  };

  const handleAddTestCase = () => {
    if (!newTestCase.name.trim()) {
      showToast('Test case name required', 'warning');
      return;
    }

    const id = isEditing || `test-${Date.now()}`;
    const updatedTestCases = isEditing
      ? testCases.map((tc) => (tc.id === id ? { ...newTestCase, id } : tc))
      : [...testCases, { ...newTestCase, id }];

    onChange(updatedTestCases);

    // Reset form
    setNewTestCase({
      id: '',
      name: '',
      description: '',
      variables: {},
    });
    setIsEditing(null);
  };

  const handleDeleteTestCase = (id: string) => {
    onChange(testCases.filter((tc) => tc.id !== id));
  };

  const handleEditTestCase = (testCase: TestCase) => {
    setNewTestCase(testCase);
    setIsEditing(testCase.id);
  };

  const handleAddVariable = () => {
    if (!newVarName.trim()) {
      showToast('Variable name required', 'warning');
      return;
    }

    setNewTestCase({
      ...newTestCase,
      variables: {
        ...newTestCase.variables,
        [newVarName]: newVarValue,
      },
    });

    // Clear inputs
    setNewVarName('');
    setNewVarValue('');
  };

  const handleDeleteVariable = (name: string) => {
    const updatedVariables = { ...newTestCase.variables };
    delete updatedVariables[name];

    setNewTestCase({
      ...newTestCase,
      variables: updatedVariables,
    });
  };

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="p-4 border border-gray-200 rounded-md">
        <div className="flex flex-col gap-4">
          <p className="font-bold text-lg">{isEditing ? 'Edit Test Case' : 'New Test Case'}</p>

          <input
            type="text"
            placeholder="Test Case Name"
            value={newTestCase.name}
            onChange={(e) => setNewTestCase({ ...newTestCase, name: e.target.value })}
            className="input"
          />

          <input
            type="text"
            placeholder="Description (optional)"
            value={newTestCase.description}
            onChange={(e) => setNewTestCase({ ...newTestCase, description: e.target.value })}
            className="input"
          />

          <div>
            <p className="font-medium mb-2">Test Variables</p>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                placeholder="Variable Name"
                value={newVarName}
                onChange={(e) => setNewVarName(e.target.value)}
                className="input text-sm"
              />
              <input
                type="text"
                placeholder="Value"
                value={newVarValue}
                onChange={(e) => setNewVarValue(e.target.value)}
                className="input text-sm"
              />
              <Button onClick={handleAddVariable} className="flex items-center gap-2">
                <FaPlus /> Add
              </Button>
            </div>

            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3">Variable</th>
                  <th className="text-left py-2 px-3">Value</th>
                  <th className="text-left py-2 px-3 w-[50px]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(newTestCase.variables).map(([name, value]) => (
                  <tr key={name} className="border-b border-gray-100">
                    <td className="py-2 px-3">{name}</td>
                    <td className="py-2 px-3">{value}</td>
                    <td className="py-2 px-3">
                      <button
                        onClick={() => handleDeleteVariable(name)}
                        className="text-red-500 hover:text-red-700 p-1"
                        aria-label="Delete variable"
                      >
                        <FaTrash size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
                {Object.keys(newTestCase.variables).length === 0 && (
                  <tr>
                    <td colSpan={3} className="text-center py-2 text-sm text-gray-500">
                      No variables added
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Button onClick={handleAddTestCase} className="self-end">
            {isEditing ? 'Update Test Case' : 'Add Test Case'}
          </Button>
        </div>
      </div>

      <div>
        <p className="font-bold text-lg mb-4">Test Cases ({testCases.length})</p>

        <div className="flex flex-col gap-2">
          {testCases.map((testCase) => (
            <div key={testCase.id} className="border border-gray-200 rounded-md">
              <button
                onClick={() => toggleExpanded(testCase.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium">{testCase.name}</span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    {Object.keys(testCase.variables).length} variables
                  </span>
                </div>
                <FaChevronDown
                  className={`transition-transform ${expandedItems.has(testCase.id) ? 'rotate-180' : ''}`}
                />
              </button>

              {expandedItems.has(testCase.id) && (
                <div className="p-4 border-t border-gray-200 flex flex-col gap-3">
                  {testCase.description && (
                    <p className="text-sm text-gray-600">{testCase.description}</p>
                  )}

                  <div>
                    <p className="font-medium text-sm mb-1">Variables:</p>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2 px-3">Name</th>
                          <th className="text-left py-2 px-3">Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(testCase.variables).map(([name, value]) => (
                          <tr key={name} className="border-b border-gray-100">
                            <td className="py-2 px-3">{name}</td>
                            <td className="py-2 px-3">{value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      onClick={() => handleEditTestCase(testCase)}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <FaEdit /> Edit
                    </Button>
                    <Button
                      onClick={() => handleDeleteTestCase(testCase.id)}
                      variant="outline"
                      className="flex items-center gap-2 text-red-600 border-red-600 hover:bg-red-50"
                    >
                      <FaTrash /> Delete
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {testCases.length === 0 && (
          <div className="text-center py-6 border border-dashed border-gray-300 rounded-md">
            <p className="text-gray-500">No test cases added yet</p>
          </div>
        )}
      </div>
    </div>
  );
};
