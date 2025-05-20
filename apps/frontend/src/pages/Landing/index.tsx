import { Link } from 'react-router-dom';
export default function LandingPage() {
    return (<div className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold mb-6">Welcome to The New Fuse</h1>
      <p className="text-xl mb-8 text-center max-w-2xl">
        Discover a new way to collaborate and manage your workspaces efficiently.
      </p>
      <div className="space-x-4">
        <Link to="/login" className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200">
          Sign In
        </Link>
      </div>
    </div>);
}
//# sourceMappingURL=index.js.map