import React from 'react';
import ReactDOM from 'react-dom';
import './options.css';

const Options: React.FC = () => {
  const [settings, setSettings] = React.useState({
    port: 8080,
    autoStart: false,
    debug: false,
  });

  const handleSave = () => {
    chrome.storage.sync.set(settings, () => {
      // Show success message
    });
  };

  React.useEffect(() => {
    // Load settings on mount
    chrome.storage.sync.get(['port', 'autoStart', 'debug'], (result) => {
      setSettings(prev => ({
        ...prev,
        ...result,
      }));
    });
  }, []);

  return (
    <div className="options-container">
      <h1>The New Fuse Settings</h1>
      
      <div className="option-group">
        <label>
          Port:
          <input
            type="number"
            value={settings.port}
            onChange={(e) => setSettings(prev => ({
              ...prev,
              port: parseInt(e.target.value, 10)
            }))}
          />
        </label>
      </div>

      <div className="option-group">
        <label>
          <input
            type="checkbox"
            checked={settings.autoStart}
            onChange={(e) => setSettings(prev => ({
              ...prev,
              autoStart: e.target.checked
            }))}
          />
          Auto-start server
        </label>
      </div>

      <div className="option-group">
        <label>
          <input
            type="checkbox"
            checked={settings.debug}
            onChange={(e) => setSettings(prev => ({
              ...prev,
              debug: e.target.checked
            }))}
          />
          Debug mode
        </label>
      </div>

      <div className="actions">
        <button onClick={handleSave}>Save Settings</button>
      </div>
    </div>
  );
};

ReactDOM.render(
  <React.StrictMode>
    <Options />
  </React.StrictMode>,
  document.getElementById('root')
);
