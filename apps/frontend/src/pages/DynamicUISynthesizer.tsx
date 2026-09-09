import React, { useState } from 'react';

export interface DynamicUIElement {
  id: string;
  type:
    | 'container'
    | 'metric'
    | 'slider'
    | 'input'
    | 'select'
    | 'toggle'
    | 'button'
    | 'progress'
    | 'table'
    | 'html-artifact';
  label?: string;
  value?: any;
  options?: { label: string; value: any }[];
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
  children?: DynamicUIElement[];
  props?: Record<string, any>;
  actionType?: string;
  actionPayload?: Record<string, any>;
}

export interface DynamicUISchema {
  id: string;
  title: string;
  description?: string;
  version: string;
  layout: 'grid' | 'stack' | 'tabs' | 'flow';
  elements: DynamicUIElement[];
}

export interface DynamicUIEvent {
  elementId: string;
  eventType: 'change' | 'click' | 'submit' | 'toggle';
  value?: any;
  schemaId: string;
  timestamp: string;
}

const PRESET_SCHEMAS: Record<string, DynamicUISchema> = {
  'swarm-tuner': {
    id: 'swarm-parameter-tuner',
    title: '🎛️ Swarm Dynamics & Parameter Synthesizer',
    description:
      'On-demand generated control surface for agent concurrency, temperature, and verification thresholds.',
    version: '1.0.0',
    layout: 'stack',
    elements: [
      {
        id: 'metric-grid',
        type: 'container',
        props: { display: 'grid', columns: 3 },
        children: [
          {
            id: 'm1',
            type: 'metric',
            label: 'Active Agent Lanes',
            value: '4 Lanes',
            variant: 'primary',
          },
          {
            id: 'm2',
            type: 'metric',
            label: 'Synaptic Bus Throughput',
            value: '48.9k msg/s',
            variant: 'success',
          },
          {
            id: 'm3',
            type: 'metric',
            label: 'Gate Verification Latency',
            value: '0.42 ms',
            variant: 'info',
          },
        ],
      },
      {
        id: 'param-container',
        type: 'container',
        props: { border: true },
        children: [
          {
            id: 'temp-slider',
            type: 'slider',
            label: 'Swarm Reasoning Temperature',
            value: 0.7,
            min: 0,
            max: 2,
            step: 0.05,
          },
          {
            id: 'concurrency-slider',
            type: 'slider',
            label: 'Maximum Subagent Concurrency',
            value: 8,
            min: 1,
            max: 32,
            step: 1,
          },
          {
            id: 'strict-mode-toggle',
            type: 'toggle',
            label: 'Strict Heuristic Zero-Trust Gatekeeping',
            value: true,
          },
        ],
      },
      {
        id: 'action-row',
        type: 'container',
        props: { display: 'flex', justify: 'flex-end', gap: '8px' },
        children: [
          {
            id: 'btn-reset',
            type: 'button',
            label: 'Reset Defaults',
            variant: 'secondary',
            actionType: 'reset_params',
          },
          {
            id: 'btn-apply',
            type: 'button',
            label: '⚡ Apply Swarm Parameters',
            variant: 'primary',
            actionType: 'apply_params',
          },
        ],
      },
    ],
  },
  'spark-pipeline': {
    id: 'spark-pipeline-controller',
    title: '✨ Gemini Spark Task Pipeline Controller',
    description: 'Dynamically synthesized multi-step execution board for ingested Spark missions.',
    version: '1.0.0',
    layout: 'stack',
    elements: [
      {
        id: 'prog-1',
        type: 'progress',
        label: 'Mission Execution Progress (3 / 4 steps complete)',
        value: 75,
        variant: 'success',
      },
      {
        id: 'task-table',
        type: 'table',
        label: 'Dynamic Execution Steps',
        props: {
          headers: ['Step ID', 'Assigned Persona', 'Target Surface', 'Status'],
          rows: [
            ['ST-101', 'Systems Architect', 'Rust Axum Relay', '✅ Completed'],
            ['ST-102', 'UX Critic', 'Web Browser Surface', '✅ Completed'],
            ['ST-103', 'Hardware Architect', 'SIMD Accelerator', '✅ Completed'],
            ['ST-104', 'Sentinel / QA', 'Verification Suite', '⏳ In Progress'],
          ],
        },
      },
      {
        id: 'btn-trigger-qa',
        type: 'button',
        label: '🛡️ Trigger Final Sentinel Audit',
        variant: 'success',
        actionType: 'trigger_qa_gate',
      },
    ],
  },
  'html-artifact': {
    id: 'self-contained-viz',
    title: '📊 Self-Contained AG-UI Interactive Visualizer',
    description: 'Isolated HTML5 interactive widget generated on demand by AI agent.',
    version: '1.0.0',
    layout: 'stack',
    elements: [
      {
        id: 'html-view',
        type: 'html-artifact',
        props: {
          html: `<div style="padding: 24px; font-family: sans-serif; background: #0f172a; color: #38bdf8; border-radius: 8px; text-align: center;">
            <h3 style="margin-top: 0;">⚡ AG-UI Live Neural Graph</h3>
            <p style="color: #94a3b8; font-size: 13px;">Real-time inter-agent message propagation mesh</p>
            <div style="display: flex; justify-content: space-around; margin: 20px 0;">
              <div style="background: #1e293b; padding: 12px 18px; border-radius: 6px; border: 1px solid #38bdf8;">Claude (Director)</div>
              <div style="color: #10b981; font-weight: bold; align-self: center;">⇄ Synaptic Relay ⇄</div>
              <div style="background: #1e293b; padding: 12px 18px; border-radius: 6px; border: 1px solid #3b82f6;">Gemini (Architect)</div>
            </div>
            <button style="background: #2563eb; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: bold;" onclick="alert('AG-UI PostMessage Triggered!')">Trigger Swarm Pulse</button>
          </div>`,
        },
      },
    ],
  },
};

export const DynamicUISynthesizer: React.FC = () => {
  const [activePreset, setActivePreset] = useState<string>('swarm-tuner');
  const [schema, setSchema] = useState<DynamicUISchema>(PRESET_SCHEMAS['swarm-tuner']);
  const [elementValues, setElementValues] = useState<Record<string, any>>({
    'temp-slider': 0.7,
    'concurrency-slider': 8,
    'strict-mode-toggle': true,
  });
  const [eventLog, setEventLog] = useState<DynamicUIEvent[]>([]);
  const [rawJsonMode, setRawJsonMode] = useState(false);
  const [rawJsonText, setRawJsonText] = useState(
    JSON.stringify(PRESET_SCHEMAS['swarm-tuner'], null, 2)
  );
  const [jsonError, setJsonError] = useState<string | null>(null);

  const handleValueChange = (
    elementId: string,
    value: any,
    eventType: DynamicUIEvent['eventType'] = 'change'
  ) => {
    setElementValues((prev) => ({ ...prev, [elementId]: value }));

    const event: DynamicUIEvent = {
      elementId,
      eventType,
      value,
      schemaId: schema.id,
      timestamp: new Date().toISOString(),
    };

    setEventLog((prev) => [event, ...prev.slice(0, 9)]);
  };

  const handlePresetSelect = (presetKey: string) => {
    setActivePreset(presetKey);
    const selected = PRESET_SCHEMAS[presetKey];
    if (selected) {
      setSchema(selected);
      setRawJsonText(JSON.stringify(selected, null, 2));
      setJsonError(null);
    }
  };

  const handleApplyJson = () => {
    try {
      const parsed = JSON.parse(rawJsonText);
      if (!parsed.id || !parsed.elements) {
        throw new Error("Invalid schema: Must contain 'id' and 'elements' array.");
      }
      setSchema(parsed);
      setJsonError(null);
      setRawJsonMode(false);
    } catch (err: any) {
      setJsonError(err.message || 'Invalid JSON syntax');
    }
  };

  const renderElement = (el: DynamicUIElement): React.ReactNode => {
    const currentValue = elementValues[el.id] !== undefined ? elementValues[el.id] : el.value;

    switch (el.type) {
      case 'container': {
        const isGrid = el.props?.display === 'grid';
        const isFlex = el.props?.display === 'flex';
        return (
          <div
            key={el.id}
            style={{
              display: isGrid ? 'grid' : isFlex ? 'flex' : 'block',
              gridTemplateColumns: isGrid ? `repeat(${el.props?.columns || 2}, 1fr)` : undefined,
              justifyContent: el.props?.justify,
              gap: el.props?.gap || '12px',
              border: el.props?.border ? '1px solid rgba(255, 255, 255, 0.08)' : undefined,
              padding: el.props?.border ? '14px' : undefined,
              borderRadius: el.props?.border ? '8px' : undefined,
              background: el.props?.border ? 'rgba(255, 255, 255, 0.02)' : undefined,
              marginBottom: '12px',
            }}
          >
            {el.children?.map((child) => renderElement(child))}
          </div>
        );
      }

      case 'metric':
        return (
          <div
            key={el.id}
            style={{
              background: 'rgba(30, 41, 59, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '14px',
              borderRadius: '8px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
              {el.label}
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#38bdf8' }}>{el.value}</div>
          </div>
        );

      case 'slider':
        return (
          <div key={el.id} style={{ marginBottom: '14px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '13px',
                marginBottom: '4px',
              }}
            >
              <label style={{ color: '#cbd5e1' }}>{el.label}</label>
              <span style={{ color: '#38bdf8', fontWeight: 600 }}>{currentValue}</span>
            </div>
            <input
              type="range"
              min={el.min ?? 0}
              max={el.max ?? 100}
              step={el.step ?? 1}
              value={currentValue ?? 0}
              onChange={(e) => handleValueChange(el.id, parseFloat(e.target.value), 'change')}
              style={{ width: '100%', accentColor: '#2563eb', cursor: 'pointer' }}
            />
          </div>
        );

      case 'toggle':
        return (
          <div
            key={el.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 0',
              fontSize: '13px',
              marginBottom: '8px',
            }}
          >
            <label style={{ color: '#cbd5e1' }}>{el.label}</label>
            <input
              type="checkbox"
              checked={Boolean(currentValue)}
              onChange={(e) => handleValueChange(el.id, e.target.checked, 'toggle')}
              style={{ cursor: 'pointer', width: '18px', height: '18px' }}
            />
          </div>
        );

      case 'progress':
        return (
          <div key={el.id} style={{ marginBottom: '16px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '13px',
                marginBottom: '6px',
              }}
            >
              <label style={{ color: '#cbd5e1' }}>{el.label}</label>
              <span style={{ color: '#10b981', fontWeight: 600 }}>{currentValue}%</span>
            </div>
            <div
              style={{
                background: '#0f172a',
                borderRadius: '6px',
                height: '10px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${currentValue}%`,
                  height: '100%',
                  background: '#10b981',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>
        );

      case 'table':
        return (
          <div key={el.id} style={{ marginBottom: '16px' }}>
            {el.label && (
              <div
                style={{ fontSize: '14px', fontWeight: 600, color: '#93c5fd', marginBottom: '8px' }}
              >
                {el.label}
              </div>
            )}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'rgba(15, 23, 42, 0.8)', color: '#94a3b8' }}>
                  {el.props?.headers?.map((h: string, idx: number) => (
                    <th
                      key={idx}
                      style={{
                        padding: '10px',
                        textAlign: 'left',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {el.props?.rows?.map((row: string[], rIdx: number) => (
                  <tr key={rIdx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    {row.map((cell: string, cIdx: number) => (
                      <td key={cIdx} style={{ padding: '10px' }}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'html-artifact':
        return (
          <div
            key={el.id}
            dangerouslySetInnerHTML={{ __html: el.props?.html || '<p>No content</p>' }}
            style={{ marginBottom: '14px' }}
          />
        );

      case 'button':
        return (
          <button
            key={el.id}
            onClick={() => handleValueChange(el.id, el.actionPayload || {}, 'click')}
            style={{
              padding: '10px 18px',
              borderRadius: '6px',
              background: el.variant === 'secondary' ? 'rgba(255, 255, 255, 0.08)' : '#2563eb',
              color: 'white',
              border: el.variant === 'secondary' ? '1px solid rgba(255, 255, 255, 0.2)' : 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '13px',
            }}
          >
            {el.label}
          </button>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px 16px', color: '#f8fafc' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          paddingBottom: '16px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 6px 0', color: '#38bdf8' }}>
            🎨 AG-UI Dynamic UI Synthesizer
          </h1>
          <p style={{ margin: 0, fontSize: '14px', color: '#94a3b8' }}>
            On-demand generative UI execution engine with real-time bidirectional agent event
            streaming.
          </p>
        </div>

        <button
          onClick={() => setRawJsonMode(!rawJsonMode)}
          style={{
            background: rawJsonMode ? '#3b82f6' : 'rgba(255, 255, 255, 0.05)',
            color: 'white',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '13px',
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          {rawJsonMode ? '👁️ View Live Render' : '📝 Edit AG-UI Schema'}
        </button>
      </div>

      {/* Preset Selector */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <button
          onClick={() => handlePresetSelect('swarm-tuner')}
          style={{
            background: activePreset === 'swarm-tuner' ? '#2563eb' : 'rgba(255, 255, 255, 0.04)',
            color: activePreset === 'swarm-tuner' ? 'white' : '#cbd5e1',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '13px',
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          🎛️ Swarm Parameter Tuner
        </button>
        <button
          onClick={() => handlePresetSelect('spark-pipeline')}
          style={{
            background: activePreset === 'spark-pipeline' ? '#2563eb' : 'rgba(255, 255, 255, 0.04)',
            color: activePreset === 'spark-pipeline' ? 'white' : '#cbd5e1',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '13px',
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          ✨ Spark Pipeline Board
        </button>
        <button
          onClick={() => handlePresetSelect('html-artifact')}
          style={{
            background: activePreset === 'html-artifact' ? '#2563eb' : 'rgba(255, 255, 255, 0.04)',
            color: activePreset === 'html-artifact' ? 'white' : '#cbd5e1',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '13px',
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          📊 Self-Contained HTML Widget
        </button>
      </div>

      {/* Main Area */}
      {rawJsonMode ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <textarea
            rows={16}
            value={rawJsonText}
            onChange={(e) => setRawJsonText(e.target.value)}
            style={{
              background: '#0f172a',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#38bdf8',
              fontFamily: 'monospace',
              fontSize: '13px',
              padding: '14px',
              borderRadius: '8px',
            }}
          />
          {jsonError && <div style={{ color: '#ef4444', fontSize: '13px' }}>⚠️ {jsonError}</div>}
          <button
            onClick={handleApplyJson}
            style={{
              alignSelf: 'flex-start',
              padding: '10px 22px',
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '13px',
            }}
          >
            ⚡ Render Dynamic UI
          </button>
        </div>
      ) : (
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '20px',
            borderRadius: '8px',
          }}
        >
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', color: '#f8fafc' }}>
              {schema.title}
            </h3>
            {schema.description && (
              <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>{schema.description}</p>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {schema.elements.map((el) => renderElement(el))}
          </div>
        </div>
      )}

      {/* Bidirectional Event Stream Log */}
      <div
        style={{
          marginTop: '16px',
          background: 'rgba(15, 23, 42, 0.4)',
          padding: '14px',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.05)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px',
          }}
        >
          <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 600 }}>
            📡 Bidirectional Event Stream ({eventLog.length} events emitted to Swarm Relay)
          </span>
          <span style={{ fontSize: '11px', color: '#10b981' }}>● AG-UI Channel Active</span>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            maxHeight: '140px',
            overflowY: 'auto',
          }}
        >
          {eventLog.length === 0 && (
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              Interact with the dynamic controls above to stream events.
            </div>
          )}
          {eventLog.map((ev, i) => (
            <div key={i} style={{ fontSize: '11px', color: '#a7f3d0', fontFamily: 'monospace' }}>
              [{ev.timestamp.split('T')[1].slice(0, 8)}] {ev.eventType.toUpperCase()} on{' '}
              <span style={{ color: '#38bdf8' }}>{ev.elementId}</span>: {JSON.stringify(ev.value)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DynamicUISynthesizer;
