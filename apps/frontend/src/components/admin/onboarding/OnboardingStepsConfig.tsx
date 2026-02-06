import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import { Button } from '@the-new-fuse/ui-consolidated';
import { ArrowDown, ArrowUp, Edit2, Eye, Info, Plus, Trash2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { OnboardingAdminService } from '../../../services/onboarding-admin.service';

interface OnboardingStepsConfigProps {
  onSave: () => void;
  onChange: () => void;
  hasUnsavedChanges: boolean;
}

interface StepConfig {
  id: string;
  type:
    | 'welcome'
    | 'profile'
    | 'ai_preferences'
    | 'workspace'
    | 'tools'
    | 'greeter'
    | 'completion'
    | 'custom';
  title: string;
  description: string;
  enabled: boolean;
  required: boolean;
  userTypes: string[];
  content?: {
    heading?: string;
    subheading?: string;
    imageUrl?: string;
    buttonText?: string;
  };
  customFields?: {
    id: string;
    label: string;
    type: 'text' | 'textarea' | 'select' | 'checkbox' | 'radio';
    options?: { label: string; value: string }[];
    required: boolean;
  }[];
}

export const OnboardingStepsConfig: React.FC<OnboardingStepsConfigProps> = ({
  onSave,
  onChange,
  hasUnsavedChanges,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [steps, setSteps] = useState<StepConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const onOpen = () => setIsOpen(true);
  const onClose = () => setIsOpen(false);

  const showToast = (
    title: string,
    description?: string,
    status: 'success' | 'error' = 'success'
  ) => {
    // Simple toast implementation - in a real app you might use a toast library
    console.log(`Toast: ${title} - ${description} (${status})`);
  };

  // Fetch steps from API
  useEffect(() => {
    const fetchSteps = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await OnboardingAdminService.getSteps();
        setSteps(data);
      } catch (err) {
        console.error('Error fetching onboarding steps:', err);
        setError('Failed to load onboarding steps. Please try again.');
        // Set default steps if API fails
        setSteps([
          {
            id: '1',
            type: 'welcome',
            title: 'Welcome',
            description: 'Introduction to The New Fuse platform',
            enabled: true,
            required: true,
            userTypes: ['human', 'ai_agent'],
            content: {
              heading: 'Welcome to The New Fuse',
              subheading:
                'The AI agent coordination platform that enables intelligent interaction between different AI systems.',
              imageUrl: '/assets/images/welcome.png',
              buttonText: 'Get Started',
            },
          },
          {
            id: '2',
            type: 'profile',
            title: 'User Profile',
            description: 'Collect user information',
            enabled: true,
            required: true,
            userTypes: ['human'],
            content: {
              heading: 'Tell us about yourself',
              subheading: 'This information helps us personalize your experience.',
            },
          },
          {
            id: '3',
            type: 'completion',
            title: 'Complete',
            description: 'Onboarding completion',
            enabled: true,
            required: true,
            userTypes: ['human', 'ai_agent'],
            content: {
              heading: 'All Set!',
              subheading: "You're ready to start using The New Fuse.",
              buttonText: 'Get Started',
            },
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSteps();
  }, []);

  const [currentStep, setCurrentStep] = useState<StepConfig | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const handleAddStep = () => {
    const newStep: StepConfig = {
      id: `step-${Date.now()}`,
      type: 'custom',
      title: 'New Step',
      description: 'Description of the new step',
      enabled: true,
      required: false,
      userTypes: ['human'],
      content: {
        heading: 'New Step',
        subheading: 'Description of the new step',
      },
      customFields: [],
    };

    setCurrentStep(newStep);
    setIsEditing(false);
    onOpen();
  };

  const handleEditStep = (step: StepConfig) => {
    setCurrentStep({ ...step });
    setIsEditing(true);
    onOpen();
  };

  const handleDeleteStep = (id: string) => {
    setSteps(steps.filter((step) => step.id !== id));
    onChange();

    showToast('Step deleted', undefined, 'success');
  };

  const handleSaveStep = () => {
    if (!currentStep) return;

    if (isEditing) {
      setSteps(steps.map((step) => (step.id === currentStep.id ? currentStep : step)));
    } else {
      setSteps([...steps, currentStep]);
    }

    onChange();
    onClose();

    showToast(isEditing ? 'Step updated' : 'Step added', undefined, 'success');
  };

  const handleMoveStep = (id: string, direction: 'up' | 'down') => {
    const index = steps.findIndex((step) => step.id === id);
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === steps.length - 1)
    ) {
      return;
    }

    const newSteps = [...steps];
    const newIndex = direction === 'up' ? index - 1 : index + 1;

    [newSteps[index], newSteps[newIndex]] = [newSteps[newIndex], newSteps[index]];

    setSteps(newSteps);
    onChange();
  };

  const handleToggleStep = (id: string) => {
    setSteps(steps.map((step) => (step.id === id ? { ...step, enabled: !step.enabled } : step)));
    onChange();
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(steps);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setSteps(items);
    onChange();
  };

  const handleSaveChanges = async () => {
    try {
      await OnboardingAdminService.updateSteps(steps);
      onSave();

      showToast('Changes saved', 'Onboarding steps configuration has been saved.', 'success');
    } catch (err) {
      console.error('Error saving onboarding steps:', err);

      showToast(
        'Error saving changes',
        'There was an error saving your changes. Please try again.',
        'error'
      );
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    if (!currentStep) return;

    const { name, value } = e.target;

    if (name.startsWith('content.')) {
      const contentKey = name.split('.')[1];
      setCurrentStep({
        ...currentStep,
        content: {
          ...currentStep.content,
          [contentKey]: value,
        },
      });
    } else {
      setCurrentStep({
        ...currentStep,
        [name]: value,
      });
    }
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    if (!currentStep) return;

    setCurrentStep({
      ...currentStep,
      [name]: checked,
    });
  };

  const handleUserTypeToggle = (userType: string) => {
    if (!currentStep) return;

    const userTypes = currentStep.userTypes.includes(userType)
      ? currentStep.userTypes.filter((type) => type !== userType)
      : [...currentStep.userTypes, userType];

    setCurrentStep({
      ...currentStep,
      userTypes,
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold">Onboarding Wizard Steps</h2>
        <Button onClick={handleAddStep} disabled={isLoading} className="flex items-center gap-2">
          <Plus />
          Add Step
        </Button>
      </div>

      <div className="flex items-center mb-4 gap-2">
        <p className="text-gray-600">
          Configure the steps in your onboarding wizard. Drag and drop to reorder steps.
        </p>
        <div className="relative group">
          <Info className="text-gray-400 cursor-help" />
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
            Each step represents a screen in the onboarding wizard. Steps can be customized for
            different user types.
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading onboarding steps...</p>
        </div>
      )}

      {error && !isLoading && (
        <div className="p-4 mb-4 bg-red-50 border border-red-200 rounded-md">
          <h3 className="text-sm font-semibold text-red-800 mb-2">Error Loading Steps</h3>
          <p className="text-red-600 mb-2">{error}</p>
          <Button
            onClick={() => window.location.reload()}
            className="bg-red-600 hover:bg-red-700 text-white text-sm px-3 py-1"
          >
            Retry
          </Button>
        </div>
      )}

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="steps">
          {(provided) => (
            <div className="space-y-4" {...provided.droppableProps} ref={provided.innerRef}>
              {steps.map((step, index) => (
                <Draggable key={step.id} draggableId={step.id} index={index}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={`border border-gray-200 bg-white shadow-sm rounded-md ${
                        step.enabled ? 'opacity-100' : 'opacity-60'
                      }`}
                    >
                      <div className="p-4 pb-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold">{step.title}</h3>
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${
                                step.required
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-green-100 text-green-800'
                              }`}
                            >
                              {step.required ? 'Required' : 'Optional'}
                            </span>
                            {!step.enabled && (
                              <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                                Disabled
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleMoveStep(step.id, 'up')}
                              disabled={index === 0}
                              className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                              aria-label="Move step up"
                            >
                              <ArrowUp />
                            </button>
                            <button
                              onClick={() => handleMoveStep(step.id, 'down')}
                              disabled={index === steps.length - 1}
                              className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                              aria-label="Move step down"
                            >
                              <ArrowDown />
                            </button>
                            <button
                              onClick={() => handleToggleStep(step.id)}
                              className={`p-1 ${
                                step.enabled ? 'text-blue-600' : 'text-gray-400'
                              } hover:text-blue-800`}
                              aria-label="Toggle step"
                            >
                              <Eye />
                            </button>
                            <button
                              onClick={() => handleEditStep(step)}
                              className="p-1 text-gray-400 hover:text-gray-600"
                              aria-label="Edit step"
                            >
                              <Edit2 />
                            </button>
                            <button
                              onClick={() => handleDeleteStep(step.id)}
                              className="p-1 text-gray-400 hover:text-red-600"
                              aria-label="Delete step"
                            >
                              <Trash2 />
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="px-4 pb-4">
                        <p className="text-sm text-gray-600 mb-2">{step.description}</p>
                        <div className="flex flex-wrap gap-1">
                          {step.userTypes.map((userType) => (
                            <span
                              key={userType}
                              className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                            >
                              {userType}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {hasUnsavedChanges && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex justify-between items-center">
            <p className="text-yellow-800">You have unsaved changes.</p>
            <Button
              onClick={handleSaveChanges}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Save Changes
            </Button>
          </div>
        </div>
      )}

      {/* Step Edit Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-lg font-semibold">{isEditing ? 'Edit Step' : 'Add New Step'}</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                ×
              </button>
            </div>
            <div className="p-6">
              {currentStep && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Step Type
                      <span className="ml-1 text-gray-400">
                        <FiInfo className="inline w-3 h-3" />
                      </span>
                    </label>
                    <select
                      name="type"
                      value={currentStep.type}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      aria-label="Step type"
                      title="Select the type of onboarding step"
                    >
                      <option value="welcome">Welcome</option>
                      <option value="profile">User Profile</option>
                      <option value="ai_preferences">AI Preferences</option>
                      <option value="workspace">Workspace Setup</option>
                      <option value="tools">Tools & Integrations</option>
                      <option value="greeter">Greeter Agent</option>
                      <option value="completion">Completion</option>
                      <option value="custom">Custom Step</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      name="title"
                      value={currentStep.title}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter step title"
                      aria-label="Step title"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={currentStep.description}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter step description"
                      aria-label="Step description"
                    />
                  </div>

                  <div className="flex gap-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="enabled"
                        checked={currentStep.enabled}
                        onChange={(e) => handleSwitchChange('enabled', e.target.checked)}
                        className="mr-2"
                      />
                      <label htmlFor="enabled" className="text-sm font-medium text-gray-700">
                        Enabled
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="required"
                        checked={currentStep.required}
                        onChange={(e) => handleSwitchChange('required', e.target.checked)}
                        className="mr-2"
                      />
                      <label htmlFor="required" className="text-sm font-medium text-gray-700">
                        Required
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      User Types
                      <span className="ml-1 text-gray-400">
                        <FiInfo className="inline w-3 h-3" />
                      </span>
                    </label>
                    <div className="flex gap-4">
                      {['human', 'ai_agent'].map((userType) => (
                        <div key={userType} className="flex items-center">
                          <input
                            type="checkbox"
                            id={userType}
                            checked={currentStep.userTypes.includes(userType)}
                            onChange={() => handleUserTypeToggle(userType)}
                            className="mr-2"
                          />
                          <label htmlFor={userType} className="text-sm text-gray-700">
                            {userType === 'ai_agent' ? 'AI Agent' : 'Human'}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 p-6 border-t">
              <Button onClick={onClose} variant="outline">
                Cancel
              </Button>
              <Button onClick={handleSaveStep} className="bg-blue-600 hover:bg-blue-700 text-white">
                {isEditing ? 'Update Step' : 'Add Step'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
