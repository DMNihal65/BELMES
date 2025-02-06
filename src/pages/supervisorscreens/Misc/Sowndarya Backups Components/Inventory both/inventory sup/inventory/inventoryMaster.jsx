import React from 'react';
import { Tabs } from 'antd';
import Tools from './Tools/Tools'; 
import GaugesAndInstruments from './GaugesAndInstruments';
import Fixtures from './Fixtures';
import RawMaterials from './RawMaterials';
import Consumables from './Consumables';

const { TabPane } = Tabs;

function Inventory() {
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