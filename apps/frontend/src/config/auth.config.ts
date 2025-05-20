export const authConfig = {
  google: {
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
    redirectUri: `${window.location.origin}/auth/google/callback`,
    scope: 'email profile',
  },
  github: {
    clientId: import.meta.env.VITE_GITHUB_CLIENT_ID,
    redirectUri: `${window.location.origin}/auth/github/callback`,
    scope: 'read:user user:email',
  },
  api: {
    baseUrl: import.meta.env.VITE_API_URL,
    endpoints: {
      googleAuth: '/auth/google',
      googleCallback: '/auth/google/callback',
      githubAuth: '/auth/github',
      githubCallback: '/auth/github/callback',
    },
  },
};
