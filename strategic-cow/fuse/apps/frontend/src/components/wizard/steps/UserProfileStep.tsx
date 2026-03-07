import React, { useState, useEffect } from 'react';
import { useWizard } from '../WizardProvider';

export const UserProfileStep: React.FC = () => {
  const { state, updateSessionData } = useWizard();
  const isAIAgent = state.session?.userType === 'ai_agent';
  
  // Get existing data from session if available
  const existingData = state.session?.data || {};
  
  // Form state
  const [formData, setFormData] = useState({
    name: existingData.name || '',
    email: existingData.email || '',
    role: existingData.role || '',
    organization: existingData.organization || '',
    description: existingData.description || '',
    // AI agent specific fields
    agentType: existingData.agentType || 'general',
    apiVersion: existingData.apiVersion || '1.0',
    maintainer: existingData.maintainer || ''
  });
  
  // Form validation
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Update session data when form changes
  useEffect(() => {
    updateSessionData(formData);
  }, [formData, updateSessionData]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when field is updated
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  // Validate required fields
  const validateField = (name: string, value: string) => {
    if (!value.trim()) {
      setErrors(prev => ({
        ...prev,
        [name]: 'This field is required'
      }));
      return false;
    }
    return true;
  };
  
  // Validate email format
  const validateEmail = (email: string) => {
    if (!email.trim()) {
      setErrors(prev => ({
        ...prev,
        email: 'Email is required'
      }));
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrors(prev => ({
        ...prev,
        email: 'Please enter a valid email address'
      }));
      return false;
    }
    
    return true;
  };
  
  // Validate form on blur
  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'email') {
      validateEmail(value);
    } else if (name === 'name' || name === 'role' || (isAIAgent && name === 'agentType')) {
      validateField(name, value);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">
        {isAIAgent ? 'Agent Profile' : 'Your Profile'}
      </h2>
      
      <p className="mb-6 text-gray-600">
        {isAIAgent 
          ? 'Please provide information about your AI agent to help us integrate it with The New Fuse platform.'
          : 'Please provide some information about yourself to personalize your experience.'}
      </p>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {isAIAgent ? 'Agent Name' : 'Full Name'} <span className="text-red-500">*</span>
          </label>
          <input 
            name="name"
            value={formData.name}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={isAIAgent ? 'e.g., Research Assistant Agent' : 'e.g., John Doe'}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {isAIAgent ? 'Contact Email' : 'Email Address'} <span className="text-red-500">*</span>
          </label>
          <input 
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="e.g., user@example.com"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.email ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
          <p className="text-gray-500 text-sm mt-1">
            {isAIAgent 
              ? 'Email address for the maintainer of this agent'
              : 'We\'ll never share your email with anyone else'}
          </p>
        </div>
        
        {isAIAgent ? (
          // AI Agent specific fields
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Agent Type <span className="text-red-500">*</span>
              </label>
              <select 
                 name="agentType"
                 value={formData.agentType}
                 onChange={handleChange}
                 onBlur={handleBlur}
                 aria-label="Agent Type"
                 className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                   errors.agentType ? 'border-red-500' : 'border-gray-300'
                 }`}
               >
                <option value="general">General Purpose</option>
                <option value="research">Research Assistant</option>
                <option value="coding">Code Assistant</option>
                <option value="creative">Creative Assistant</option>
                <option value="data">Data Analysis</option>
                <option value="custom">Custom</option>
              </select>
              {errors.agentType && <p className="text-red-500 text-sm mt-1">{errors.agentType}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">API Version</label>
              <select 
                 name="apiVersion"
                 value={formData.apiVersion}
                 onChange={handleChange}
                 aria-label="API Version"
                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
               >
                <option value="1.0">1.0</option>
                <option value="1.1">1.1</option>
                <option value="2.0">2.0</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Maintainer</label>
              <input 
                name="maintainer"
                value={formData.maintainer}
                onChange={handleChange}
                placeholder="e.g., OpenAI, Anthropic, or Individual Developer"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </>
        ) : (
          // Human user specific fields
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select 
                 name="role"
                 value={formData.role}
                 onChange={handleChange}
                 aria-label="Role"
                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
               >
                <option value="">Select your role</option>
                <option value="developer">Developer</option>
                <option value="data_scientist">Data Scientist</option>
                <option value="product_manager">Product Manager</option>
                <option value="designer">Designer</option>
                <option value="researcher">Researcher</option>
                <option value="executive">Executive</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Organization</label>
              <input 
                name="organization"
                value={formData.organization}
                onChange={handleChange}
                placeholder="e.g., Acme Inc."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </>
        )}
        
        <hr className="my-4 border-gray-200" />
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {isAIAgent ? 'Agent Description' : 'About You'}
          </label>
          <textarea 
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder={isAIAgent 
              ? 'Briefly describe your agent\'s purpose and capabilities...'
              : 'Tell us a bit about yourself and how you plan to use The New Fuse...'}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
};
