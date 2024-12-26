import React from 'react';
import { Tabs } from 'antd';
import Replica from './Replica'; // Import Tools component
import Tools from './Tools'; 

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
      </Tabs>
    </div>
  );
}

export default Inventory;