import React from 'react';
import { ToolOutlined, CheckCircleOutlined, DownloadOutlined, BarChartOutlined, PieChartOutlined, LineChartOutlined, DashboardOutlined } from '@ant-design/icons';
import MetricCard from './MetricCard'; // Import MetricCard component

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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-2">
      <MetricCard
        title="Total Tools"
        value={summaryData.totalTools.toLocaleString()}
        trend={summaryData.totalToolsChange}
        trendPeriod={summaryData.totalToolsPeriod}
        icon={ToolOutlined}
      />
      <MetricCard
        title="Raw Materials"
        value={summaryData.rawMaterials.toLocaleString()}
        trend={summaryData.rawMaterialsChange}
        trendPeriod={summaryData.rawMaterialsPeriod}
        icon={BarChartOutlined}
      />
      <MetricCard
        title="Consumables"
        value={summaryData.consumables.toLocaleString()}
        trend={summaryData.consumablesChange}
        trendPeriod={summaryData.consumablesPeriod}
        icon={PieChartOutlined}
      />
      <MetricCard
        title="Available Tools"
        value={summaryData.availableTools.toLocaleString()}
        trend={summaryData.availableToolsChange}
        trendPeriod={summaryData.availableToolsPeriod}
        icon={CheckCircleOutlined}
      />
      <MetricCard
        title="In Use Tools"
        value={summaryData.inUseTools.toLocaleString()}
        trend={summaryData.inUseToolsChange}
        trendPeriod={summaryData.inUseToolsPeriod}
        icon={LineChartOutlined}
      />
      <MetricCard
        title="Total Requests"
        value={summaryData.totalRequests.toLocaleString()}
        trend={summaryData.totalRequestsChange}
        trendPeriod={summaryData.totalRequestsPeriod}
        icon={DashboardOutlined}
      />
    </div>
  );
};

export default Analytics;