import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Button } from 'antd';

/**
 * A specialized ErrorBoundary component for handling WebGL rendering errors
 */
const WebGLErrorBoundary = ({ children, onError }) => {
  // The fallback UI to render when an error occurs
  const FallbackComponent = ({ error, resetErrorBoundary }) => {
    // Determine error type for more helpful message
    let errorMessage = 'There was a problem rendering the 3D factory view.';
    let errorDetails = error?.message || "Unknown error";
    let suggestion = "Please try changing the quality setting to \"Low\".";
    
    // Analyze error message for common issues
    if (errorDetails.includes('WebGL context')) {
      errorMessage = 'WebGL context creation failed.';
      suggestion = 'Please check that your browser and graphics card support WebGL.';
    } else if (errorDetails.includes('texture') || errorDetails.includes('image')) {
      errorMessage = 'Error loading 3D textures or models.';
      suggestion = 'Try reloading the page or switching to low quality mode.';
    } else if (errorDetails.includes('memory') || errorDetails.includes('out of memory')) {
      errorMessage = 'Not enough graphics memory.';
      suggestion = 'Please close other applications or browser tabs and try again.';
    } else if (errorDetails.includes('shader')) {
      errorMessage = 'Shader compilation error.';
      suggestion = 'Your graphics card may not support all required features. Try switching to low quality mode.';
    }
    
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-800">
        <div className="bg-red-50 text-red-800 p-6 rounded-md max-w-md text-center">
          <h3 className="font-bold mb-2 text-xl">3D Rendering Error</h3>
          <p className="mb-3">{errorMessage}</p>
          <p className="mb-4">{suggestion}</p>
          
          <div className="mb-4 flex justify-center space-x-2">
            <Button 
              type="primary" 
              danger
              onClick={resetErrorBoundary}
            >
              Try Again
            </Button>
            <Button 
              onClick={() => window.location.reload()}
            >
              Reload Page
            </Button>
          </div>
          
          {error && (
            <div className="p-3 bg-red-100 rounded text-xs text-left overflow-auto max-h-32">
              <p className="font-semibold mb-1">Technical details:</p>
              <code className="whitespace-pre-wrap break-all">{errorDetails}</code>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Log the error to the console
  const handleError = (error, info) => {
    console.error("WebGL Rendering Error:", error);
    console.error("Error Component Stack:", info?.componentStack || 'No component stack available');
    
    if (onError) {
      onError(error, info);
    }
  };

  return (
    <ErrorBoundary
      FallbackComponent={FallbackComponent}
      onError={handleError}
      onReset={() => {
        console.log('ErrorBoundary reset triggered');
      }}
    >
      {children}
    </ErrorBoundary>
  );
};

export default WebGLErrorBoundary; 