import React from 'react';
const ErrorFallback = ({ error, resetErrorBoundary }) => {
    return (<div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h2 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h2>
      <pre className="text-sm bg-gray-100 p-4 rounded mb-4 overflow-auto max-w-full">
        {error.message}
      </pre>
      <button onClick={resetErrorBoundary} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
        Try again
      </button>
    </div>);
};
export default ErrorFallback;
//# sourceMappingURL=ErrorFallback.js.map