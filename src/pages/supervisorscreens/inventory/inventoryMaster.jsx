import React from 'react';
import { Tabs } from 'antd';
import Tools from './Tools/Tools'; 
import GaugesAndInstruments from './GaugesAndInstruments';
import Fixtures from './Fixtures';
import RawMaterials from './RawMaterials';
import Consumables from './Consumables';

const { TabPane } = Tabs;

function Inventory() {
  const [isLoading, setIsLoading] = useState(false);

  // Sample data - replace with your actual data
  const stockLevels = [
    { category: 'Tools', current: 245, minimum: 100, maximum: 300 },
    { category: 'Gauges', current: 120, minimum: 50, maximum: 150 },
    { category: 'Fixtures', current: 85, minimum: 40, maximum: 100 },
    { category: 'Raw Materials', current: 320, minimum: 200, maximum: 400 },
    { category: 'Consumables', current: 560, minimum: 300, maximum: 600 }
  ];

  const monthlyUsage = [
    { month: 'Jan', tools: 45, gauges: 12, fixtures: 8, materials: 120, consumables: 200 },
    { month: 'Feb', tools: 38, gauges: 15, fixtures: 10, materials: 140, consumables: 180 },
    { month: 'Mar', tools: 52, gauges: 18, fixtures: 12, materials: 100, consumables: 220 }
  ];

  const getLowStockItems = () => {
    return stockLevels.filter(item => item.current <= item.minimum * 1.2);
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000);
  };

  return (
    <div className="p-3 md:p-6">
      <h1>Master Data</h1>
      <Tabs defaultActiveKey="1" type="card">
          <TabPane tab="Tools" key="Tools">
            <Tools />
          </TabPane>

          <TabPane tab="Gauges And Instruments" key="GaugesAndInstruments">
          <GaugesAndInstruments />
          </TabPane>

          <TabPane tab="Fixtures" key="fixtures">
          <Fixtures />
          </TabPane>

          <TabPane tab="RawMaterials" key="RawMaterials">
          <RawMaterials />
          </TabPane>

          <TabPane tab="Consumables" key="Consumables">
          <Consumables />
          </TabPane>
        </Tabs>
    </div>
  );
}

export default Inventory;