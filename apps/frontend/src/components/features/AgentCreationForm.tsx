"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
import React from 'react';
const AgentCreationForm = () => {
    const [formData, setFormData] = React.useState({
        name: '',
        traits: [],
        abilities: [],
        tools: [],
        template_name: '',
        role: 'Generic',
        description: '',
        channel: '',
        personality: '',
        specialization: '',
        language_proficiency: { primary: 'English', secondary: '' },
        capabilities: [],
        learning_preferences: {
            autonomous_learning: true,
            feedback_integration: true,
            knowledge_sources: []
        },
        collaboration_settings: {
            team_integration: true,
            communication_protocols: ['http', 'websocket'],
            resource_sharing: true
        },
        learning_config: {
            learning_rate: 0.01,
            knowledge_sources: [],
            adaptation_threshold: 0.5,
            feedback_integration: true
        },
        collaboration_rules: {
            allowed_peers: [],
            resource_sharing: true,
            communication_protocols: ['http', 'websocket'],
            trust_levels: new Map()
        }
    });
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState(null);
    const [success, setSuccess] = React.useState(false);
    const handleChange = (e) => {
        const { name, value } = e.target;
        setError(null);
        setFormData(prevStat(e: any) => (Object.assign(Object.assign({}, prevState), { [name]: value })));
    };
    const handleArrayChange = (e, field) => {
        const { value } = e.target;
        const values = value.split(',').map(item => item.trim());
        setError(null);
        setFormData(prevStat(e: any) => (Object.assign(Object.assign({}, prevState), { [field]: values })));
    };
    const handleLanguageProficiencyChange = (e, field) => {
        const { value } = e.target;
        setError(null);
        setFormData(prevStat(e: any) => (Object.assign(Object.assign({}, prevState), { language_proficiency: Object.assign(Object.assign({}, prevState.language_proficiency), { [field]: value }) })));
    };
    const handleCapabilityToggle = (capability) => {
        setFormData((prev: any) => (Object.assign(Object.assign({}, prev), { capabilities: prev.capabilities.includes(capability)
                ? prev.capabilities.filter(c => c !== capability)
                : [...prev.capabilities, capability] })));
    };
    const validateForm = () => {
        if (!formData.name.trim()) {
            setError('Name is required');
            return false;
        }
        if (formData.traits.length === 0) {
            setError('At least one trait is required');
            return false;
        }
        if (formData.abilities.length === 0) {
            setError('At least one ability is required');
            return false;
        }
        if (!formData.template_name.trim()) {
            setError('Template name is required');
            return false;
        }
        return true;
    };
    const validateEnhancedForm = () => {
        if (!validateForm())
            return false;
        if (formData.learning_config.learning_rate <= 0) {
            setError('Learning rate must be positive');
            return false;
        }
        if (formData.learning_config.knowledge_sources.length === 0) {
            setError('At least one knowledge source required');
            return false;
        }
        return true;
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);
        if (!validateEnhancedForm()) {
            return;
        }
        setLoading(true);
        try {
            const response = await fetch('/agents', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });
            if (!response.ok) {
                throw new Error('Failed to create agent');
            }
            const data = await response.json();
            
            setSuccess(true);
            setFormData({
                name: '',
                traits: [],
                abilities: [],
                tools: [],
                template_name: '',
                role: 'Generic',
                description: '',
                channel: '',
                personality: '',
                specialization: '',
                language_proficiency: { primary: 'English', secondary: '' },
                capabilities: [],
                learning_preferences: {
                    autonomous_learning: true,
                    feedback_integration: true,
                    knowledge_sources: []
                },
                collaboration_settings: {
                    team_integration: true,
                    communication_protocols: ['http', 'websocket'],
                    resource_sharing: true
                },
                learning_config: {
                    learning_rate: 0.01,
                    knowledge_sources: [],
                    adaptation_threshold: 0.5,
                    feedback_integration: true
                },
                collaboration_rules: {
                    allowed_peers: [],
                    resource_sharing: true,
                    communication_protocols: ['http', 'websocket'],
                    trust_levels: new Map()
                }
            });
        }
        catch (error) {
            console.error('Error creating agent:', error);
            setError(error instanceof Error ? error.message : 'Failed to create agent');
        }
        finally {
            setLoading(false);
        }
    };
    return (<div className={`form-container ${loading ? 'loading' : ''}`}>
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">Agent created successfully!</div>}
            
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Name:</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="Enter agent name" disabled={loading}/>
                </div>
                <div>
                    <label>Traits (comma-separated):</label>
                    <input type="text" name="traits" value={formData.traits.join(', ')} onChange={(e) => handleArrayChange(e, 'traits')} required placeholder="e.g., friendly, efficient, analytical" disabled={loading}/>
                </div>
                <div>
                    <label>Abilities (comma-separated):</label>
                    <input type="text" name="abilities" value={formData.abilities.join(', ')} onChange={(e) => handleArrayChange(e, 'abilities')} required placeholder="e.g., data analysis, customer support, coding" disabled={loading}/>
                </div>
                <div>
                    <label>Tools (comma-separated):</label>
                    <input type="text" name="tools" value={formData.tools.join(', ')} onChange={(e) => handleArrayChange(e, 'tools')} placeholder="e.g., calculator, translator, code editor" disabled={loading}/>
                </div>
                <div>
                    <label>Template Name:</label>
                    <input type="text" name="template_name" value={formData.template_name} onChange={handleChange} required placeholder="Enter template name" disabled={loading}/>
                </div>
                <div>
                    <label>Role:</label>
                    <select name="role" value={formData.role} onChange={handleChange} disabled={loading}>
                        <option value="Generic">Generic</option>
                        <option value="Customer Support">Customer Support</option>
                        <option value="Technical Support">Technical Support</option>
                        <option value="Sales">Sales</option>
                        <option value="Marketing">Marketing</option>
                    </select>
                </div>
                <div>
                    <label>Description:</label>
                    <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Describe the agent's purpose and capabilities" disabled={loading}/>
                </div>
                <div>
                    <label>Channel:</label>
                    <input type="text" name="channel" value={formData.channel} onChange={handleChange} placeholder="Communication channel" disabled={loading}/>
                </div>
                <div>
                    <label>Personality:</label>
                    <input type="text" name="personality" value={formData.personality} onChange={handleChange} placeholder="Agent's personality traits" disabled={loading}/>
                </div>
                <div>
                    <label>Specialization:</label>
                    <input type="text" name="specialization" value={formData.specialization} onChange={handleChange} placeholder="Agent's area of expertise" disabled={loading}/>
                </div>
                <div>
                    <label>Primary Language:</label>
                    <input type="text" name="language_proficiency_primary" value={formData.language_proficiency.primary} onChange={(e) => handleLanguageProficiencyChange(e, 'primary')} placeholder="e.g., English" disabled={loading}/>
                </div>
                <div>
                    <label>Secondary Language:</label>
                    <input type="text" name="language_proficiency_secondary" value={formData.language_proficiency.secondary} onChange={(e) => handleLanguageProficiencyChange(e, 'secondary')} placeholder="e.g., Spanish (optional)" disabled={loading}/>
                </div>
                <button type="submit" disabled={loading}>
                    {loading ? 'Creating Agent...' : 'Create Agent'}
                </button>
            </form>
        </div>);
};
exports.default = AgentCreationForm;
export {};
//# sourceMappingURL=AgentCreationForm.js.map