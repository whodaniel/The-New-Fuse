import React from 'react';

/**
 * Workflow Builder Page - The New Fuse Desktop
 * Visual workflow creation interface
 */
const WorkflowBuilder: React.FC = () => {
  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <h1 className="page-title">Workflow Builder</h1>
          <p className="page-subtitle">Create powerful AI automation workflows</p>
        </div>
        <div className="header-actions">
          <button className="secondary-button">Templates</button>
          <button className="primary-button">Save Workflow</button>
        </div>
      </header>

      {/* Workflow Canvas */}
      <div className="workflow-canvas">
        <div className="canvas-sidebar">
          <h3 className="sidebar-title">Node Library</h3>
          <div className="node-category">
            <h4>🤖 AI Agents</h4>
            <div className="node-item" draggable>
              Claude AI
            </div>
            <div className="node-item" draggable>
              Gemini
            </div>
            <div className="node-item" draggable>
              GPT-4
            </div>
          </div>
          <div className="node-category">
            <h4>🔧 MCP Tools</h4>
            <div className="node-item" draggable>
              Web Search
            </div>
            <div className="node-item" draggable>
              File System
            </div>
            <div className="node-item" draggable>
              Database
            </div>
          </div>
          <div className="node-category">
            <h4>⚡ Flow Control</h4>
            <div className="node-item" draggable>
              Condition
            </div>
            <div className="node-item" draggable>
              Loop
            </div>
            <div className="node-item" draggable>
              Parallel
            </div>
          </div>
        </div>

        <div className="canvas-main">
          <div className="canvas-wrapper">
            {/* Placeholder for workflow canvas */}
            <div className="canvas-placeholder">
              <div className="placeholder-content">
                <span className="placeholder-icon">⚡</span>
                <h3>Create Your First Workflow</h3>
                <p>Drag nodes from the sidebar to get started</p>
                <button className="primary-button">Use Template</button>
              </div>
            </div>
          </div>
        </div>

        <div className="canvas-controls">
          <div className="control-group">
            <button className="control-btn" title="Zoom In">
              ➕
            </button>
            <button className="control-btn" title="Zoom Out">
              ➖
            </button>
            <button className="control-btn" title="Fit View">
              📐
            </button>
          </div>
          <div className="control-group">
            <button className="control-btn" title="Undo">
              ↩️
            </button>
            <button className="control-btn" title="Redo">
              ↪️
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .page-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          padding: 24px;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .page-title {
          font-family: var(--tnf-font-heading, 'Outfit', sans-serif);
          font-size: 28px;
          font-weight: 700;
          margin: 0;
          background: linear-gradient(135deg, #667eea, #764ba2);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .page-subtitle {
          color: var(--tnf-text-muted);
          margin: 4px 0 0;
        }

        .header-actions {
          display: flex;
          gap: 12px;
        }

        .primary-button {
          background: linear-gradient(135deg, #667eea, #764ba2);
          border: none;
          color: white;
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
        }

        .secondary-button {
          background: var(--tnf-surface);
          border: 1px solid var(--tnf-border);
          color: var(--tnf-text-primary);
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
        }

        /* Workflow Canvas Layout */
        .workflow-canvas {
          flex: 1;
          display: flex;
          gap: 16px;
          position: relative;
        }

        .canvas-sidebar {
          width: 240px;
          background: var(--tnf-surface);
          border: 1px solid var(--tnf-border);
          border-radius: 12px;
          padding: 16px;
          overflow-y: auto;
        }

        .sidebar-title {
          font-family: var(--tnf-font-heading);
          font-size: 14px;
          font-weight: 600;
          margin: 0 0 16px;
          color: var(--tnf-primary-light);
        }

        .node-category {
          margin-bottom: 20px;
        }

        .node-category h4 {
          font-size: 12px;
          color: var(--tnf-text-muted);
          margin: 0 0 8px;
        }

        .node-item {
          background: var(--tnf-surface-hover);
          border: 1px solid var(--tnf-border);
          border-radius: 8px;
          padding: 10px 12px;
          margin-bottom: 6px;
          font-size: 13px;
          cursor: grab;
          transition: all 0.2s;
        }

        .node-item:hover {
          background: var(--tnf-surface-active);
          border-color: var(--tnf-primary);
          transform: translateX(4px);
        }

        .node-item:active {
          cursor: grabbing;
        }

        /* Main Canvas */
        .canvas-main {
          flex: 1;
          background: var(--tnf-surface);
          border: 1px solid var(--tnf-border);
          border-radius: 12px;
          position: relative;
          overflow: hidden;
        }

        .canvas-wrapper {
          width: 100%;
          height: 100%;
          background-image:
            radial-gradient(circle, var(--tnf-border) 1px, transparent 1px);
          background-size: 20px 20px;
        }

        .canvas-placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
        }

        .placeholder-content {
          text-align: center;
          color: var(--tnf-text-muted);
        }

        .placeholder-icon {
          font-size: 48px;
          display: block;
          margin-bottom: 16px;
        }

        .placeholder-content h3 {
          font-family: var(--tnf-font-heading);
          color: var(--tnf-text-primary);
          margin: 0 0 8px;
        }

        .placeholder-content p {
          margin: 0 0 20px;
        }

        /* Canvas Controls */
        .canvas-controls {
          position: absolute;
          bottom: 16px;
          right: 16px;
          display: flex;
          gap: 8px;
        }

        .control-group {
          display: flex;
          background: var(--tnf-surface);
          border: 1px solid var(--tnf-border);
          border-radius: 8px;
          overflow: hidden;
        }

        .control-btn {
          background: transparent;
          border: none;
          padding: 10px 14px;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 14px;
        }

        .control-btn:hover {
          background: var(--tnf-surface-hover);
        }

        .control-btn + .control-btn {
          border-left: 1px solid var(--tnf-border);
        }
      `}</style>
    </div>
  );
};

export default WorkflowBuilder;
