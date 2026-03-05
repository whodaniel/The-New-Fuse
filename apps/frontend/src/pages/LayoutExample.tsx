// @ts-nocheck
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const LayoutExample = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold">Layout Example</h1>
            <nav className="space-x-4">
              <a href="#" className="text-blue-600 hover:text-blue-800">
                Home
              </a>
              <a href="#" className="text-gray-600 hover:text-gray-800">
                Dashboard
              </a>
              <a href="#" className="text-gray-600 hover:text-gray-800">
                Settings
              </a>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <aside className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Navigation</CardTitle>
              </CardHeader>
              <CardContent>
                <nav className="space-y-2">
                  <a href="#" className="block py-2 px-3 rounded bg-blue-100 text-blue-700">
                    Dashboard
                  </a>
                  <a href="#" className="block py-2 px-3 rounded hover:bg-gray-100">
                    Projects
                  </a>
                  <a href="#" className="block py-2 px-3 rounded hover:bg-gray-100">
                    Tasks
                  </a>
                  <a href="#" className="block py-2 px-3 rounded hover:bg-gray-100">
                    Settings
                  </a>
                </nav>
              </CardContent>
            </Card>
          </aside>

          <section className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Layout Demonstration</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4">This page demonstrates a typical application layout with:</p>
                <ul className="list-disc list-inside space-y-2 mb-6">
                  <li>Fixed header with navigation</li>
                  <li>Sidebar navigation panel</li>
                  <li>Main content area</li>
                  <li>Responsive design</li>
                </ul>
                <Button>Example Action</Button>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>
    </div>
  );
};

export default LayoutExample;
