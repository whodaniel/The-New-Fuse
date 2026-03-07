import { useAuthorization } from '@/hooks/useAuthorization';
import { useAuth } from '@/providers/AuthProvider';
import { Link } from 'react-router-dom';

const Unauthorized = () => {
  const { user } = useAuth();
  const { userRoles } = useAuthorization();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center">
        <h1 className="text-7xl font-bold text-red-600">401</h1>
        <h2 className="mt-2 text-3xl font-bold text-gray-900">Unauthorized Access</h2>
        <p className="mt-2 text-gray-600">You don't have permission to access this page.</p>

        {user && (
          <div className="mt-4 p-4 bg-gray-100 rounded-lg text-left text-sm">
            <p className="font-semibold">Current Identity:</p>
            <p>
              Email: <span className="font-mono text-gray-700">{user.email}</span>
            </p>
            <p>
              ID: <span className="font-mono text-gray-500 text-xs">{user.id}</span>
            </p>
            <p className="mt-2 font-semibold">Assigned Roles:</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {userRoles.length > 0 ? (
                userRoles.map((role) => (
                  <span
                    key={role}
                    className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs"
                  >
                    {role}
                  </span>
                ))
              ) : (
                <span className="text-gray-500 italic">No roles assigned</span>
              )}
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3">
          <Link
            to="/dashboard"
            className="text-base font-medium text-indigo-600 hover:text-indigo-500"
          >
            Go to Dashboard<span aria-hidden="true"> &rarr;</span>
          </Link>
          <Link
            to="/auth/login"
            className="text-sm text-gray-500 hover:text-gray-700"
            onClick={() => {
              // Optional: Clear auth on click if needed, but the link will just go to login
            }}
          >
            Switch Account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
