import React from 'react';
import { Card, Tabs } from 'antd';
import Tools from './Tools/Tools'; 
import GaugesAndInstruments from './GaugesAndInstruments';
import Fixtures from './Fixtures';
import RawMaterials from './RawMaterials';
import Consumables from './Consumables';

const { TabPane } = Tabs;

function Inventory() {
  return (
    <div className="p-1 md:p-2 ">
      <h1>Operator Master Data</h1>
      {/* <Card className="shadow-lg  bg-gray-50"> */}
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
      {/* </Card> */}
    </div>
  );
}

export default Inventory;