import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Book, Code, Globe, Rocket, Terminal } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Docs = () => {
  return (
    <div className="min-h-screen flex flex-col bg-linear-to-br from-gray-900 via-slate-900 to-gray-900 text-white">
      <main className="grow">
        <section className="py-20 lg:py-32 bg-linear-to-br from-indigo-600 via-purple-700 to-blue-800 text-white text-center">
          <div className="container mx-auto px-4">
            <Badge className="mb-6 bg-white/10 text-white border-white/20">
              <Book className="w-4 h-4 mr-2" />
              Comprehensive Documentation
            </Badge>
            <h1 className="text-5xl lg:text-7xl font-bold mb-6">Developer Documentation</h1>
            <p className="text-xl lg:text-2xl mb-10 text-blue-100 max-w-4xl mx-auto">
              Everything you need to build with The New Fuse platform.
            </p>
            <Button
              asChild
              size="lg"
              className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-4 text-lg font-semibold"
            >
              <Link to="/auth/register">
                <Rocket className="mr-2 h-5 w-5" />
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>

        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                Documentation Sections
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Explore our comprehensive documentation
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card>
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-lg bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-4">
                    <Code className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-900">API Reference</h3>
                  <p className="text-gray-600 text-sm">
                    Comprehensive API documentation and examples
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-lg bg-linear-to-br from-green-500 to-green-600 flex items-center justify-center mb-4">
                    <Terminal className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-900">CLI Guide</h3>
                  <p className="text-gray-600 text-sm">Command-line interface documentation</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-lg bg-linear-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-4">
                    <Globe className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-900">SDK Documentation</h3>
                  <p className="text-gray-600 text-sm">TypeScript/JavaScript SDK reference</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-20 bg-white text-center">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">Need Help?</h2>
            <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto">
              Check out our documentation or contact support.
            </p>
            <Button
              asChild
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-semibold"
            >
              <Link to="/auth/register">Get Started</Link>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-3 mb-4 hover:opacity-80 transition-opacity"
          >
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Rocket className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">The New Fuse</span>
          </Link>
          <p className="text-gray-400 text-sm mb-4">AI Agent Orchestration Platform</p>
          <div className="flex justify-center gap-6 text-sm text-gray-400">
            <Link to="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <Link to="/pricing" className="hover:text-white transition-colors">
              Pricing
            </Link>
            <Link to="/legal/privacy" className="hover:text-white transition-colors">
              Privacy
            </Link>
            <Link to="/legal/terms" className="hover:text-white transition-colors">
              Terms
            </Link>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            © {new Date().getFullYear()} The New Fuse. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Docs;
