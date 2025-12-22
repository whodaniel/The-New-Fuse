import { AnimatePresence, motion } from 'framer-motion';
import React, { useState } from 'react';

interface SetupStep {
  id: string;
  title: string;
  description: string;
}

const STEPS: SetupStep[] = [
  { id: 'intro', title: 'Introduction', description: 'Understanding how the integration works' },
  { id: 'gcp', title: 'Google Cloud Setup', description: 'Creating a project and credentials' },
  { id: 'download', title: 'Server Installation', description: 'Setting up the local server' },
  { id: 'auth', title: 'Authentication', description: 'Authorizing with your Google Account' },
  { id: 'finish', title: 'Complete', description: 'Verification and final steps' },
];

interface GoogleDriveWizardProps {
  onClose: () => void;
  onComplete: () => void;
}

export const GoogleDriveWizard: React.FC<GoogleDriveWizardProps> = ({ onClose, onComplete }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [authCode, setAuthCode] = useState('');
  const [credentialsFile, setCredentialsFile] = useState<File | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const currentStep = STEPS[currentStepIndex];

  const addLog = (msg: string) => setLogs((prev) => [...prev, `> ${msg}`]);

  const handleNext = () => {
    if (currentStepIndex < STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      onComplete();
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCredentialsFile(e.target.files[0]);
    }
  };

  const simulateServerInstall = async () => {
    setLoading(true);
    addLog('Cloning repository: https://github.com/a-bonus/google-docs-mcp.git...');
    await new Promise((r) => setTimeout(r, 1500));
    addLog('Repository cloned successfully.');

    addLog('Installing dependencies (npm install)...');
    await new Promise((r) => setTimeout(r, 2000));
    addLog('Dependencies installed.');

    addLog('Building server (npm run build)...');
    await new Promise((r) => setTimeout(r, 1500));
    addLog('Build complete.');

    setLoading(false);
    handleNext();
  };

  const simulateAuthFlow = async () => {
    setLoading(true);
    addLog('Starting server for authentication...');
    await new Promise((r) => setTimeout(r, 1000));

    const mockAuthUrl =
      'https://accounts.google.com/o/oauth2/v2/auth?access_type=offline&scope=...';
    // In a real app, this would come from the backend process

    addLog(`Please visit: ${mockAuthUrl}`);
    addLog('Waiting for auth code input...');
    setLoading(false);
  };

  const openAuthUrl = () => {
    const url =
      'https://accounts.google.com/o/oauth2/v2/auth?access_type=offline&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fdocuments%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fdrive&response_type=code&client_id=YOUR_CLIENT_ID&redirect_uri=http%3A%2F%2Flocalhost';
    window.open(url, '_blank');
  };

  const verifyAuth = async () => {
    if (!authCode) return;
    setLoading(true);
    addLog('Verifying code...');
    await new Promise((r) => setTimeout(r, 1500));
    addLog('Token saved to token.json');
    addLog('Authentication successful!');
    setLoading(false);
    handleNext();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#1a1b1e] border border-gray-800 rounded-2xl w-full max-w-4xl h-[600px] flex overflow-hidden shadow-2xl"
      >
        {/* Sidebar */}
        <div className="w-64 bg-[#141517] border-r border-gray-800 p-6 flex flex-col">
          <div className="mb-8">
            <h3 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Drive Setup
            </h3>
            <p className="text-xs text-gray-500 mt-1">MCP Integration Wizard</p>
          </div>

          <div className="space-y-2">
            {STEPS.map((step, index) => {
              const isActive = index === currentStepIndex;
              const isCompleted = index < currentStepIndex;

              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-3 p-3 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : isCompleted
                        ? 'text-gray-400'
                        : 'text-gray-600'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border ${
                      isActive
                        ? 'border-emerald-500 bg-emerald-500 text-black'
                        : isCompleted
                          ? 'border-emerald-900 bg-emerald-900/40 text-emerald-500'
                          : 'border-gray-700 bg-gray-800 text-gray-500'
                    }`}
                  >
                    {isCompleted ? '✓' : index + 1}
                  </div>
                  <div>
                    <div className="font-medium">{step.title}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 p-8 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="h-full"
              >
                <h2 className="text-2xl font-bold text-white mb-2">{currentStep.title}</h2>
                <p className="text-gray-400 mb-8">{currentStep.description}</p>

                {currentStep.id === 'intro' && (
                  <div className="space-y-6">
                    <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-xl">
                      <h4 className="text-blue-400 font-bold mb-2">How it works</h4>
                      <p className="text-gray-300 text-sm leading-relaxed">
                        This wizard will help you set up a <strong>local MCP server</strong> that
                        acts as a secure bridge between your AI agents and your Google Drive.
                      </p>
                      <ul className="list-disc list-inside mt-4 space-y-2 text-sm text-gray-400">
                        <li>Your data stays private (tokens stored locally)</li>
                        <li>Direct connection to Google APIs</li>
                        <li>Enables reading, writing, and editing docs</li>
                      </ul>
                    </div>
                  </div>
                )}

                {currentStep.id === 'gcp' && (
                  <div className="space-y-6">
                    <p className="text-sm text-gray-300">
                      To access your personal Google Drive, we need to create a "Project" in the
                      Google Cloud Console.
                    </p>

                    <div className="grid gap-4">
                      <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-bold text-white">
                            1. Create Project & Enable APIs
                          </span>
                          <a
                            href="https://console.cloud.google.com/projectcreate"
                            target="_blank"
                            className="text-emerald-400 text-xs hover:underline"
                          >
                            Open Console ↗
                          </a>
                        </div>
                        <p className="text-xs text-gray-500">
                          Enable: Google Drive API, Google Docs API
                        </p>
                      </div>

                      <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-bold text-white">2. Configure OAuth</span>
                        </div>
                        <ul className="text-xs text-gray-500 list-disc list-inside">
                          <li>Go to 'APIs & Services' {'>'} 'OAuth consent screen'</li>
                          <li>Select 'External'</li>
                          <li>
                            Add scope: <code>.../auth/drive.file</code> or{' '}
                            <code>.../auth/drive</code>
                          </li>
                          <li>Add your email as a 'Test User'</li>
                        </ul>
                      </div>

                      <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-bold text-white">3. Download Credentials</span>
                        </div>
                        <p className="text-xs text-gray-500 mb-3">
                          Create 'OAuth Client ID' (Desktop App), download the JSON, rename to{' '}
                          <code>credentials.json</code>.
                        </p>

                        <div className="relative border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-emerald-500 transition-colors">
                          <input
                            type="file"
                            accept=".json"
                            onChange={handleFileUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          <div className="text-sm text-gray-400">
                            {credentialsFile ? (
                              <span className="text-emerald-400 font-bold">
                                📄 {credentialsFile.name} loaded
                              </span>
                            ) : (
                              'Drag & drop credentials.json here'
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep.id === 'download' && (
                  <div className="space-y-6">
                    <p className="text-sm text-gray-300">
                      We will now download the open-source MCP server code and install its
                      dependencies.
                    </p>

                    <div className="bg-black/50 rounded-lg p-4 h-48 overflow-y-auto font-mono text-xs border border-gray-800">
                      {logs.length === 0 && (
                        <span className="text-gray-600">Waiting to start...</span>
                      )}
                      {logs.map((log, i) => (
                        <div key={i} className="text-emerald-500/80 mb-1">
                          {log}
                        </div>
                      ))}
                    </div>

                    {!loading && logs.length === 0 && (
                      <button
                        onClick={simulateServerInstall}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors"
                      >
                        Start Installation
                      </button>
                    )}
                  </div>
                )}

                {currentStep.id === 'auth' && (
                  <div className="space-y-6">
                    <p className="text-sm text-gray-300">
                      Almost there! We need to authorize the server to access your account one time.
                    </p>

                    <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 space-y-4">
                      <div>
                        <span className="text-xs font-bold text-gray-500 uppercase">Step 1</span>
                        <p className="text-sm text-white">
                          Click to open the Google authorization page.
                        </p>
                        <button
                          onClick={openAuthUrl}
                          className="mt-2 px-4 py-2 bg-blue-600/20 text-blue-400 border border-blue-600/30 rounded-lg text-sm hover:bg-blue-600/30"
                        >
                          Open Google Auth Page ↗
                        </button>
                      </div>

                      <div>
                        <span className="text-xs font-bold text-gray-500 uppercase">Step 2</span>
                        <p className="text-sm text-white mb-2">Paste the code you received here:</p>
                        <input
                          type="text"
                          value={authCode}
                          onChange={(e) => setAuthCode(e.target.value)}
                          placeholder="4/0A..."
                          className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-emerald-500 focus:outline-none font-mono text-sm"
                        />
                      </div>
                    </div>

                    <div className="bg-black/50 rounded-lg p-4 h-32 overflow-y-auto font-mono text-xs border border-gray-800">
                      {logs.map((log, i) => (
                        <div key={i} className="text-emerald-500/80 mb-1">
                          {log}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {currentStep.id === 'finish' && (
                  <div className="text-center py-10">
                    <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                      <span className="text-3xl">🎉</span>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Setup Complete!</h3>
                    <p className="text-gray-400 max-w-md mx-auto mb-8">
                      Your Google Drive MCP server is running. You can now direct your agents to
                      read documents, create files, and search your drive.
                    </p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-800 flex justify-between items-center bg-[#141517]">
            <button
              onClick={currentStepIndex === 0 ? onClose : handleBack}
              className="text-gray-400 hover:text-white text-sm font-medium px-4 py-2"
            >
              {currentStepIndex === 0 ? 'Cancel' : 'Back'}
            </button>

            {currentStep.id === 'auth' ? (
              <button
                onClick={verifyAuth}
                disabled={!authCode || loading}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Verifying...' : 'Verify Code'}
              </button>
            ) : (
              currentStep.id !== 'download' && (
                <button
                  onClick={handleNext}
                  disabled={currentStep.id === 'gcp' && !credentialsFile}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {currentStepIndex === STEPS.length - 1 ? 'Finish' : 'Next'}
                </button>
              )
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
