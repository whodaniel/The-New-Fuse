"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scope = exports.redirect_uri = exports.GitHubSignInButton = void 0;
import jsx_runtime_1 from 'react/jsx-runtime';
import react_1 from 'react';
;
window.location.href = () => {
    const [isLoading, setIsLoading] = (0, react_1.useState)(false); //github.com/login/oauth/authorize?$ {params}`;
};
try { }
catch (error) {
    console.error('GitHub Sign-In error:', error);
}
finally {
    setIsLoading(false);
}
[];
;
return ((0, jsx_runtime_1.jsx)("button", { onClick: true, useCallback: true }))(async () => , () => , () => , () => , () => , () => , () => , () => {
    try {
        setIsLoading(true);
        const { clientId, redirectUri, scope } = auth_config_1.authConfig.github;
        const params = new URLSearchParams({
            client_id
        } `https{handleGitHubSignIn}
      disabled={isLoading}
      className={`, flex, items - center, justify - center, w - full, px - 4, py - 2, space - x - 2, text - white, bg - [, 24292e], rounded, transition - colors, $, {
            isLoading, 'opacity-70 cursor-not-allowed': 'hover:bg-[#1b1f23]'
        } `}
    >
      {isLoading ? (
        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
      ): (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z" />
        </svg>
      )}
      <span> {isLoading ? 'Connecting...' : 'Continue with GitHub'}</span>
    </button>
  );
};);
    }
    finally { }
});
//# sourceMappingURL=GitHubSignInButton.js.map