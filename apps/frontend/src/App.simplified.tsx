// @ts-nocheck
/**
 * App.simplified.tsx
 *
 * Minimal hello-world entry used only by main.simplified.tsx (and referenced
 * in apps/frontend/tsconfig.json). It exists to verify the React/Vite entry
 * pipeline renders without pulling in the full app tree. If you're triaging a
 * blank-screen boot, swap index.html's <script src=.../main.tsx> to
 * main.simplified.tsx and reload; if this renders, the failure is inside
 * the full app bootstrap (theme/auth/router), not the toolchain.
 */

export function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>The New Fuse</h1>
        <p>React Application is now running!</p>
      </header>
      <main>
        <div className="card">
          <h2>Welcome to The New Fuse</h2>
          <p>A next-generation platform for AI agent collaboration and communication</p>
        </div>
      </main>
    </div>
  );
}
