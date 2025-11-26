// Tabs Components
import React from 'react';
const TabsContext = React.createContext(null);

const Tabs = ({ 
  children, 
  defaultValue, 
  value, 
  onChange,
  className = '' 
}) => {
  const [activeTab, setActiveTab] = React.useState(value || defaultValue);

  const handleChange = (newValue) => {
    if (!value) {
      setActiveTab(newValue);
    }
    onChange?.(newValue);
  };

  return (
    <TabsContext.Provider value={{ value: value || activeTab, onChange: handleChange }}>
      <div className={`w-full ${className}`}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

const TabsList = ({ 
  children,
  className = '',
  variant = 'default'
}) => {
  const variantStyles = {
    default: "bg-gray-100 p-1 rounded-lg",
    pills: "space-x-2",
    underline: "border-b border-gray-200"
  };

  return (
    <div className={`
      flex items-center
      ${variantStyles[variant]}
      ${className}
    `}>
      {children}
    </div>
  );
};

const TabsTrigger = ({ 
  children,
  value,
  className = '',
  disabled = false
}) => {
  const { value: activeValue, onChange } = React.useContext(TabsContext);
  const isActive = activeValue === value;

  const baseStyles = "px-4 py-2 rounded-md text-sm font-medium transition-all duration-200";
  const activeStyles = isActive ? 
    "bg-white shadow text-gray-900" : 
    "text-gray-600 hover:text-gray-900 hover:bg-gray-50";
  const disabledStyles = disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer";

  return (
    <button
      className={`
        ${baseStyles}
        ${activeStyles}
        ${disabledStyles}
        ${className}
      `}
      onClick={() => !disabled && onChange(value)}
      disabled={disabled}
      role="tab"
      aria-selected={isActive}
    >
      {children}
    </button>
  );
};

const TabsContent = ({ 
  children,
  value,
  className = '' 
}) => {
  const { value: activeValue } = React.useContext(TabsContext);
  
  if (activeValue !== value) return null;

  return (
    <div className={`mt-4 ${className}`} role="tabpanel">
      {children}
    </div>
  );
};
export {
    // Button,
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent,
    // Alert,
    // AlertDescription
  };
