import React from 'react';

// Button Component
const Button = ({ 
  children,
  variant = 'default',
  size = 'default',
  className = '',
  disabled = false,
  icon,
  onClick,
  type = 'button',
  fullWidth = false,
  loading = false
}) => {
  const baseStyles = "rounded-md font-medium transition-all duration-200 inline-flex items-center justify-center";
  
  const variantStyles = {
    default: "bg-gray-900 text-white hover:bg-gray-800 active:bg-gray-950",
    primary: "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800",
    secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200 active:bg-gray-300",
    outline: "border-2 border-gray-200 bg-transparent hover:bg-gray-50 text-gray-700",
    ghost: "bg-transparent hover:bg-gray-100 text-gray-700",
    danger: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800"
  };

  const sizeStyles = {
    small: "px-3 py-1.5 text-sm",
    default: "px-4 py-2",
    large: "px-6 py-3 text-lg",
    icon: "p-2"
  };

  const disabledStyles = disabled || loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer";
  const widthStyles = fullWidth ? "w-full" : "";

  return (
    <button
      type={type}
      className={`
        ${baseStyles}
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${disabledStyles}
        ${widthStyles}
        ${className}
      `}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {icon && !loading && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
};

export {
    Button,
    // Tabs,
    // TabsList,
    // TabsTrigger,
    // TabsContent,
    // Alert,
    // AlertDescription
  };