import Button from '../ui/Button';

export default function FinalCTA() {
  return (
    <section className="py-22 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-t from-purple-900/20 to-transparent" />

      <div className="container px-4 mx-auto text-center relative z-10">
        <h2 className="text-5xl md:text-7xl font-bold text-white mb-8 tracking-tight">
          Ready to{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            Fuse
          </span>
          ?
        </h2>
        <p className="text-xl text-white/60 mb-12 max-w-2xl mx-auto">
          Join thousands of developers building the next generation of intelligent applications.
        </p>
        <Button
          variant="primary"
          className="h-16 px-10 text-xl shadow-[0_0_50px_-10px_rgba(168,85,247,0.5)]"
        >
          Start Building for Free
        </Button>
      </div>
    </section>
  );
}
