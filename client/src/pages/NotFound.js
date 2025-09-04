import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <div className="text-6xl mb-4">🌿</div>
          <h2 className="text-6xl font-bold text-gray-900 mb-4">404</h2>
          <h3 className="text-2xl font-semibold text-gray-700 mb-4">Page Not Found</h3>
          <p className="text-gray-600 mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="space-y-4">
          <Link
            to="/"
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
          >
            🏠 Go to Dashboard
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
          >
            ← Go Back
          </button>
        </div>

        <div className="mt-8 text-sm text-gray-500">
          <p>Need help? Contact support or check our documentation.</p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;