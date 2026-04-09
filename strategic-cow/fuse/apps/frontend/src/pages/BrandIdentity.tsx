import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Download, Palette, Rocket, Sparkles, Type } from 'lucide-react';

/**
 * BRAND IDENTITY & STYLE GUIDE
 * Showcasing the "New Fuse" Visual Language
 */
export const BrandIdentity = () => {
  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 via-slate-900 to-gray-900 text-white overflow-hidden">
      <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* HERO */}
        <div className="text-center mb-20">
          <Badge className="mb-6 bg-white/10 text-white border-white/20">
            <Sparkles className="w-4 h-4 mr-2" />
            Official Brand Guidelines
          </Badge>
          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
            <span className="block text-white">The New Fuse</span>
            <span className="block bg-linear-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Brand Identity
            </span>
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            A comprehensive guide to the visual language, logos, colors, and voice that define our
            premium AI orchestration platform.
          </p>
        </div>

        {/* LOGO CONCEPTS - USER REQUESTED */}
        <section className="mb-32">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
              <Rocket className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white">Logo Concepts</h2>
              <p className="text-gray-400">TNF Monogram Explorations</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Concept 1 */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-xl hover:border-blue-500/50 transition-all duration-300">
              <CardContent className="p-0">
                <div className="aspect-square bg-black relative overflow-hidden rounded-t-lg group">
                  <img
                    src="/assets/brand/logo-monogram-neon.png"
                    alt="Neon Monogram Logo"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/80 to-transparent flex items-end p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="sm" className="w-full bg-white text-black hover:bg-gray-200">
                      <Download className="w-4 h-4 mr-2" /> Download
                    </Button>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2">Neon Monogram</h3>
                  <p className="text-gray-400 text-sm">
                    Futuristic 3D intertwining letters with glowing cyan and purple accents.
                    Cyberpunk aesthetic.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Concept 2 */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-xl hover:border-purple-500/50 transition-all duration-300">
              <CardContent className="p-0">
                <div className="aspect-square bg-black relative overflow-hidden rounded-t-lg group">
                  <img
                    src="/assets/brand/logo-abstract-gradient.png"
                    alt="Abstract Gradient Logo"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/80 to-transparent flex items-end p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="sm" className="w-full bg-white text-black hover:bg-gray-200">
                      <Download className="w-4 h-4 mr-2" /> Download
                    </Button>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2">Abstract Gradient</h3>
                  <p className="text-gray-400 text-sm">
                    Minimalist geometric fusion of TNF letters. Metallic silver with iridescent
                    finishes.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Concept 3 */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-xl hover:border-green-500/50 transition-all duration-300">
              <CardContent className="p-0">
                <div className="aspect-square bg-black relative overflow-hidden rounded-t-lg group">
                  <img
                    src="/assets/brand/logo-circuit-node.png"
                    alt="Circuit Node Logo"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/80 to-transparent flex items-end p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="sm" className="w-full bg-white text-black hover:bg-gray-200">
                      <Download className="w-4 h-4 mr-2" /> Download
                    </Button>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2">Circuit Network</h3>
                  <p className="text-gray-400 text-sm">
                    Node-based connections symbolizing neural networks and data flow. Glassmorphic
                    style.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* COLOR PALETTE */}
        <section className="mb-32">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
              <Palette className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white">Color Palette</h2>
              <p className="text-gray-400">Deep Space Premium Dark</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-4">
              <div className="h-32 rounded-2xl bg-slate-950 border border-white/10 shadow-lg relative overflow-hidden group">
                <span className="absolute bottom-4 left-4 font-mono text-xs text-gray-400 bg-black/50 px-2 py-1 rounded">
                  #020617
                </span>
              </div>
              <div>
                <h4 className="font-bold text-white">Deep Obsidian</h4>
                <p className="text-sm text-gray-500">Primary Background</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="h-32 rounded-2xl bg-blue-600 shadow-lg shadow-blue-500/20 relative overflow-hidden group">
                <span className="absolute bottom-4 left-4 font-mono text-xs text-white/80 bg-black/20 px-2 py-1 rounded">
                  #3b82f6
                </span>
              </div>
              <div>
                <h4 className="font-bold text-white">Electric Blue</h4>
                <p className="text-sm text-gray-500">Primary Action</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="h-32 rounded-2xl bg-purple-600 shadow-lg shadow-purple-500/20 relative overflow-hidden group">
                <span className="absolute bottom-4 left-4 font-mono text-xs text-white/80 bg-black/20 px-2 py-1 rounded">
                  #a855f7
                </span>
              </div>
              <div>
                <h4 className="font-bold text-white">Cosmic Purple</h4>
                <p className="text-sm text-gray-500">Secondary Accent</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="h-32 rounded-2xl bg-pink-500 shadow-lg shadow-pink-500/20 relative overflow-hidden group">
                <span className="absolute bottom-4 left-4 font-mono text-xs text-white/80 bg-black/20 px-2 py-1 rounded">
                  #ec4899
                </span>
              </div>
              <div>
                <h4 className="font-bold text-white">Neon Pink</h4>
                <p className="text-sm text-gray-500">Highlights</p>
              </div>
            </div>
          </div>

          <div className="mt-12 p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl">
            <h3 className="text-xl font-bold mb-6">Gradient Systems</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <div className="h-24 rounded-xl bg-linear-to-r from-blue-400 via-purple-400 to-pink-400"></div>
                <p className="text-sm font-mono text-gray-400">
                  bg-linear-to-r from-blue-400 via-purple-400 to-pink-400
                </p>
                <p className="text-xs text-gray-500">Primary Brand Gradient (Text Clips)</p>
              </div>
              <div className="space-y-2">
                <div className="h-24 rounded-xl bg-linear-to-r from-blue-600 to-purple-600"></div>
                <p className="text-sm font-mono text-gray-400">
                  bg-linear-to-r from-blue-600 to-purple-600
                </p>
                <p className="text-xs text-gray-500">Action Gradient (Buttons)</p>
              </div>
            </div>
          </div>

          <div className="mt-12 p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl">
            <h3 className="text-xl font-bold mb-6 text-white">
              Workflow System Colors (Subtle Palette)
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-indigo-100 p-4 rounded-lg flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-indigo-600 shrink-0"></div>
                <div>
                  <p className="text-indigo-900 font-bold">Agents</p>
                  <p className="text-indigo-600 text-xs">Indigo</p>
                </div>
              </div>
              <div className="bg-emerald-100 p-4 rounded-lg flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-emerald-600 shrink-0"></div>
                <div>
                  <p className="text-emerald-900 font-bold">Tools</p>
                  <p className="text-emerald-600 text-xs">Emerald</p>
                </div>
              </div>
              <div className="bg-violet-100 p-4 rounded-lg flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-violet-600 shrink-0"></div>
                <div>
                  <p className="text-violet-900 font-bold">Prompts</p>
                  <p className="text-violet-600 text-xs">Violet</p>
                </div>
              </div>
              <div className="bg-amber-100 p-4 rounded-lg flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-amber-600 shrink-0"></div>
                <div>
                  <p className="text-amber-900 font-bold">Logic</p>
                  <p className="text-amber-600 text-xs">Amber</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* TYPOGRAPHY */}
        <section className="mb-32">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center text-green-400">
              <Type className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white">Typography</h2>
              <p className="text-gray-400">Modern Technical & Geometric</p>
            </div>
          </div>

          <div className="space-y-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div>
                <h3 className="text-xl font-bold text-gray-400 mb-4 uppercase tracking-wider">
                  Headings
                </h3>
                <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl">
                  <p className="text-6xl md:text-8xl font-black mb-4 font-heading">Outfit</p>
                  <p className="text-gray-400 mb-8">Geometric, Bold, Futuristic</p>
                  <div className="space-y-4">
                    <p className="text-4xl font-bold">The Quick Brown Fox</p>
                    <p className="text-2xl font-semibold">Jumps Over The Lazy Dog</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-400 mb-4 uppercase tracking-wider">
                  Body Copy
                </h3>
                <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl">
                  <p className="text-6xl md:text-8xl font-bold mb-4 font-sans text-blue-400">
                    Plus Jakarta
                  </p>
                  <p className="text-gray-400 mb-8">Clean, Modern, Technical</p>
                  <div className="space-y-4 text-gray-300">
                    <p className="text-lg leading-relaxed">
                      Deploy autonomous agents. Orchestrate multi-model workflows. Scale infinitely.
                      No code. No limits. No compromise.
                    </p>
                    <p className="text-base text-gray-400">
                      Primary body text should be legible, high contrast, and well-spaced.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* VOICE & TONE */}
        <section>
          <div className="flex items-center gap-4 mb-10">
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white">Voice & Tone</h2>
              <p className="text-gray-400">Bold, Confident, & Premium</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
              <CardContent className="p-8">
                <h3 className="text-xl font-bold mb-6 text-green-400">✅ Do This</h3>
                <ul className="space-y-4">
                  <li className="flex gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                    <div>
                      <p className="font-bold text-white">"Agent Swarms"</p>
                      <p className="text-gray-400 text-sm">
                        Deploy hundreds of specialized agents that collaborate autonomously.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                    <div>
                      <p className="font-bold text-white">"No babysitting required."</p>
                      <p className="text-gray-400 text-sm">Powerful, confident statements.</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                    <div>
                      <p className="font-bold text-white">"Build Your AI Empire"</p>
                      <p className="text-gray-400 text-sm">
                        Action-oriented verbs and impressive outcomes.
                      </p>
                    </div>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10 backdrop-blur-xl opacity-60">
              <CardContent className="p-8">
                <h3 className="text-xl font-bold mb-6 text-red-400">❌ Avoid This</h3>
                <ul className="space-y-4">
                  <li className="flex gap-3">
                    <span className="text-red-500 text-lg">✗</span>
                    <div>
                      <p className="font-bold text-gray-300">"Unified Agent Ecosystem"</p>
                      <p className="text-gray-500 text-sm">Boring corporate jargon.</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-red-500 text-lg">✗</span>
                    <div>
                      <p className="font-bold text-gray-300">"Manage and monitor agents"</p>
                      <p className="text-gray-500 text-sm">Generic and passive.</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-red-500 text-lg">✗</span>
                    <div>
                      <p className="font-bold text-gray-300">"Get Started"</p>
                      <p className="text-gray-500 text-sm">Weak Call to Action.</p>
                    </div>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
};

export default BrandIdentity;
