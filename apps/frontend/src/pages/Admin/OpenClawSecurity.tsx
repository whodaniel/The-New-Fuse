import { AlertTriangle, Copy, RefreshCcw, Shield } from 'lucide-react';
import { useEffect, useState } from 'react';
import { GlassCard } from '../../components/ui/premium/GlassCard';
import { PremiumButton } from '../../components/ui/premium/PremiumButton';

export default function OpenClawSecurity() {
  const [provider, setProvider] = useState('openrouter');
  const [profiles, setProfiles] = useState<string[]>([
    '$HOME/.openclaw/openclaw.json',
    '$HOME/.openclaw-dev/openclaw.json',
    '$HOME/.openclaw-sandbox/openclaw.json',
  ]);
  const [cmd, setCmd] = useState('');
  const [copied, setCopied] = useState(false);

  const map: Record<string, { env: string; jq: string }> = {
    openrouter: {
      env: 'OPENROUTER_API_KEY',
      jq: '.models.providers.openrouter.apiKey=$k | .models.providers["openrouter-stealth"].apiKey=$k',
    },
    perplexity: {
      env: 'PERPLEXITY_API_KEY',
      jq: '.models.providers.perplexity.apiKey=$k',
    },
    groq: {
      env: 'GROQ_API_KEY',
      jq: '.models.providers.groq.apiKey=$k',
    },
    kilo: {
      env: 'KILO_API_KEY',
      jq: '.models.providers.kilo.apiKey=$k',
    },
    kilocode: {
      env: 'KILOCODE_API_KEY',
      jq: '.models.providers.kilocode.apiKey=$k',
    },
  };

  const handleProfileChange = (value: string, checked: boolean) => {
    if (checked) {
      setProfiles([...profiles, value]);
    } else {
      setProfiles(profiles.filter((p) => p !== value));
    }
  };

  const generateCommand = () => {
    const p = map[provider];
    const fileList = profiles.length
      ? profiles.map((f) => `"${f}"`).join(' ')
      : '"$HOME/.openclaw/openclaw.json"';

    const command = `read -rsp "Enter ${p.env}: " ${p.env}; echo
for f in ${fileList}; do
  tmp=$(mktemp)
  jq --arg k "$${p.env}" '${p.jq}' "$f" > "$tmp" && mv "$tmp" "$f"
done
unset ${p.env}`;

    setCmd(command);
  };

  useEffect(() => {
    generateCommand();
    setCopied(false);
  }, [provider, profiles]);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-8 max-w-[1200px] mx-auto min-h-screen">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2 flex items-center">
          <Shield className="h-10 w-10 mr-3 text-emerald-500" />
          OpenClaw Secure Key Setup
        </h1>
        <p className="text-gray-400">
          Securely rotate and configure API keys without storing them in history.
        </p>
      </div>

      <GlassCard className="p-8 border-emerald-500/20">
        <div className="mb-6">
          <p className="text-gray-300 mb-4">
            This page does not save keys. It generates commands that prompt for a key at runtime and
            write it into selected OpenClaw profile configs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2">Provider</label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="openrouter">OpenRouter</option>
              <option value="perplexity">Perplexity</option>
              <option value="groq">Groq</option>
              <option value="kilo">Kilo</option>
              <option value="kilocode">KiloCode</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2">
              Environment Variable
            </label>
            <input
              type="text"
              readOnly
              value={map[provider].env}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-gray-400"
            />
          </div>
        </div>

        <div className="mb-8">
          <label className="block text-sm font-bold text-gray-300 mb-3">Profiles to Update</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { val: '$HOME/.openclaw/openclaw.json', label: '~/.openclaw' },
              { val: '$HOME/.openclaw-dev/openclaw.json', label: '~/.openclaw-dev' },
              { val: '$HOME/.openclaw-sandbox/openclaw.json', label: '~/.openclaw-sandbox' },
            ].map((item) => (
              <label
                key={item.val}
                className="flex items-center space-x-3 p-3 border border-slate-700 rounded-lg bg-slate-900/30 cursor-pointer hover:bg-slate-900/50 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={profiles.includes(item.val)}
                  onChange={(e) => handleProfileChange(item.val, e.target.checked)}
                  className="w-4 h-4 rounded border-slate-600 text-emerald-500 focus:ring-emerald-500 bg-slate-800"
                />
                <code className="text-sm font-mono text-gray-300">{item.label}</code>
              </label>
            ))}
          </div>
        </div>

        <div className="mb-8">
          <label className="block text-sm font-bold text-gray-300 mb-2">Generated Command</label>
          <div className="relative">
            <textarea
              readOnly
              value={cmd}
              className="w-full h-48 bg-slate-950 border border-slate-700 rounded-lg p-4 font-mono text-sm text-emerald-400 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50"
            />
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <PremiumButton
            onClick={copyToClipboard}
            variant="gradient"
            className="flex items-center justify-center"
          >
            {copied ? <CheckCircle className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
            {copied ? 'Copied!' : 'Copy Command'}
          </PremiumButton>
          <PremiumButton
            onClick={generateCommand}
            variant="secondary"
            className="flex items-center justify-center"
          >
            <RefreshCcw className="w-4 h-4 mr-2" /> Regenerate
          </PremiumButton>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-700/50">
          <p className="text-sm text-gray-400 mb-2">
            After running, verify with:{' '}
            <code className="bg-slate-900 px-2 py-1 rounded border border-slate-700">
              openclaw models status --json
            </code>
            . Then rotate any key that was previously exposed.
          </p>
          <p className="text-sm text-amber-500 font-semibold flex items-center">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Security note: avoid pasting raw API keys directly into shell commands or files.
          </p>
        </div>
      </GlassCard>
    </div>
  );
}

function CheckCircle({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
  );
}
