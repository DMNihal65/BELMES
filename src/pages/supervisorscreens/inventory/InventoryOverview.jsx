import React from 'react';
import { Card, Row, Col, Statistic } from 'antd';
import { 
  ToolOutlined, 
  CheckCircleOutlined,
  BarChartOutlined,
  PieChartOutlined,
  LineChartOutlined,
  DashboardOutlined
} from '@ant-design/icons';
import { ArrowUpIcon } from 'lucide-react';

const InventoryOverview = () => {
  // Sample data for cards
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

  const MetricCard = ({ title, value, trend, trendPeriod, icon: Icon }) => {
    return (
      <div className="bg-[#FFFFFF] rounded-xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.1)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)] transition-all duration-300 ease-in-out">
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
            <p className="text-3xl font-semibold text-gray-900">{value}</p>
            <div className="flex items-center gap-1.5">
              <ArrowUpIcon className="w-5 h-5 text-sky-500" />
              <span className="text-sky-500 text-sm font-medium">{trend}%</span>
              <span className="text-gray-500 text-sm">{trendPeriod}</span>
            </div>
          </div>
          <div className="p-4 bg-sky-100 rounded-xl">
            <Icon style={{ fontSize: '40px', color: '#0EA5E9' }} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
    </div>
  );
};

export default InventoryOverview; 