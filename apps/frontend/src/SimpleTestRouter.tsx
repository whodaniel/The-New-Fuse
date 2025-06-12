import React from 'react';
import { Routes, Route, Link, BrowserRouter } from 'react-router-dom';

// Simple test component
function SimpleHome() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">🚀 The New Fuse - Test Mode</h1>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
        <p className="text-lg mb-4">This is a simplified test version.</p>
        <p className="text-gray-600 mb-4">If you see this, the basic routing is working.</p>
        <div className="space-y-2">
          <Link to="/test-page" className="block text-blue-600 hover:text-blue-800">
            → Test Page
          </Link>
          <Link to="/comprehensive" className="block text-blue-600 hover:text-blue-800">
            → Back to Comprehensive Router
          </Link>
        </div>
      </div>
    </div>
  );
}

function TestPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">✅ Test Page</h1>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
        <p className="text-lg mb-4">Test page is working!</p>
        <Link to="/" className="text-blue-600 hover:text-blue-800">
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}

export default function SimpleTestRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SimpleHome />} />
        <Route path="/test-page" element={<TestPage />} />
        <Route path="*" element={
          <div className="p-8 text-center">
            <h1 className="text-3xl font-bold text-red-600 mb-4">404 - Page Not Found</h1>
            <Link to="/" className="text-blue-600 hover:text-blue-800">Go Home</Link>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}
