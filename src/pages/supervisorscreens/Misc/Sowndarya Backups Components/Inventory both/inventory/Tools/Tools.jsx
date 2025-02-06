import React, { useState } from 'react';
import { Tabs, Card } from 'antd';
import EndMills from '../Tools/EndMills';
import Drills from '../Tools/Drills';
import Inserts from '../Tools/Inserts';

const { TabPane } = Tabs;

const Tools = () => {
  return (
    <Card>
      <Tabs defaultActiveKey="endmills" type="card"  // Makes tabs more prominent
        size="medium" // Makes tabs larger and more clickable
        animated >
        <Tabs.TabPane tab="End Mills" key="endmills">
          <EndMills />
        </Tabs.TabPane>
        <Tabs.TabPane tab="Drills" key="drills">
          <Drills />
        </Tabs.TabPane>
        <Tabs.TabPane tab="Inserts" key="inserts">
          <Inserts />
        </Tabs.TabPane>
      </Tabs>
    </Card>
  );
};

export default Tools;