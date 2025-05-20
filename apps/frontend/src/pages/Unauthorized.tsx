import { Link } from 'react-router-dom';

const Unauthorized = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center">
        <h1 className="text-7xl font-bold text-red-600">401</h1>
        <h2 className="mt-2 text-3xl font-bold text-gray-900">Unauthorized Access</h2>
        <p className="mt-2 text-gray-600">You don't have permission to access this page.</p>
        <div className="mt-6">
          <Link
            to="/dashboard"
            className="text-base font-medium text-indigo-600 hover:text-indigo-500"
          >
            Go to Dashboard<span aria-hidden="true"> &rarr;</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;