# thenewfuse.com Authenticated Audit

## Auth Attempt
- method: register
- success: False
- message: registration did not authenticate
- email: codex.audit.1772507225@example.com
- login_after_register_success: False
- login_after_register_message: login rejected

## Route Results
- /dashboard -> status=200 final=https://thenewfuse.com/auth/login issues=['auth-gated (redirected to sign-in)']
- /chat -> status=200 final=https://thenewfuse.com/auth/login issues=['auth-gated (redirected to sign-in)']
- /tasks -> status=200 final=https://thenewfuse.com/auth/login issues=['auth-gated (redirected to sign-in)']
- /timeline -> status=200 final=https://thenewfuse.com/auth/login issues=['auth-gated (redirected to sign-in)']
- /analytics -> status=200 final=https://thenewfuse.com/auth/login issues=['auth-gated (redirected to sign-in)']
- /command-center -> status=200 final=https://thenewfuse.com/unauthorized issues=['unauthorized-state-visible']
- /ai-portal -> status=200 final=https://thenewfuse.com/auth/login issues=['auth-gated (redirected to sign-in)']
- /agents -> status=200 final=https://thenewfuse.com/auth/login issues=['auth-gated (redirected to sign-in)']
- /workflows -> status=200 final=https://thenewfuse.com/auth/login issues=['auth-gated (redirected to sign-in)']
- /suggestions -> status=200 final=https://thenewfuse.com/auth/login issues=['auth-gated (redirected to sign-in)']
- /hub -> status=200 final=https://thenewfuse.com/auth/login issues=['auth-gated (redirected to sign-in)']
- /observatory -> status=None final=about:blank issues=[]
- /settings -> status=200 final=https://thenewfuse.com/auth/login issues=['auth-gated (redirected to sign-in)']
- /profile -> status=200 final=https://thenewfuse.com/profile issues=['console errors (2)']
- /workspace/overview -> status=200 final=https://thenewfuse.com/auth/login issues=['auth-gated (redirected to sign-in)']
- /workspace/settings -> status=200 final=https://thenewfuse.com/auth/login issues=['auth-gated (redirected to sign-in)']
- /workspace-settings/chat-model -> status=200 final=https://thenewfuse.com/workspace-settings/chat-model issues=['runtime errors (1)']
- /workspace-settings/llm-selection -> status=200 final=https://thenewfuse.com/workspace-settings/llm-selection issues=['runtime errors (1)']
- /admin -> status=200 final=https://thenewfuse.com/unauthorized issues=['unauthorized-state-visible']
- /admin/users -> status=200 final=https://thenewfuse.com/unauthorized issues=['unauthorized-state-visible']
- /admin/dashboard -> status=200 final=https://thenewfuse.com/unauthorized issues=[]
