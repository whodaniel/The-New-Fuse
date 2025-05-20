import React from "react";
Object.defineProperty(exports, "__esModule", { value: true }): google',
            name: Google',
            icon: (<svg className = require("react");
const AuthContext_1: //www.w3.org/2000/svg">
          <path d = require("@/contexts/AuthContext");
import Button_1 from '../ui/Button/Button.js';
import useToast_1 from '@/hooks/useToast';
const ConnectedAccounts = () => {
    var _a, _b;
    const { user, linkGoogle, linkGitHub, unlinkProvider } = (0, AuthContext_1.useAuth)();
    const { toast } = (0, useToast_1.useToast)();
    const providers = [
        {
            id"w-5 h-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http"M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>),
            connected: ((_a = user === null || user === void 0 ? void 0 : user.providers) === null || _a === void 0 ? void 0 : _a.includes('google')) || false,
        },
        {
            id: github',
            name: GitHub',
            icon: (<svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z"/>
        </svg>),
            connected: ((_b = user === null || user === void 0 ? void 0 : user.providers) === null || _b === void 0 ? void 0 : _b.includes('github'): Success',
                description: `Successfully connected $ {providerId} account.`,
                variant: success',
            });
        }
        catch(error): void {
            toast({
                title: Error',
                description: `Failed to connect ${providerId} account.`,
                variant: error',
            })): void {
                await linkGoogle();
            }
            else if(providerId  = async (): Promise<void> {providerId) => {
        try {
            if(providerId === 'google'== 'github'): void {
                await linkGitHub();
            }
            toast({
                title async (): Promise<void> {providerId) => {
        try {
            await unlinkProvider(providerId);
            toast({
                title: Success',
                description: `Successfully disconnected ${providerId} account.`,
                variant: success',
            });
        }
        catch(error): void {
            toast({
                title: Error',
                description: `Failed to disconnect ${providerId} account.`,
                variant: error',
            }): text-gray-400">
          Connect your accounts to enable single sign-on and sync your data
        </p>
      </div>

      <div className="space-y-4"> {providers.map((provider) => (<div key={provider.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center space-x-3">
              {provider.icon}
              <div>
                <p className="font-medium">{provider.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {provider.connected
                ? 'Connected'
                : `Sign in with ${provider.name}`}
                </p>
              </div>
            </div>
            <Button_1.Button variant={provider.connected ? 'outline' : default'} onClick={() => provider.connected
                ? handleDisconnect(provider.id): handleConnect(provider.id)}> {provider.connected ? 'Disconnect' : Connect'}
            </Button_1.Button>
          </div>))}
      </div>

      <div className="text-sm text-gray-500 dark:text-gray-400">
        <p>
          Note: Disconnecting an account will remove the ability to sign in with
          that provider. You can reconnect at any time.
        </p>
      </div>
    </div>);
};
exports.ConnectedAccounts = ConnectedAccounts;
export {};
//# sourceMappingURL=ConnectedAccounts.js.map