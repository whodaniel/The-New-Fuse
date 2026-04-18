import React from 'react';
import ReactDOM from 'react-dom';
import { CONFIG } from '../config.js';
import './options.css';

const Options: React.FC = () => {
  const [settings, setSettings] = React.useState({
    port: CONFIG.WS_PORT,
    autoStart: false,
    debug: false,
    web3Enabled: true,
    web3Config: {
      ipfsGateway: 'https://ipfs.io',
      arweaveGateway: 'https://arweave.net',
      swarmGateway: 'https://gateway.ethswarm.org',
    },
    udAuthConfig: {
      clientID: '',
      clientSecret: '',
      redirectUri: chrome.runtime.getURL('popup.html'),
      scope: 'openid wallet email:optional humanity_check:optional',
    },
  });

  const handleSave = () => {
    chrome.storage.sync.set(settings, () => {
      // Show success message
    });
  };

  React.useEffect(() => {
    // Load settings on mount
    chrome.storage.sync.get(
      ['port', 'autoStart', 'debug', 'web3Enabled', 'web3Config', 'udAuthConfig'],
      (result: { [key: string]: any }) => {
        const loadedSettings: any = {};
        if (result.port !== undefined) loadedSettings.port = result.port;
        if (result.autoStart !== undefined) loadedSettings.autoStart = result.autoStart;
        if (result.debug !== undefined) loadedSettings.debug = result.debug;
        if (result.web3Enabled !== undefined) loadedSettings.web3Enabled = result.web3Enabled;
        if (result.web3Config !== undefined) loadedSettings.web3Config = result.web3Config;
        if (result.udAuthConfig !== undefined) loadedSettings.udAuthConfig = result.udAuthConfig;

        setSettings((prev) => ({
          ...prev, // This now includes CONFIG.WS_PORT as the initial default for port
          ...loadedSettings, // Override with any loaded settings
        }));
      }
    );
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
            onChange={(e) =>
              setSettings((prev) => ({
                ...prev,
                port: parseInt(e.target.value, 10),
              }))
            }
          />
        </label>
      </div>

      <div className="option-group">
        <label>
          <input
            type="checkbox"
            checked={settings.autoStart}
            onChange={(e) =>
              setSettings((prev) => ({
                ...prev,
                autoStart: e.target.checked,
              }))
            }
          />
          Auto-start server
        </label>
      </div>

      <div className="option-group">
        <label>
          <input
            type="checkbox"
            checked={settings.debug}
            onChange={(e) =>
              setSettings((prev) => ({
                ...prev,
                debug: e.target.checked,
              }))
            }
          />
          Debug mode
        </label>
      </div>

      <div className="option-group web3-settings-group">
        <h2>Web3 URL Support</h2>
        <p className="description">
          Automatically resolve decentralized web URLs (IPFS, IPNS, ENS, Arweave, Swarm) to HTTP
          gateways.
        </p>

        <div className="option-group">
          <label>
            <input
              type="checkbox"
              checked={settings.web3Enabled}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  web3Enabled: e.target.checked,
                }))
              }
            />
            Enable Web3 URL resolution
          </label>
        </div>

        {settings.web3Enabled && (
          <>
            <div className="option-group">
              <label>
                IPFS Gateway:
                <input
                  type="text"
                  value={settings.web3Config.ipfsGateway}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      web3Config: {
                        ...prev.web3Config,
                        ipfsGateway: e.target.value,
                      },
                    }))
                  }
                  placeholder="https://ipfs.io"
                />
              </label>
              <small>Gateway for ipfs:// and ipns:// URLs</small>
            </div>

            <div className="option-group">
              <label>
                Arweave Gateway:
                <input
                  type="text"
                  value={settings.web3Config.arweaveGateway}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      web3Config: {
                        ...prev.web3Config,
                        arweaveGateway: e.target.value,
                      },
                    }))
                  }
                  placeholder="https://arweave.net"
                />
              </label>
              <small>Gateway for ar:// URLs</small>
            </div>

            <div className="option-group">
              <label>
                Swarm Gateway:
                <input
                  type="text"
                  value={settings.web3Config.swarmGateway}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      web3Config: {
                        ...prev.web3Config,
                        swarmGateway: e.target.value,
                      },
                    }))
                  }
                  placeholder="https://gateway.ethswarm.org"
                />
              </label>
              <small>Gateway for bzz:// URLs</small>
            </div>

            <div className="web3-info">
              <h3>Supported Protocols:</h3>
              <ul>
                <li>
                  <code>ipfs://</code> - InterPlanetary File System
                </li>
                <li>
                  <code>ipns://</code> - IPFS Name System
                </li>
                <li>
                  <code>ens://</code> - Ethereum Name Service (.eth domains)
                </li>
                <li>
                  <code>ar://</code> - Arweave Permanent Storage
                </li>
                <li>
                  <code>bzz://</code> - Swarm Distributed Storage
                </li>
              </ul>
            </div>
          </>
        )}
      </div>

      <div className="option-group ud-settings-group">
        <h2>Unstoppable Domains Authentication</h2>
        <p className="description">
          Configure Login with Unstoppable to enable Web3 domain-based authentication.
        </p>

        <div className="ud-info-box">
          <h4>Setup Instructions:</h4>
          <ol>
            <li>
              Go to{' '}
              <a
                href="https://dashboard.unstoppabledomains.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                Unstoppable Domains Dashboard
              </a>
            </li>
            <li>Create a new application and get your Client ID</li>
            <li>
              Set the redirect URI to: <code>{settings.udAuthConfig.redirectUri}</code>
            </li>
            <li>Copy your credentials below and save</li>
          </ol>
        </div>

        <div className="option-group">
          <label>
            Client ID:
            <input
              type="text"
              value={settings.udAuthConfig.clientID}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  udAuthConfig: {
                    ...prev.udAuthConfig,
                    clientID: e.target.value,
                  },
                }))
              }
              placeholder="Enter your Unstoppable Domains Client ID"
            />
          </label>
          <small>Your application's Client ID from Unstoppable Domains dashboard</small>
        </div>

        <div className="option-group">
          <label>
            Client Secret (Optional):
            <input
              type="password"
              value={settings.udAuthConfig.clientSecret}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  udAuthConfig: {
                    ...prev.udAuthConfig,
                    clientSecret: e.target.value,
                  },
                }))
              }
              placeholder="Enter your Client Secret (optional)"
            />
          </label>
          <small>Optional: Required only for server-side applications</small>
        </div>

        <div className="option-group">
          <label>
            Redirect URI:
            <input
              type="text"
              value={settings.udAuthConfig.redirectUri}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  udAuthConfig: {
                    ...prev.udAuthConfig,
                    redirectUri: e.target.value,
                  },
                }))
              }
              placeholder="Redirect URI"
              disabled
            />
          </label>
          <small>This is automatically set based on your extension URL</small>
        </div>

        <div className="option-group">
          <label>
            Scope:
            <input
              type="text"
              value={settings.udAuthConfig.scope}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  udAuthConfig: {
                    ...prev.udAuthConfig,
                    scope: e.target.value,
                  },
                }))
              }
              placeholder="openid wallet email:optional"
            />
          </label>
          <small>
            Permissions requested: openid (required), wallet, email:optional,
            humanity_check:optional
          </small>
        </div>

        <div className="ud-features">
          <h4>Available Features:</h4>
          <ul>
            <li>✓ Login with Web3 domains (.crypto, .nft, .blockchain, etc.)</li>
            <li>✓ Access to user's wallet addresses</li>
            <li>✓ Verified multi-chain addresses</li>
            <li>✓ Email and profile information (optional)</li>
            <li>✓ Humanity check verification</li>
          </ul>
        </div>
      </div>

      <div className="actions">
        <button onClick={handleSave}>Save Settings</button>
      </div>

      <div className="option-group developer-tools-group">
        <h2>Developer Tools</h2>
        <button
          id="openHtmlShowcase"
          onClick={() => {
            const url = chrome.runtime.getURL('ui-html-css/index.html');
            chrome.tabs.create({ url });
          }}
        >
          Open HTML Showcase
        </button>
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
