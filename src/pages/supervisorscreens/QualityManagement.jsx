// IPIDGenerationTab.js
import React from 'react';
import { Card, Tabs } from 'antd';
import IPIDDrawingAnalysis from '../supervisorscreens/QualityManagement/IPIDDrawingAnalysis'; // Import the IPID Drawing Analysis component
import Ballooning from "../supervisorscreens/QualityManagement/Ballooing";
import StageInspection from '../supervisorscreens/QualityManagement/StageInspection'; // Import the Stage Inspection component
import FinalInspection from '../supervisorscreens/QualityManagement/FinalInspection'; // Import the Final Inspection component
import Analytics from '../supervisorscreens/QualityManagement/Analytics'; // Import the Analytics component

const { TabPane } = Tabs;

const IPIDGenerationTab = () => {
  return (
    <div className="p-4">
      <Card className="shadow-lg">
        <Tabs defaultActiveKey="1" type="card">
          <TabPane tab="IPID Drawing Analysis" key="1">
            <IPIDDrawingAnalysis /> {/* Call the IPID Drawing Analysis component here */}
          </TabPane>

          <TabPane tab="Ballooning" key="2">
            <Ballooning /> {/* Call the Ballooning & BOC component here */}
          </TabPane>

          <TabPane tab="Stage Inspection" key="3">
            <StageInspection /> {/* Call the Stage Inspection component here */}
          </TabPane>

          <TabPane tab="Final Inspection" key="4">
            <FinalInspection /> {/* Call the Final Inspection component here */}
          </TabPane>

          <TabPane tab="Analytics" key="5">
            <Analytics /> {/* Call the Analytics component here */}
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default IPIDGenerationTab;
