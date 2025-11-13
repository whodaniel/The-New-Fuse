import React, { useState, useCallback } from 'react';
import { Users, Plus, X, CheckCircle, Sparkles } from 'lucide-react';
export const TeamBuilderPanel = ({ onTeamCreated, initialTask = '' }) => {
    const [taskDescription, setTaskDescription] = useState(initialTask);
    const [requiredSkills, setRequiredSkills] = useState([]);
    const [skillInput, setSkillInput] = useState('');
    const [maxTeamSize, setMaxTeamSize] = useState(5);
    const [loading, setLoading] = useState(false);
    const [team, setTeam] = useState(null);
    const addSkill = useCallback(() => {
        if (skillInput.trim() && !requiredSkills.includes(skillInput.trim())) {
            setRequiredSkills([...requiredSkills, skillInput.trim()]);
            setSkillInput('');
        }
    }, [skillInput, requiredSkills]);
    const removeSkill = useCallback((skill) => {
        setRequiredSkills(requiredSkills.filter(s => s !== skill));
    }, [requiredSkills]);
    const buildTeam = useCallback(async () => {
        if (!taskDescription.trim())
            return;
        setLoading(true);
        try {
            const response = await fetch('/api/agents/build-team', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    taskDescription,
                    requiredSkills,
                    maxTeamSize
                })
            });
            const result = await response.json();
            setTeam(result);
        }
        catch (error) {
            console.error('Team building failed:', error);
        }
        finally {
            setLoading(false);
        }
    }, [taskDescription, requiredSkills, maxTeamSize]);
    const handleCreateTeam = () => {
        if (team && onTeamCreated) {
            onTeamCreated(team.team);
        }
    };
    return (<div className="team-builder-panel">
      {/* Input Section */}
      <div className="input-section">
        <h2 className="section-title">
          <Users size={20}/>
          Build AI Agent Team
        </h2>

        <div className="form-group">
          <label>Task Description</label>
          <textarea value={taskDescription} onChange={(e) => setTaskDescription(e.target.value)} placeholder="Describe the task or project you need help with..." className="task-textarea" rows={4}/>
        </div>

        <div className="form-group">
          <label>Required Skills (Optional)</label>
          <div className="skills-input-wrapper">
            <input type="text" value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addSkill()} placeholder="Enter skill and press Enter..." className="skill-input"/>
            <button onClick={addSkill} className="add-skill-btn">
              <Plus size={16}/>
            </button>
          </div>

          {requiredSkills.length > 0 && (<div className="skills-list">
              {requiredSkills.map(skill => (<div key={skill} className="skill-chip">
                  <span>{skill}</span>
                  <button onClick={() => removeSkill(skill)} className="remove-skill">
                    <X size={14}/>
                  </button>
                </div>))}
            </div>)}
        </div>

        <div className="form-group">
          <label>Max Team Size: {maxTeamSize}</label>
          <input type="range" min="2" max="10" value={maxTeamSize} onChange={(e) => setMaxTeamSize(parseInt(e.target.value))} className="team-size-slider"/>
        </div>

        <button onClick={buildTeam} disabled={loading || !taskDescription.trim()} className="build-team-btn">
          {loading ? (<>
              <span className="loading-spinner"/>
              Building Team...
            </>) : (<>
              <Sparkles size={18}/>
              Build Team
            </>)}
        </button>
      </div>

      {/* Results Section */}
      {team && (<div className="results-section">
          <div className="team-header">
            <h3>Your Team ({team.team.length} agents)</h3>
            <button onClick={handleCreateTeam} className="create-team-btn">
              <CheckCircle size={16}/>
              Create Team
            </button>
          </div>

          {/* Team Members */}
          <div className="team-members">
            {team.team.map((agent, index) => (<div key={agent.id} className="team-member-card">
                <div className="member-header">
                  <div className="member-number">#{index + 1}</div>
                  <div className="member-role">{agent.role}</div>
                </div>
                <div className="member-domain">{agent.domain}</div>
                <div className="member-skills">
                  {agent.key_skills.slice(0, 3).map((skill, idx) => (<span key={idx} className="skill-badge">{skill}</span>))}
                  {agent.key_skills.length > 3 && (<span className="skill-badge more">
                      +{agent.key_skills.length - 3}
                    </span>)}
                </div>
              </div>))}
          </div>

          {/* Skill Coverage */}
          {Object.keys(team.skillCoverage).length > 0 && (<div className="skill-coverage">
              <h4>Skill Coverage</h4>
              <div className="coverage-list">
                {Object.entries(team.skillCoverage).map(([skill, covered]) => (<div key={skill} className={`coverage-item ${covered ? 'covered' : 'missing'}}>
                    {covered ? (
                      <CheckCircle size={16} className="check-icon" />
                    ) : (
                      <X size={16} className="x-icon" />
                    )}
                    <span>{skill}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {team.recommendations.length > 0 && (
            <div className="recommendations">
              <h4>
                <AlertCircle size={16} />
                Recommendations
              </h4>
              <ul>
                {team.recommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <style jsx>{
        .team-builder-panel {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: white;
          border-radius: 8px;
          overflow: hidden;
        }

        .input-section {
          padding: 1.5rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .section-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.25rem;
          font-weight: 600;
          color: #111827;
          margin: 0 0 1.5rem 0;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-group label {
          display: block;
          font-size: 0.875rem;
          font-weight: 500;
          color: #374151;
          margin-bottom: 0.5rem;
        }

        .task-textarea {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-family: inherit;
          font-size: 0.875rem;
          resize: vertical;
        }

        .task-textarea:focus {
          outline: none;
          border-color: #3b82f6;
          ring: 2px solid rgba(59, 130, 246, 0.1);
        }

        .skills-input-wrapper {
          display: flex;
          gap: 0.5rem;
        }

        .skill-input {
          flex: 1;
          padding: 0.5rem 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 0.875rem;
        }

        .add-skill-btn {
          padding: 0.5rem 0.75rem;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .add-skill-btn:hover {
          background: #2563eb;
        }

        .skills-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-top: 0.75rem;
        }

        .skill-chip {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: #eff6ff;
          color: #1e40af;
          padding: 0.375rem 0.75rem;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .remove-skill {
          background: transparent;
          border: none;
          color: #1e40af;
          cursor: pointer;
          padding: 0;
          display: flex;
          align-items: center;
        }

        .team-size-slider {
          width: 100%;
          height: 6px;
          border-radius: 3px;
          background: #e5e7eb;
          outline: none;
          -webkit-appearance: none;
        }

        .team-size-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
        }

        .build-team-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          width: 100%;
          padding: 0.75rem;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .build-team-btn:hover:not(:disabled) {
          background: #2563eb;
        }

        .build-team-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .results-section {
          flex: 1;
          padding: 1.5rem;
          overflow-y: auto;
        }

        .team-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .team-header h3 {
          font-size: 1.125rem;
          font-weight: 600;
          color: #111827;
          margin: 0;
        }

        .create-team-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: #10b981;
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .create-team-btn:hover {
          background: #059669;
        }

        .team-members {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }

        .team-member-card {
          padding: 1rem;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
        }

        .member-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.5rem;
        }

        .member-number {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #3b82f6;
          color: white;
          border-radius: 50%;
          font-weight: 600;
          font-size: 0.875rem;
        }

        .member-role {
          font-weight: 600;
          color: #111827;
        }

        .member-domain {
          font-size: 0.875rem;
          color: #6b7280;
          margin-bottom: 0.75rem;
        }

        .member-skills {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .skill-badge {
          font-size: 0.75rem;
          background: white;
          color: #3b82f6;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-weight: 500;
        }

        .skill-badge.more {
          background: #e5e7eb;
          color: #6b7280;
        }

        .skill-coverage {
          margin-bottom: 1.5rem;
        }

        .skill-coverage h4 {
          font-size: 1rem;
          font-weight: 600;
          color: #111827;
          margin: 0 0 0.75rem 0;
        }

        .coverage-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .coverage-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem;
          background: #f9fafb;
          border-radius: 4px;
          font-size: 0.875rem;
        }

        .coverage-item.covered {
          color: #059669;
        }

        .coverage-item.missing {
          color: #dc2626;
        }

        .check-icon,
        .x-icon {
          flex-shrink: 0;
        }

        .recommendations {
          padding: 1rem;
          background: #fef3c7;
          border: 1px solid #fbbf24;
          border-radius: 6px;
        }

        .recommendations h4 {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: #92400e;
          margin: 0 0 0.75rem 0;
        }

        .recommendations ul {
          margin: 0;
          padding-left: 1.5rem;
          color: #92400e;
          font-size: 0.875rem;
        }

        .recommendations li {
          margin-bottom: 0.25rem;
        }

        .loading-spinner {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid #f3f4f6;
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }` `}</style>
    </div>
  );
};

export default TeamBuilderPanel;
                    }/>))}</></>)}</>)}</>);
};
//# sourceMappingURL=TeamBuilderPanel.js.map