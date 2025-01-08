import React from 'react';
import { 
  Wrench, 
  Package, 
  ShoppingCart,
  CheckCircle, 
  Activity,
  BarChart3,
  TrendingUp,
  TrendingDown
} from "lucide-react";

const MetricCard = ({ title, value, trend, trendPeriod, Icon }) => {
  const isPositive = trend >= 0;
  
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden transition-all hover:shadow-lg p-6 border border-gray-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Icon className="w-5 h-5 text-gray-500" />
          <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        </div>
      </div>
      <div className="mt-4">
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center mt-2 space-x-2">
          {isPositive ? (
            <TrendingUp className="w-4 h-4 text-green-500" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-500" />
          )}
          <span className={`text-sm font-medium ${
            isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            {Math.abs(trend)}%
          </span>
          <span className="text-sm text-gray-500">{trendPeriod}</span>
        </div>
      </div>
    </div>
  );
};

const Analytics = () => {
  const summaryData = {
    totalTools: 4689,
    totalToolsChange: 8.5,
    totalToolsPeriod: 'Up from past week',
    
    availableTools: 293,
    availableToolsChange: 1.3,
    availableToolsPeriod: 'Up from yesterday',
    
    inUseTools: 56,
    inUseToolsChange: 1.3,
    inUseToolsPeriod: 'Up from past week',
    
    totalRequests: 200,
    totalRequestsChange: 8.5,
    totalRequestsPeriod: 'Up from past week',
    
    rawMaterials: 689,
    rawMaterialsChange: 8.5,
    rawMaterialsPeriod: 'Up from past week',
    
    consumables: 89,
    consumablesChange: 8.5,
    consumablesPeriod: 'Up from past week'
  };

  return (
    <div className="p-6 space-y-6">
    
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          title="Total Tools"
          value={summaryData.totalTools.toLocaleString()}
          trend={summaryData.totalToolsChange}
          trendPeriod={summaryData.totalToolsPeriod}
          Icon={Wrench}
        />
        <MetricCard
          title="Raw Materials"
          value={summaryData.rawMaterials.toLocaleString()}
          trend={summaryData.rawMaterialsChange}
          trendPeriod={summaryData.rawMaterialsPeriod}
          Icon={Package}
        />
        <MetricCard
          title="Consumables"
          value={summaryData.consumables.toLocaleString()}
          trend={summaryData.consumablesChange}
          trendPeriod={summaryData.consumablesPeriod}
          Icon={ShoppingCart}
        />
        <MetricCard
          title="Available Tools"
          value={summaryData.availableTools.toLocaleString()}
          trend={summaryData.availableToolsChange}
          trendPeriod={summaryData.availableToolsPeriod}
          Icon={CheckCircle}
        />
        <MetricCard
          title="In Use Tools"
          value={summaryData.inUseTools.toLocaleString()}
          trend={summaryData.inUseToolsChange}
          trendPeriod={summaryData.inUseToolsPeriod}
          Icon={Activity}
        />
        <MetricCard
          title="Total Requests"
          value={summaryData.totalRequests.toLocaleString()}
          trend={summaryData.totalRequestsChange}
          trendPeriod={summaryData.totalRequestsPeriod}
          Icon={BarChart3}
        />
      </div>
    </div>
  );
};

export default Analytics;