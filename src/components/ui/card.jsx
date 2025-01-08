import React from 'react';

const Card = ({ 
  children, 
  className = '',
  variant = 'default',
  hover = true,
  bordered = true,
  padding = true,
  elevated = true,
  gradient = false,
  onClick
}) => {
  const baseStyles = "rounded-lg transition-all duration-200";
  
  const variantStyles = {
    default: "bg-white",
    primary: "bg-blue-50",
    success: "bg-green-50",
    warning: "bg-yellow-50",
    danger: "bg-red-50",
    info: "bg-cyan-50"
  };

  const hoverStyles = hover ? "hover:shadow-lg hover:-translate-y-0.5" : "";
  const borderStyles = bordered ? "border border-gray-200" : "";
  const paddingStyles = padding ? "p-4" : "";
  const elevatedStyles = elevated ? "shadow-sm" : "";
  const gradientStyles = gradient ? `bg-gradient-to-br ${
    variant === 'default' ? 'from-gray-50 to-white' :
    variant === 'primary' ? 'from-blue-50 to-white' :
    variant === 'success' ? 'from-green-50 to-white' :
    variant === 'warning' ? 'from-yellow-50 to-white' :
    variant === 'danger' ? 'from-red-50 to-white' :
    'from-cyan-50 to-white'
  }` : "";

  const cursorStyles = onClick ? "cursor-pointer" : "";

  return (
    <div
      className={`
        ${baseStyles}
        ${variantStyles[variant]}
        ${hoverStyles}
        ${borderStyles}
        ${paddingStyles}
        ${elevatedStyles}
        ${gradientStyles}
        ${cursorStyles}
        ${className}
      `}
      onClick={onClick}
      role={onClick ? "button" : undefined}
    >
      {children}
    </div>
  );
};

const CardHeader = ({ 
  children, 
  className = '',
  withBorder = true,
  align = 'left'
}) => {
  return (
    <div className={`
      ${withBorder ? 'border-b border-gray-100' : ''}
      ${align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'}
      pb-3 mb-4
      ${className}
    `}>
      {children}
    </div>
  );
};

const CardTitle = ({ 
  children, 
  className = '',
  size = 'default'
}) => {
  const sizeStyles = {
    small: 'text-sm',
    default: 'text-base',
    large: 'text-lg',
    xlarge: 'text-xl'
  };

  return (
    <h3 className={`
      font-semibold
      ${sizeStyles[size]}
      text-gray-900
      ${className}
    `}>
      {children}
    </h3>
  );
};

const CardContent = ({ 
  children, 
  className = '' 
}) => {
  return (
    <div className={className}>
      {children}
    </div>
  );
};

const CardFooter = ({ 
  children, 
  className = '',
  withBorder = true,
  align = 'left'
}) => {
  return (
    <div className={`
      ${withBorder ? 'border-t border-gray-100' : ''}
      ${align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'}
      pt-4 mt-4
      ${className}
    `}>
      {children}
    </div>
  );
};

const CardMetric = ({
  label,
  value,
  icon: Icon,
  trend,
  trendValue,
  className = ''
}) => {
  const getTrendColor = () => {
    if (!trend) return 'text-gray-500';
    return trend === 'up' ? 'text-green-500' : 'text-red-500';
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2 text-gray-500 text-sm">
        {Icon && <Icon className="w-4 h-4" />}
        <span>{label}</span>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold text-gray-900">{value}</span>
        {trendValue && (
          <span className={`text-sm ${getTrendColor()} flex items-center gap-1`}>
            {trend === 'up' ? '↑' : '↓'} {trendValue}
          </span>
        )}
      </div>
    </div>
  );
};

// Export all components
export { Card, CardHeader, CardTitle, CardContent, CardFooter, CardMetric };

// Example usage JSX:
/*
import { Settings, Users, Activity } from 'lucide-react';

<Card variant="primary" gradient hover>
  <CardHeader withBorder align="left">
    <CardTitle size="large">Dashboard Overview</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="grid grid-cols-3 gap-4">
      <CardMetric
        label="Total Users"
        value="1,234"
        icon={Users}
        trend="up"
        trendValue="12%"
      />
      <CardMetric
        label="System Status"
        value="Healthy"
        icon={Activity}
      />
      <CardMetric
        label="Active Tasks"
        value="45"
        icon={Settings}
        trend="down"
        trendValue="3%"
      />
    </div>
  </CardContent>
  <CardFooter withBorder align="right">
    <button className="text-blue-500 hover:text-blue-600">
      View Details
    </button>
  </CardFooter>
</Card>
*/