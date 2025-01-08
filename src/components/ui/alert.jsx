// Alert Components
const Alert = ({ 
    children,
    variant = 'default',
    className = '',
    icon,
    onClose
  }) => {
    const variantStyles = {
      default: "bg-gray-100 text-gray-800 border-gray-200",
      info: "bg-blue-50 text-blue-800 border-blue-200",
      success: "bg-green-50 text-green-800 border-green-200",
      warning: "bg-yellow-50 text-yellow-800 border-yellow-200",
      error: "bg-red-50 text-red-800 border-red-200"
    };
  
    return (
      <div className={`
        p-4 rounded-lg border
        ${variantStyles[variant]}
        ${className}
      `}
      role="alert"
      >
        <div className="flex items-start">
          {icon && <span className="mr-3 mt-0.5">{icon}</span>}
          <div className="flex-1">{children}</div>
          {onClose && (
            <button
              onClick={onClose}
              className="ml-3 -mt-1 -mr-1 p-1 rounded-md hover:bg-gray-200/50"
            >
              <span className="sr-only">Dismiss</span>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
    );
  };
  
  const AlertDescription = ({ 
    children,
    className = '' 
  }) => {
    return (
      <div className={`text-sm mt-1 ${className}`}>
        {children}
      </div>
    );
  };
  
  // Export all components
  export {
    // Button,
    // Tabs,
    // TabsList,
    // TabsTrigger,
    // TabsContent,
    Alert,
    AlertDescription
  };
  