import React from 'react';
import { Tabs } from 'antd';
import Replica from './Replica'; // Import Tools component
import Tools from './Tools'; 
import GaugesAndInstruments from './GaugesAndInstruments';
import Fixtures from './Fixtures';
import RawMaterials from './RawMaterials';
import Consumables from './Consumables';

function Inventory() {
  return (
    <div className="p-3 md:p-6">
      <h1>Master Data</h1>
      <Tabs defaultActiveKey="analytics">
        {/* <Tabs.TabPane tab="Replica" key="replica">
          <Replica />
        </Tabs.TabPane> */}
        <Tabs.TabPane tab="Tools" key="tools">
          <Tools />
        </Tabs.TabPane>
        <Tabs.TabPane tab="Gauges And Instruments" key="GaugesAndInstruments">
          <GaugesAndInstruments />
        </Tabs.TabPane>
        <Tabs.TabPane tab="Fixtures" key="fixtures">
          <Fixtures />
        </Tabs.TabPane>
        <Tabs.TabPane tab="RawMaterials" key="RawMaterials">
          <RawMaterials />
        </Tabs.TabPane>
        <Tabs.TabPane tab="Consumables" key="Consumables">
          <Consumables />
        </Tabs.TabPane>
      </Tabs>
    </div>
  );
}

export default Inventory;