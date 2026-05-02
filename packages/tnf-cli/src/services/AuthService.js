"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const crypto_1 = require("crypto");
const child_process_1 = require("child_process");
class AuthService {
    constructor(configDir) {
        this.credentials = new Map();
        this.configDir = configDir || path.join(os.homedir(), '.config', 'tnf', 'auth');
        this.loadCredentials();
    }
    loadCredentials() {
        const credPath = path.join(this.configDir, 'credentials.json');
        if (fs.existsSync(credPath)) {
            try {
                const creds = JSON.parse(fs.readFileSync(credPath, 'utf8'));
                for (const [name, cred] of Object.entries(creds)) {
                    this.credentials.set(name, cred);
                }
            }
            catch {
                // Credentials don't exist or are invalid
            }
        }
    }
    saveCredentials() {
        if (!fs.existsSync(this.configDir)) {
            fs.mkdirSync(this.configDir, { recursive: true });
        }
        const credPath = path.join(this.configDir, 'credentials.json');
        const credsObj = {};
        for (const [name, cred] of this.credentials) {
            credsObj[name] = cred;
        }
        fs.writeFileSync(credPath, JSON.stringify(credsObj, null, 2));
    }
    listProviders() {
        const providers = [];
        const configuredProviders = [
            { name: 'openai', type: 'api_key' },
            { name: 'anthropic', type: 'api_key' },
            { name: 'google', type: 'oauth' },
            { name: 'github', type: 'oauth' },
            { name: 'gemini', type: 'oauth' },
            { name: 'deepseek', type: 'api_key' },
            { name: 'groq', type: 'api_key' },
            { name: 'openrouter', type: 'api_key' },
        ];
        for (const provider of configuredProviders) {
            const cred = this.credentials.get(provider.name);
            const authenticated = !!cred && (!cred.expiresAt || cred.expiresAt > Date.now());
            providers.push({
                name: provider.name,
                type: provider.type,
                configured: !!cred,
                authenticated,
                expiresAt: cred?.expiresAt ? new Date(cred.expiresAt).toISOString() : undefined,
            });
        }
        for (const [name, cred] of this.credentials) {
            if (!configuredProviders.some(p => p.name === name)) {
                const authenticated = !cred.expiresAt || cred.expiresAt > Date.now();
                providers.push({
                    name,
                    type: cred.type,
                    configured: true,
                    authenticated,
                    expiresAt: cred.expiresAt ? new Date(cred.expiresAt).toISOString() : undefined,
                });
            }
        }
        return providers;
    }
    async login(provider, url) {
        const existingEnvKey = this.getEnvKeyForProvider(provider);
        if (existingEnvKey && process.env[existingEnvKey]) {
            const cred = {
                provider,
                type: 'api_key',
                apiKey: process.env[existingEnvKey],
            };
            this.credentials.set(provider, cred);
            this.saveCredentials();
            return { success: true, message: `Using ${existingEnvKey} from environment` };
        }
        if (provider === 'github') {
            return this.loginGitHub();
        }
        if (provider === 'google' || provider === 'gemini') {
            return this.loginGoogle(provider);
        }
        if (url) {
            return this.loginOAuth(provider, url);
        }
        return {
            success: false,
            message: `No login method available for provider '${provider}'. Set the appropriate API key environment variable or provide an OAuth URL.`,
        };
    }
    getEnvKeyForProvider(provider) {
        const mapping = {
            openai: 'OPENAI_API_KEY',
            anthropic: 'ANTHROPIC_API_KEY',
            google: 'GOOGLE_API_KEY',
            gemini: 'GEMINI_API_KEY',
            deepseek: 'DEEPSEEK_API_KEY',
            groq: 'GROQ_API_KEY',
            openrouter: 'OPENROUTER_API_KEY',
        };
        return mapping[provider.toLowerCase()];
    }
    async loginGitHub() {
        try {
            const result = (0, child_process_1.spawnSync)('gh', ['auth', 'status'], { encoding: 'utf8' });
            if (result.status === 0) {
                const tokenResult = (0, child_process_1.spawnSync)('gh', ['auth', 'token'], { encoding: 'utf8' });
                if (tokenResult.status === 0) {
                    const token = tokenResult.stdout.trim();
                    const cred = {
                        provider: 'github',
                        type: 'oauth',
                        accessToken: token,
                    };
                    this.credentials.set('github', cred);
                    this.saveCredentials();
                    return { success: true, message: 'GitHub authentication verified via gh CLI' };
                }
            }
            const loginUrl = 'https://github.com/login/device';
            return { success: false, message: 'GitHub CLI not authenticated. Run: gh auth login', url: loginUrl };
        }
        catch (e) {
            return { success: false, message: `GitHub login failed: ${e.message}` };
        }
    }
    async loginGoogle(provider) {
        const envKey = provider === 'gemini' ? 'GEMINI_API_KEY' : 'GOOGLE_API_KEY';
        if (process.env[envKey]) {
            const cred = {
                provider,
                type: 'api_key',
                apiKey: process.env[envKey],
            };
            this.credentials.set(provider, cred);
            this.saveCredentials();
            return { success: true, message: `${provider} API key loaded from ${envKey}` };
        }
        return {
            success: false,
            message: `Set ${envKey} environment variable or use OAuth flow`,
            url: 'https://aistudio.google.com/app/apikey',
        };
    }
    async loginOAuth(provider, url) {
        const state = (0, crypto_1.randomBytes)(16).toString('hex');
        const authUrl = new URL(url);
        authUrl.searchParams.set('state', state);
        console.log(`\n  Opening browser to: ${authUrl.toString()}`);
        console.log(`  Waiting for authorization...\n`);
        try {
            const opener = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
            (0, child_process_1.spawnSync)(opener, [authUrl.toString()]);
        }
        catch {
            // Browser open failed, user can manually navigate
        }
        return {
            success: false,
            message: `OAuth flow initiated. After authorizing, run: tnf auth set-token ${provider} <token>`,
        };
    }
    setToken(provider, token, options) {
        const cred = {
            provider,
            type: 'oauth',
            accessToken: token,
            refreshToken: options?.refreshToken,
            expiresAt: options?.expiresIn ? Date.now() + options.expiresIn * 1000 : undefined,
        };
        this.credentials.set(provider, cred);
        this.saveCredentials();
    }
    setApiKey(provider, apiKey) {
        const cred = {
            provider,
            type: 'api_key',
            apiKey,
        };
        this.credentials.set(provider, cred);
        this.saveCredentials();
    }
    logout(provider) {
        const existed = this.credentials.delete(provider);
        if (existed) {
            this.saveCredentials();
        }
        return existed;
    }
    getCredential(provider) {
        return this.credentials.get(provider);
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=AuthService.js.map