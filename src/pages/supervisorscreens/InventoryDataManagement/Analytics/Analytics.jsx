import React from 'react';
import { ToolOutlined, ScissorOutlined, BuildOutlined, BorderInnerOutlined, DashboardOutlined, TableOutlined,  CheckCircleOutlined, DownloadOutlined, BarChartOutlined, PieChartOutlined, LineChartOutlined } from '@ant-design/icons';
import MetricCard from '../cards/MetricCard'; 
import MostRequestedInstruments from '../Analytics/MostRequestedInstruments'

const Analytics = () => {
  const summaryData = {
    totalTools: 4689,
    totalToolsChange: 8.5,
    totalToolsPeriod: 'Up from past week',

    endMills: 1250,
    endMillsChange: 5.2,
    endMillsPeriod: 'Up from past week',
    
    drills: 856,
    drillsChange: 3.7,
    drillsPeriod: 'Up from past week',
    
    inserts: 1580,
    insertsChange: -2.1,
    insertsPeriod: 'Down from past week',
    
    gaugeInstruments: 685,
    gaugeInstrumentsChange: 1.8,
    gaugeInstrumentsPeriod: 'Up from past week',
    
    fixtures: 318,
    fixturesChange: 0.5,
    fixturesPeriod: 'Up from past week',
    
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
    <>
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5 lg:gap-6 p-2 sm:p-3 md:p-4 lg:p-5">
      <MetricCard
        title="Total Tools"
        value={summaryData.totalTools.toLocaleString()}
        trend={summaryData.totalToolsChange}
        trendPeriod={summaryData.totalToolsPeriod}
        icon={ToolOutlined}
      />
       <MetricCard
        title="End Mills"
        value={summaryData.endMills.toLocaleString()}
        trend={summaryData.endMillsChange}
        trendPeriod={summaryData.endMillsPeriod}
        icon={ScissorOutlined}  // Changed from ToolOutlined
      />
      <MetricCard
        title="Drills"
        value={summaryData.drills.toLocaleString()}
        trend={summaryData.drillsChange}
        trendPeriod={summaryData.drillsPeriod}
        icon={BuildOutlined}  // Changed from ToolOutlined
      />
      <MetricCard
        title="Inserts"
        value={summaryData.inserts.toLocaleString()}
        trend={summaryData.insertsChange}
        trendPeriod={summaryData.insertsPeriod}
        icon={BorderInnerOutlined}  // Changed from ToolOutlined
      />
      <MetricCard
        title="Gauge & Instruments"
        value={summaryData.gaugeInstruments.toLocaleString()}
        trend={summaryData.gaugeInstrumentsChange}
        trendPeriod={summaryData.gaugeInstrumentsPeriod}
        icon={DashboardOutlined}  // Changed from ToolOutlined
      />
      <MetricCard
        title="Fixtures"
        value={summaryData.fixtures.toLocaleString()}
        trend={summaryData.fixturesChange}
        trendPeriod={summaryData.fixturesPeriod}
        icon={TableOutlined}  // Changed from ToolOutlined
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
    <MostRequestedInstruments />
    </>
  );
};

export default Analytics;