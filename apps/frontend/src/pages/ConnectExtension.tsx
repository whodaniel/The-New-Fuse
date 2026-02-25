export default function ConnectExtensionPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <header className="mb-10 rounded-2xl border border-cyan-500/30 bg-slate-900/70 p-8 shadow-[0_0_60px_rgba(6,182,212,0.15)]">
          <div className="flex flex-wrap items-center gap-4">
            <img src="/logo.svg" alt="The New Fuse" className="h-12 w-12" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">TNF Connect</h1>
              <p className="text-sm text-cyan-300">
                Chrome Extension Control Center for YouTube -&gt; AI Studio -&gt; Channel Relay
              </p>
            </div>
          </div>
          <p className="mt-5 max-w-3xl text-sm text-slate-300">
            TNF Connect gives you a focused workspace for authenticating YouTube, selecting
            playlists, processing videos, and streaming resulting URLs and analyses into TNF chat
            channels.
          </p>
        </header>

        <main className="grid gap-6 md:grid-cols-2">
          <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-6">
            <h2 className="mb-3 text-lg font-semibold text-cyan-300">Extension Workflow</h2>
            <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-200">
              <li>Sign in to your main Google account in the extension Services tab.</li>
              <li>Refresh playlists and select source + destination playlists.</li>
              <li>Choose processing mode and process selected videos.</li>
              <li>Send URLs or analyses directly to your selected TNF channel.</li>
            </ol>
          </section>

          <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-6">
            <h2 className="mb-3 text-lg font-semibold text-cyan-300">Quick Links</h2>
            <div className="flex flex-col gap-2 text-sm">
              <a
                href="https://aistudio.google.com/"
                target="_blank"
                rel="noreferrer"
                className="rounded-md border border-slate-700 px-3 py-2 hover:border-cyan-400 hover:text-cyan-300"
              >
                Open Google AI Studio
              </a>
              <a
                href="https://notebooklm.google.com/"
                target="_blank"
                rel="noreferrer"
                className="rounded-md border border-slate-700 px-3 py-2 hover:border-cyan-400 hover:text-cyan-300"
              >
                Open NotebookLM
              </a>
              <a
                href="/docs"
                className="rounded-md border border-slate-700 px-3 py-2 hover:border-cyan-400 hover:text-cyan-300"
              >
                TNF Documentation
              </a>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
