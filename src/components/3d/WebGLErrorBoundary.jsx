import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';

/**
 * A specialized ErrorBoundary component for handling WebGL rendering errors
 */
const WebGLErrorBoundary = ({ children, onError }) => {
  // The fallback UI to render when an error occurs
  const FallbackComponent = ({ error }) => (
    <div className="h-full w-full flex items-center justify-center bg-gray-800">
      <div className="bg-red-50 text-red-800 p-4 rounded-md max-w-md text-center">
        <h3 className="font-bold mb-2">Error rendering 3D scene</h3>
        <p>There was a problem rendering the 3D factory view. Please try changing the quality setting to "Low".</p>
        {error && (
          <div className="mt-4 p-2 bg-red-100 rounded text-xs text-left overflow-auto max-h-24">
            <p className="font-semibold">Error details:</p>
            <p>{error.message || "Unknown error"}</p>
          </div>
        )}
      </div>
    </div>
  );

  // Log the error to the console
  const handleError = (error, info) => {
    console.error("WebGL Rendering Error:", error);
    console.error("Error Info:", info);
    if (onError) {
      onError(error, info);
    }
  };

  return (
    <ErrorBoundary
      FallbackComponent={FallbackComponent}
      onError={handleError}
    >
      {children}
    </ErrorBoundary>
  );
};

export default WebGLErrorBoundary; 